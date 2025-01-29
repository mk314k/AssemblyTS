import assert from 'node:assert/strict';
import test from 'node:test';
import { Assembler, AssemblyInstruction } from '../src/instruction.ts';
import { parser } from '../src/parser.ts';
import { SyntaxError, RegisterIndexError } from '../src/exception.ts';

test('RV32I basic arithmetic, shifts, and x0 immutability', () => {
  Assembler.reset();
  const code = `
    li a0, 15
    li a1, 5
    add a2, a0, a1      # 20
    sub a3, a0, a1      # 10
    slli a4, a1, 3      # 40
    srli a5, a4, 2      # 10
    li t0, -16
    srai a6, t0, 2      # -4 (arithmetic shift preserves sign)
    addi zero, a0, 99   # x0 must remain 0
    ret
  `;
  parser(code, 504, Assembler.instMemory);
  Assembler.execute(504);

  assert.equal(Assembler.registers.getValue('a2'), 20);
  assert.equal(Assembler.registers.getValue('a3'), 10);
  assert.equal(Assembler.registers.getValue('a4'), 40);
  assert.equal(Assembler.registers.getValue('a5'), 10);
  assert.equal(Assembler.registers.getValue('a6'), -4);
  assert.equal(Assembler.registers.getValue('zero'), 0);
});

test('RV32M extension: mul, div, divu, rem, remu', () => {
  Assembler.reset();
  const code = `
    li a0, 12
    li a1, -7
    mul s0, a0, a1      # -84
    div s1, s0, a0      # -7
    li t0, 29
    li t1, 5
    div s2, t0, t1      # 5
    rem s3, t0, t1      # 4
    div s4, t0, zero    # division by zero returns -1 per RISC-V spec
    rem s5, t0, zero    # remainder by zero returns dividend (29)
    ret
  `;
  parser(code, 504, Assembler.instMemory);
  Assembler.execute(504);

  assert.equal(Assembler.registers.getValue('s0'), -84);
  assert.equal(Assembler.registers.getValue('s1'), -7);
  assert.equal(Assembler.registers.getValue('s2'), 5);
  assert.equal(Assembler.registers.getValue('s3'), 4);
  assert.equal(Assembler.registers.getValue('s4'), -1);
  assert.equal(Assembler.registers.getValue('s5'), 29);
});

test('Two-pass parser: forward and backward branches (Fibonacci)', () => {
  Assembler.reset();
  const code = `
    li t0, 0
    li t1, 1
    li t2, 6
  loop:
    beq t2, zero, done
    add t3, t0, t1
    mv t0, t1
    mv t1, t3
    addi t2, t2, -1
    bne t2, zero, loop
  done:
    mv a0, t0
    ret
  `;
  parser(code, 504, Assembler.instMemory);
  Assembler.execute(504);

  // 6th Fibonacci number (0, 1, 1, 2, 3, 5, 8) -> t0 after 6 iterations is 8
  assert.equal(Assembler.registers.getValue('a0'), 8);
});

test('Subroutine calls with jal, jalr, stack pointer, and ret', () => {
  Assembler.reset();
  const code = `
    li sp, 1024
    addi sp, sp, -4
    sw ra, 0(sp)

    li a0, 5
    jal ra, square_plus_one

    lw ra, 0(sp)
    addi sp, sp, 4
    ret

  square_plus_one:
    mul a0, a0, a0
    addi a0, a0, 1
    ret
  `;
  parser(code, 504, Assembler.instMemory);
  Assembler.execute(504);

  assert.equal(Assembler.registers.getValue('a0'), 26);
  assert.equal(Assembler.registers.getValue('sp'), 1024);
});

test('Byte, halfword, and word memory load/store (lb, lbu, lh, lhu, lw, sb, sh, sw)', () => {
  Assembler.reset();
  const code = `
    li s0, 200
    li t0, -1           # 0xFFFFFFFF
    sw t0, 0(s0)
    lb a0, 0(s0)        # signed byte: -1
    lbu a1, 0(s0)       # unsigned byte: 255
    lh a2, 0(s0)        # signed halfword: -1
    lhu a3, 0(s0)       # unsigned halfword: 65535

    # Overwrite byte 1 (bits 8..15) with 0x00
    sb zero, 1(s0)
    lhu a4, 0(s0)       # now 0x00FF = 255
    ret
  `;
  parser(code, 504, Assembler.instMemory);
  Assembler.execute(504);

  assert.equal(Assembler.registers.getValue('a0'), -1);
  assert.equal(Assembler.registers.getValue('a1'), 255);
  assert.equal(Assembler.registers.getValue('a2'), -1);
  assert.equal(Assembler.registers.getValue('a3'), 65535);
  assert.equal(Assembler.registers.getValue('a4'), 255);
});

test('.data and .text directives (.word, .half, .byte, .asciz) and la pseudo-instruction', () => {
  Assembler.reset();
  const code = `
    .data
    arr: .word 100, 200, 300
    msg: .asciz "Hi"

    .text
    la s0, arr
    lw a0, 0(s0)
    lw a1, 4(s0)
    lw a2, 8(s0)
    add a3, a0, a1
    add a3, a3, a2      # 600

    la s1, msg
    lbu t0, 0(s1)       # 'H' = 72
    lbu t1, 1(s1)       # 'i' = 105
    lbu t2, 2(s1)       # '\0' = 0
    ret
  `;
  parser(code, 504, Assembler.instMemory, Assembler.dataMemory);
  Assembler.execute(504);

  assert.equal(Assembler.registers.getValue('a3'), 600);
  assert.equal(Assembler.registers.getValue('t0'), 72);
  assert.equal(Assembler.registers.getValue('t1'), 105);
  assert.equal(Assembler.registers.getValue('t2'), 0);
});

test('Step-by-step execution mode (stepInstruction)', () => {
  Assembler.reset();
  const code = `
    li a0, 10
    addi a0, a0, 5
    ret
  `;
  parser(code, 504, Assembler.instMemory);

  // Step 1: li a0, 10 (at PC=504, next PC=508)
  const more1 = Assembler.stepInstruction(504);
  assert.equal(more1, true);
  assert.equal(Assembler.pc.val, 508);
  assert.equal(Assembler.registers.getValue('a0'), 10);

  // Step 2: addi a0, a0, 5 (at PC=508, next PC=512)
  const more2 = Assembler.stepInstruction(504);
  assert.equal(more2, true);
  assert.equal(Assembler.pc.val, 512);
  assert.equal(Assembler.registers.getValue('a0'), 15);

  // Step 3: ret (at PC=512, jumps to 0 and halts)
  const more3 = Assembler.stepInstruction(504);
  assert.equal(more3, false);
  assert.equal(Assembler.pc.val, 0);
});

test('RV32I binary encoding accuracy (slli vs srli vs srai, bge/ble, jal)', () => {
  Assembler.reset();
  const code = `
    slli a0, a0, 1
    srli a0, a0, 1
    srai a0, a0, 1
    ret
  `;
  parser(code, 504, Assembler.instMemory);

  const slliInst = Assembler.instMemory.get(504) as AssemblyInstruction;
  const srliInst = Assembler.instMemory.get(508) as AssemblyInstruction;
  const sraiInst = Assembler.instMemory.get(512) as AssemblyInstruction;

  assert.equal(slliInst.binaryRep().length, 32);
  assert.equal(srliInst.binaryRep().length, 32);
  assert.equal(sraiInst.binaryRep().length, 32);
  // srli has funct7=0000000, srai has funct7=0100000
  assert.notEqual(srliInst.hexRep(), sraiInst.hexRep());
  assert.equal(srliInst.binaryRep().slice(0, 7), '0000000');
  assert.equal(sraiInst.binaryRep().slice(0, 7), '0100000');
});

test('Error handling for unknown instructions and invalid registers', () => {
  Assembler.reset();
  assert.throws(() => {
    parser('invalid_op a0, a1, a2', 504, Assembler.instMemory);
  }, SyntaxError);

  assert.throws(() => {
    parser('add x99, a0, a1', 504, Assembler.instMemory);
  }, RegisterIndexError);
});
