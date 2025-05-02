import assert from 'node:assert/strict';
import test from 'node:test';
import { Assembler, AssemblyInstruction } from '../src/instruction.ts';
import { parseArm } from '../src/armParser.ts';
import { SyntaxError, RegisterIndexError } from '../src/exception.ts';

test('ARM default architecture check & switching', () => {
  Assembler.setArch('riscv');
  assert.equal(Assembler.arch, 'riscv');
  Assembler.setArch('arm');
  assert.equal(Assembler.arch, 'arm');
});

test('ARM basic data processing, shifts, multiply, and r0 writable', () => {
  Assembler.setArch('arm');
  Assembler.reset();
  const code = `
    mov r0, #15
    mov r1, #4
    add r2, r0, r1      ; 19
    sub r3, r0, r1      ; 11
    mul r4, r2, r1      ; 76
    lsl r5, r1, #2      ; 16
    lsr r6, r5, #1      ; 8
    mov r7, #-16
    asr r8, r7, #2      ; -4
    bx lr
  `;
  parseArm(code, 504, Assembler.instMemory);
  Assembler.execute(504);

  assert.equal(Assembler.armRegisters.getValue('r0'), 15);
  assert.equal(Assembler.armRegisters.getValue('r1'), 4);
  assert.equal(Assembler.armRegisters.getValue('r2'), 19);
  assert.equal(Assembler.armRegisters.getValue('r3'), 11);
  assert.equal(Assembler.armRegisters.getValue('r4'), 76);
  assert.equal(Assembler.armRegisters.getValue('r5'), 16);
  assert.equal(Assembler.armRegisters.getValue('r6'), 8);
  assert.equal(Assembler.armRegisters.getValue('r8'), -4);
});

test('ARM CPSR condition flags (N, Z, C, V) and conditional branches (CMP, SUBS, BLE, BNE)', () => {
  Assembler.setArch('arm');
  Assembler.reset();
  const code = `
    mov r0, #0          ; sum = 0
    mov r1, #5          ; counter = 5
  loop:
    cmp r1, #0
    ble done
    add r0, r0, r1
    subs r1, r1, #1
    bne loop
  done:
    bx lr
  `;
  parseArm(code, 504, Assembler.instMemory);
  Assembler.execute(504);

  assert.equal(Assembler.armRegisters.getValue('r0'), 15);
  assert.equal(Assembler.armRegisters.getValue('r1'), 0);
  assert.equal(Assembler.armRegisters.flags.z, true);
});

test('ARM subroutine calls with BL, PUSH/POP stack operations, and BX lr', () => {
  Assembler.setArch('arm');
  Assembler.reset();
  const code = `
    mov sp, #1024
    push {lr}
    mov r0, #6
    bl factorial
    pop {lr}
    bx lr

  factorial:
    mov r1, #1
  fact_loop:
    cmp r0, #1
    ble fact_done
    mul r1, r1, r0
    sub r0, r0, #1
    b fact_loop
  fact_done:
    mov r0, r1
    bx lr
  `;
  parseArm(code, 504, Assembler.instMemory);
  Assembler.execute(504);

  assert.equal(Assembler.armRegisters.getValue('r0'), 720);
  assert.equal(Assembler.armRegisters.getValue('sp'), 1024);
});

test('ARM bracket memory addressing [rn, #offset], LDR/STR/LDRB, and .data section', () => {
  Assembler.setArch('arm');
  Assembler.reset();
  const code = `
    .data
    items: .word 100, 200, 300
    label_str: .asciz "ARM"

    .text
    adr r4, items
    ldr r0, [r4]
    ldr r1, [r4, #4]
    ldr r2, [r4, #8]
    add r0, r0, r1
    add r0, r0, r2      ; 600
    str r0, [r4, #16]
    ldr r3, [r4, #16]

    adr r5, label_str
    ldrb r6, [r5, #0]   ; 'A' = 65
    bx lr
  `;
  parseArm(code, 504, Assembler.instMemory, Assembler.dataMemory);
  Assembler.execute(504);

  assert.equal(Assembler.armRegisters.getValue('r3'), 600);
  assert.equal(Assembler.armRegisters.getValue('r6'), 65);
});

test('ARM step-by-step execution and 32-bit binary encodings', () => {
  Assembler.setArch('arm');
  Assembler.reset();
  const code = `
    mov r0, #10
    add r0, r0, #5
    bx lr
  `;
  parseArm(code, 504, Assembler.instMemory);

  const movInst = Assembler.instMemory.get(504) as AssemblyInstruction;
  const addInst = Assembler.instMemory.get(508) as AssemblyInstruction;
  const bxInst = Assembler.instMemory.get(512) as AssemblyInstruction;

  assert.equal(movInst.binaryRep().length, 32);
  assert.equal(addInst.binaryRep().length, 32);
  assert.equal(bxInst.binaryRep().length, 32);

  const more1 = Assembler.stepInstruction(504);
  assert.equal(more1, true);
  assert.equal(Assembler.armRegisters.getValue('r0'), 10);

  const more2 = Assembler.stepInstruction(504);
  assert.equal(more2, true);
  assert.equal(Assembler.armRegisters.getValue('r0'), 15);

  const more3 = Assembler.stepInstruction(504);
  assert.equal(more3, false);

  // Restore default RISC-V mode
  Assembler.setArch('riscv');
});

test('ARM syntax and invalid register error handling', () => {
  Assembler.setArch('arm');
  Assembler.reset();
  assert.throws(() => {
    parseArm('unknown_arm_op r0, r1', 504, Assembler.instMemory);
  }, SyntaxError);

  assert.throws(() => {
    parseArm('mov r16, #5', 504, Assembler.instMemory);
  }, RegisterIndexError);

  Assembler.setArch('riscv');
});
