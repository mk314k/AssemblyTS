import { StateVar } from 'statebinderk';
import { Memory, MemContent, numToBin } from "./memory";
import { Counter, RegisterSet, Register, regValid, regToBin } from "./register";
import { RegisterIndexError, SyntaxError } from "./exception";
import { consoleBox } from "./consoleBox";

const MAX_EXECUTION_STEPS = 10000;

/**
 * The Assembler class represents an Assembler (emulator for hardware
 * components in a computer system.) It contains static properties and methods
 * for managing registers, instruction memory, data memory, program counter,
 * and console output for debugging purpose.
 */
export class Assembler {
  static registers = new RegisterSet();   // 32 Registers
  static instMemory = new Memory();       // Instruction Memory
  static dataMemory = new Memory();       // Data Memory
  static pc = new Counter();              // Program counter for keeping track of the current instruction address
  static consoleLog = "";                 // String for storing console output
  static regElem: HTMLElement | null;
  static memElem: HTMLElement | null;
  static isDataMemActive = false;

  /**
   * Outputs the console log to the specified HTML element.
   */
  static consoleOut = () => {
    if (this.consoleLog.trim().length > 0) {
      consoleBox.log(this.consoleLog, 'output');
    }
  };

  static init(): void {
    this.regElem = document.getElementById("registers");
    this.memElem = document.getElementById("memory");
    Assembler.registers.outHTML(this.regElem);
    if (this.isDataMemActive) {
      Assembler.dataMemory.outHTML(this.memElem);
    } else {
      Assembler.instMemory.outHTML(this.memElem);
    }
  }

  static reset(): void {
    Assembler.registers.reset();
    Assembler.instMemory.clear();
    Assembler.dataMemory.clear();
    Assembler.pc.jump(0);
    Assembler.consoleLog = "";
    Assembler.registers.outHTML(this.regElem);
    if (this.isDataMemActive) {
      Assembler.dataMemory.outHTML(this.memElem);
    } else {
      Assembler.instMemory.outHTML(this.memElem);
    }
  }

  static showInst(): void {
    if (!this.isDataMemActive) {
      Assembler.instMemory.outHTML(this.memElem);
    }
  }

  static showData(): void {
    if (this.isDataMemActive) {
      Assembler.dataMemory.outHTML(this.memElem);
    }
  }

  static execute(addr: number): void {
    Assembler.consoleLog = "";
    Assembler.pc.jump(addr);
    let steps = 0;

    while (Assembler.pc.val !== 0) {
      const inst = Assembler.instMemory.get(Assembler.pc.val) as AssemblyInstruction | undefined;
      if (!inst) {
        if (steps === 0) {
          consoleBox.log(`No instruction found at run address ${addr}. Did you build the code first?`, 'error');
        }
        break;
      }

      inst.execute();
      Assembler.pc.step();
      steps++;

      if (steps >= MAX_EXECUTION_STEPS) {
        throw new SyntaxError(`Execution halted after ${MAX_EXECUTION_STEPS} steps (possible infinite loop).`);
      }
    }

    if (this.isDataMemActive) {
      Assembler.dataMemory.outHTML(this.memElem);
    } else {
      Assembler.instMemory.outHTML(this.memElem);
    }
    Assembler.registers.outHTML(this.regElem);
    Assembler.consoleOut();
  }
}

/**
 * Represents an assembly instruction.
 */
export class AssemblyInstruction implements MemContent {
  /**
   * Creates an instance of AssemblyInstruction.
   * @param reg1 - The first register (or operand).
   * @param reg2 - The second register (or operand).
   * @param reg_num - The third register or an immediate/offset value.
   */
  constructor(
    public readonly reg1?: Register,
    public readonly reg2?: Register,
    public readonly reg_num?: Register
  ) {}

  // Values for binary representation for the instruction
  funct7 = "0000000"; // Function 7 field
  funct3 = "000";     // Function 3 field
  opcode = "0000000"; // Opcode field

  /**
   * Left to be implemented by specific instruction if required
   */
  func = (_: number, __: number, ___?: number): number => {
    throw new Error("function not implemented");
  };

  /**
   * Left to be implemented by specific instructions
   * @returns The binary representation of the instruction.
   */
  binaryRep(): string {
    throw new Error("Not Implemented Binary");
  }

  /**
   * Returns the hexadecimal representation of the instruction.
   * @returns The hexadecimal representation of the instruction.
   */
  hexRep(): string {
    return (this.numValue() >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * @returns The numerical value of the instruction.
   */
  numValue(): number {
    return parseInt(this.binaryRep(), 2) >>> 0;
  }

  /**
   * Executes the instruction.
   */
  execute(): void {
    throw new Error("Not Implemented execute function");
  }
}

/**
 * R-Type Instruction: operates on three registers (rd, rs1, rs2).
 * Format: funct7[31:25] | rs2[24:20] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]
 */
class RegInstruction extends AssemblyInstruction {
  constructor(
    rd: Register,
    rs1: Register,
    rs2: Register
  ) {
    if (regValid(rd) && regValid(rs1) && regValid(rs2)) {
      super(rd, rs1, rs2);
    } else {
      throw new RegisterIndexError();
    }
    this.funct7 = "0000000";
    this.opcode = "0110011";
  }

  binaryRep(): string {
    return (
      this.funct7 +
      regToBin(this.reg_num as Register) +
      regToBin(this.reg2 as Register) +
      this.funct3 +
      regToBin(this.reg1 as Register) +
      this.opcode
    );
  }

  execute(): void {
    Assembler.registers.setValue(
      this.reg1 as Register,
      this.func(
        Assembler.registers.getValue(this.reg2 as Register),
        Assembler.registers.getValue(this.reg_num as Register)
      )
    );
  }
}

/**
 * I-Type Instruction: operates on a register and a 12-bit immediate value (rd, rs1, imm).
 * Format: imm[11:0] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]
 */
class RegImmInstruction extends AssemblyInstruction {
  constructor(
    rd: Register,
    rs1: Register,
    rsval: number
  ) {
    if (regValid(rd) && regValid(rs1) && typeof rsval === 'number' && !isNaN(rsval)) {
      super(rd, rs1, rsval);
    } else {
      throw new RegisterIndexError("Invalid register or immediate value");
    }
    this.opcode = "0010011";
  }

  binaryRep(): string {
    return (
      numToBin(this.reg_num as number, 12) +
      regToBin(this.reg2 as Register) +
      this.funct3 +
      regToBin(this.reg1 as Register) +
      this.opcode
    );
  }

  execute(): void {
    Assembler.registers.setValue(
      this.reg1 as Register,
      this.func(
        Assembler.registers.getValue(this.reg2 as Register),
        this.reg_num as number
      )
    );
  }
}

/**
 * I-Type Shift Immediate Instruction (slli, srli, srai):
 * Format: funct7[31:25] | shamt[24:20] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]
 */
class ShiftImmInstruction extends RegImmInstruction {
  binaryRep(): string {
    const shamt = (this.reg_num as number) & 0x1f;
    return (
      this.funct7 +
      numToBin(shamt, 5) +
      regToBin(this.reg2 as Register) +
      this.funct3 +
      regToBin(this.reg1 as Register) +
      this.opcode
    );
  }
}

/**
 * Memory Instruction: operates on a register, byte offset, and base address register.
 */
class MemInstruction extends AssemblyInstruction {
  constructor(
    rs2: Register,
    offset: number,
    rs1: Register
  ) {
    if (regValid(rs2) && regValid(rs1) && typeof offset === 'number' && !isNaN(offset)) {
      super(rs2, rs1, offset);
    } else {
      throw new RegisterIndexError("Invalid register or memory offset");
    }
    this.funct3 = "010";
  }
}

/**
 * B-Type Branch Instruction: operates on two registers and a PC-relative byte offset.
 * Standard RV32I B-type encoding:
 *   imm[12] | imm[10:5] | rs2 | rs1 | funct3 | imm[4:1] | imm[11] | opcode(1100011)
 * Note: `offset` is a PC-relative byte offset (target_addr - current_PC).
 */
class BranchInstruction extends AssemblyInstruction {
  constructor(
    rs1: Register,
    rs2: Register,
    offset: number
  ) {
    if (regValid(rs2) && regValid(rs1) && typeof offset === 'number' && !isNaN(offset)) {
      super(rs1, rs2, offset);
    } else {
      throw new RegisterIndexError("Invalid register or branch offset");
    }
    this.opcode = "1100011";
  }

  binaryRep(): string {
    // 13-bit signed byte offset: index 0 is bit 12 (MSB), index 12 is bit 0 (LSB, always 0)
    const imm13 = numToBin(this.reg_num as number, 13);
    const bit12 = imm12Bit(imm13, 12);
    const bits10_5 = imm13.slice(2, 8);
    const bits4_1 = imm13.slice(8, 12);
    const bit11 = imm12Bit(imm13, 11);

    return (
      bit12 +
      bits10_5 +
      regToBin(this.reg2 as Register) +
      regToBin(this.reg1 as Register) +
      this.funct3 +
      bits4_1 +
      bit11 +
      this.opcode
    );
  }

  execute(): void {
    // Target PC is current PC + relative byte offset; subtract 4 to compensate for pc.step()
    const targetAddr = Assembler.pc.val + (this.reg_num as number) - 4;
    Assembler.pc.jump(
      this.func(
        Assembler.registers.getValue(this.reg1 as Register),
        Assembler.registers.getValue(this.reg2 as Register),
        targetAddr
      )
    );
  }
}

/**
 * Helper to extract bit `bitIndex` from an N-bit binary string where index 0 is MSB (bit N-1).
 */
function imm12Bit(binStr: string, bitIndex: number): string {
  const n = binStr.length;
  return binStr[n - 1 - bitIndex] ?? '0';
}

/**
 * Console Instruction: custom debugging instruction operating on a single register.
 */
class ConsoleInstruction extends AssemblyInstruction {
  constructor(
    reg: Register,
    mode: string | number = 'dec'
  ) {
    if (regValid(reg)) {
      super(reg, mode);
    } else {
      throw new RegisterIndexError();
    }
  }

  binaryRep(): string {
    return '1'.repeat(32);
  }
}

// Console Instruction: prints the value of a register to the console
class Console extends ConsoleInstruction {
  execute(): void {
    Assembler.consoleLog += Assembler.registers.getValue(this.reg1 as Register) + "\n";
  }
}

// ConsoleMem Instruction: prints the value stored in memory at address in register
class ConsoleMem extends ConsoleInstruction {
  execute(): void {
    const addr = Assembler.registers.getValue(this.reg1 as Register);
    const val = Assembler.dataMemory.get(addr)?.numValue() ?? 0;
    Assembler.consoleLog += val + "\n";
  }
}

// Load word (lw) I-type instruction: loads 32-bit word from data memory into destination register
class Lw extends MemInstruction {
  opcode = '0000011';
  funct3 = '010';

  binaryRep(): string {
    return (
      numToBin(this.reg_num as number, 12) +
      regToBin(this.reg2 as Register) +
      this.funct3 +
      regToBin(this.reg1 as Register) +
      this.opcode
    );
  }

  execute(): void {
    const addr = Assembler.registers.getValue(this.reg2 as Register) + (this.reg_num as number);
    const memData = Assembler.dataMemory.get(addr);
    Assembler.registers.setValue(
      this.reg1 as Register,
      memData ? memData.numValue() : 0
    );
  }
}

// Store word (sw) S-type instruction: stores 32-bit word from source register into data memory
class Sw extends MemInstruction {
  opcode = '0100011';
  funct3 = '010';

  binaryRep(): string {
    const immVal = numToBin(this.reg_num as number, 12);
    return (
      immVal.slice(0, 7) +
      regToBin(this.reg1 as Register) +
      regToBin(this.reg2 as Register) +
      this.funct3 +
      immVal.slice(7) +
      this.opcode
    );
  }

  execute(): void {
    const addr = Assembler.registers.getValue(this.reg2 as Register) + (this.reg_num as number);
    Assembler.dataMemory.set(
      addr,
      new Data(Assembler.registers.getValue(this.reg1 as Register))
    );
  }
}

// Load immediate (li) pseudo-instruction: addi rd, x0, imm
class Li extends RegImmInstruction {
  constructor(rd: Register, liConstant: number) {
    super(rd, 'x0', liConstant);
  }

  execute(): void {
    Assembler.registers.setValue(
      this.reg1 as Register,
      this.reg_num as number
    );
  }
}

// Move (mv) pseudo-instruction: addi rd, rs1, 0
class Mv extends RegImmInstruction {
  constructor(rd: Register, rs1: Register) {
    super(rd, rs1, 0);
    this.funct3 = "000";
  }

  execute(): void {
    Assembler.registers.setValue(
      this.reg1 as Register,
      Assembler.registers.getValue(this.reg2 as Register)
    );
  }
}

// No-operation (nop) pseudo-instruction: addi x0, x0, 0
class Nop extends RegImmInstruction {
  constructor() {
    super('x0', 'x0', 0);
  }

  execute(): void {
    // Do nothing
  }
}

// Load upper immediate (lui) U-type instruction: loads a 20-bit constant into upper 20 bits of rd
class Lui extends RegImmInstruction {
  constructor(rd: Register, luiConstant: number) {
    super(rd, 'x0', luiConstant);
    this.opcode = "0110111";
  }

  binaryRep(): string {
    return (
      numToBin(this.reg_num as number, 20) +
      regToBin(this.reg1 as Register) +
      this.opcode
    );
  }

  execute(): void {
    Assembler.registers.setValue(
      this.reg1 as Register,
      (this.reg_num as number) << 12
    );
  }
}

// Add upper immediate to PC (auipc) U-type instruction: rd = PC + (imm << 12)
class Auipc extends RegImmInstruction {
  constructor(rd: Register, upConstant: number) {
    super(rd, 'x0', upConstant);
    this.opcode = "0010111";
  }

  binaryRep(): string {
    return (
      numToBin(this.reg_num as number, 20) +
      regToBin(this.reg1 as Register) +
      this.opcode
    );
  }

  execute(): void {
    Assembler.registers.setValue(
      this.reg1 as Register,
      (Assembler.pc.val + ((this.reg_num as number) << 12)) | 0
    );
  }
}

const funcList = {
  add: (arg1: number, arg2: number): number => (arg1 + arg2) | 0,
  sub: (arg1: number, arg2: number): number => (arg1 - arg2) | 0,
  and: (arg1: number, arg2: number): number => arg1 & arg2,
  or: (arg1: number, arg2: number): number => arg1 | arg2,
  xor: (arg1: number, arg2: number): number => arg1 ^ arg2,
  sll: (arg1: number, arg2: number): number => arg1 << (arg2 & 0x1f),
  srl: (arg1: number, arg2: number): number => arg1 >>> (arg2 & 0x1f),
  sra: (arg1: number, arg2: number): number => arg1 >> (arg2 & 0x1f),
  slt: (arg1: number, arg2: number): number => (arg1 < arg2 ? 1 : 0),
  sltu: (arg1: number, arg2: number): number => ((arg1 >>> 0) < (arg2 >>> 0) ? 1 : 0),
};

// R-Type Register-Register Operations
class Add extends RegInstruction {
  funct3 = "000";
  func = funcList.add;
}
class Sub extends RegInstruction {
  funct3 = "000";
  funct7 = "0100000";
  func = funcList.sub;
}
class And extends RegInstruction {
  funct3 = "111";
  func = funcList.and;
}
class Or extends RegInstruction {
  funct3 = "110";
  func = funcList.or;
}
class Xor extends RegInstruction {
  funct3 = "100";
  func = funcList.xor;
}
class Sll extends RegInstruction {
  funct3 = "001";
  func = funcList.sll;
}
class Srl extends RegInstruction {
  funct3 = "101";
  func = funcList.srl;
}
class Sra extends RegInstruction {
  funct3 = "101";
  funct7 = "0100000";
  func = funcList.sra;
}
class Slt extends RegInstruction {
  funct3 = "010";
  func = funcList.slt;
}
class Sltu extends RegInstruction {
  funct3 = "011";
  func = funcList.sltu;
}

// I-Type Register-Immediate Operations
class Addi extends RegImmInstruction {
  funct3 = "000";
  func = funcList.add;
}
class Andi extends RegImmInstruction {
  funct3 = "111";
  func = funcList.and;
}
class Ori extends RegImmInstruction {
  funct3 = "110";
  func = funcList.or;
}
class Xori extends RegImmInstruction {
  funct3 = "100";
  func = funcList.xor;
}
class Slti extends RegImmInstruction {
  funct3 = "010";
  func = funcList.slt;
}
class Sltiu extends RegImmInstruction {
  funct3 = "011";
  func = funcList.sltu;
}
class Slli extends ShiftImmInstruction {
  funct3 = "001";
  funct7 = "0000000";
  func = funcList.sll;
}
class Srli extends ShiftImmInstruction {
  funct3 = "101";
  funct7 = "0000000";
  func = funcList.srl;
}
class Srai extends ShiftImmInstruction {
  funct3 = "101";
  funct7 = "0100000";
  func = funcList.sra;
}

// B-Type Branch Instructions
class Beq extends BranchInstruction {
  funct3 = "000";
  func = (arg1: number, arg2: number, targetAddr?: number): number =>
    arg1 === arg2 ? (targetAddr as number) : Assembler.pc.val;
}
class Bne extends BranchInstruction {
  funct3 = "001";
  func = (arg1: number, arg2: number, targetAddr?: number): number =>
    arg1 !== arg2 ? (targetAddr as number) : Assembler.pc.val;
}
class Blt extends BranchInstruction {
  funct3 = "100";
  func = (arg1: number, arg2: number, targetAddr?: number): number =>
    arg1 < arg2 ? (targetAddr as number) : Assembler.pc.val;
}
class Bge extends BranchInstruction {
  funct3 = "101";
  func = (arg1: number, arg2: number, targetAddr?: number): number =>
    arg1 >= arg2 ? (targetAddr as number) : Assembler.pc.val;
}
class Bltu extends BranchInstruction {
  funct3 = "110";
  func = (arg1: number, arg2: number, targetAddr?: number): number =>
    (arg1 >>> 0) < (arg2 >>> 0) ? (targetAddr as number) : Assembler.pc.val;
}
class Bgeu extends BranchInstruction {
  funct3 = "111";
  func = (arg1: number, arg2: number, targetAddr?: number): number =>
    (arg1 >>> 0) >= (arg2 >>> 0) ? (targetAddr as number) : Assembler.pc.val;
}

/**
 * Pseudo-Branch Instructions:
 * In RISC-V, `ble rs1, rs2, offset` is encoded as `bge rs2, rs1, offset`
 * and `bgt rs1, rs2, offset` is encoded as `blt rs2, rs1, offset` (swapping rs1 and rs2).
 */
class Ble extends Bge {
  constructor(rs1: Register, rs2: Register, offset: number) {
    super(rs2, rs1, offset);
  }
}

class Bgt extends Blt {
  constructor(rs1: Register, rs2: Register, offset: number) {
    super(rs2, rs1, offset);
  }
}

/**
 * J-Type Jump and Link (jal) Instruction:
 * Supports `jal rd, label_or_offset` or `jal label_or_offset` (defaults rd to `ra` / `x1`).
 * Standard RV32I J-type encoding:
 *   imm[20] | imm[10:1] | imm[11] | imm[19:12] | rd[11:7] | opcode(1101111)
 */
function parseJalArgs(arg1: Register | number, arg2?: number): [Register, number] {
  const hasExplicitRd = arg2 !== undefined && typeof arg2 === 'number' && !isNaN(arg2);
  const rd: Register = hasExplicitRd ? (arg1 as Register) : 'ra';
  const offset: number = hasExplicitRd ? (arg2 as number) : (arg1 as number);
  if (!regValid(rd) || typeof offset !== 'number' || isNaN(offset)) {
    throw new RegisterIndexError("Invalid register or jump target for jal");
  }
  return [rd, offset];
}

class Jal extends AssemblyInstruction {
  constructor(arg1: Register | number, arg2?: number) {
    const [rd, offset] = parseJalArgs(arg1, arg2);
    super(rd, undefined, offset);
    this.opcode = "1101111";
  }

  binaryRep(): string {
    const imm21 = numToBin(this.reg_num as number, 21);
    const bit20 = imm12Bit(imm21, 20);
    const bits10_1 = imm21.slice(10, 20);
    const bit11 = imm12Bit(imm21, 11);
    const bits19_12 = imm21.slice(1, 9);

    return (
      bit20 +
      bits10_1 +
      bit11 +
      bits19_12 +
      regToBin(this.reg1 as Register) +
      this.opcode
    );
  }

  execute(): void {
    // Save return address (PC + 4) into destination register rd
    Assembler.registers.setValue(this.reg1 as Register, Assembler.pc.val + 4);
    // Jump to PC + offset (minus 4 because pc.step() adds +4 after execute)
    Assembler.pc.jump(Assembler.pc.val + (this.reg_num as number) - 4);
  }
}

/**
 * Unconditional Jump (j) Pseudo-Instruction: expands to `jal x0, offset`
 */
class J extends Jal {
  constructor(offset: number) {
    super('x0', offset);
  }
}

/**
 * I-Type Jump and Link Register (jalr) Instruction:
 * Supports `jalr rd, rs1, offset`, `jalr rd, offset(rs1)`, or shorthand `jalr rs1` (rd='ra', offset=0).
 * Format: imm[11:0] | rs1[19:15] | funct3(000) | rd[11:7] | opcode(1100111)
 */
function parseJalrArgs(
  arg1: Register,
  arg2?: Register | number,
  arg3?: Register | number
): [Register, Register, number] {
  let rd: Register = 'ra';
  let rs1: Register = arg1;
  let offset = 0;

  if (arg2 === undefined) {
    // Shorthand: `jalr rs1` -> `jalr ra, rs1, 0`
    rd = 'ra';
    rs1 = arg1;
    offset = 0;
  } else if (typeof arg2 === 'number' && arg3 !== undefined && regValid(arg3)) {
    // Memory-style syntax: `jalr rd, offset(rs1)` -> parser splits as (rd, offset, rs1)
    rd = arg1;
    offset = arg2;
    rs1 = arg3 as Register;
  } else if (regValid(arg2)) {
    // 3-arg or 2-reg syntax: `jalr rd, rs1, offset`
    rd = arg1;
    rs1 = arg2 as Register;
    offset = typeof arg3 === 'number' && !isNaN(arg3) ? arg3 : 0;
  } else {
    throw new RegisterIndexError("Invalid arguments for jalr");
  }

  if (!regValid(rd) || !regValid(rs1) || typeof offset !== 'number' || isNaN(offset)) {
    throw new RegisterIndexError("Invalid register or offset for jalr");
  }
  return [rd, rs1, offset];
}

class Jalr extends AssemblyInstruction {
  constructor(arg1: Register, arg2?: Register | number, arg3?: Register | number) {
    const [rd, rs1, offset] = parseJalrArgs(arg1, arg2, arg3);
    super(rd, rs1, offset);
    this.opcode = "1100111";
    this.funct3 = "000";
  }

  binaryRep(): string {
    return (
      numToBin(this.reg_num as number, 12) +
      regToBin(this.reg2 as Register) +
      this.funct3 +
      regToBin(this.reg1 as Register) +
      this.opcode
    );
  }

  execute(): void {
    const nextPc = Assembler.pc.val + 4;
    // Compute target address with LSB cleared per RISC-V spec: (rs1 + offset) & ~1
    const targetAddr = (Assembler.registers.getValue(this.reg2 as Register) + (this.reg_num as number)) & ~1;
    Assembler.registers.setValue(this.reg1 as Register, nextPc);
    Assembler.pc.jump(targetAddr - 4);
  }
}

/**
 * Return (ret) Pseudo-Instruction: expands to `jalr x0, x1, 0`
 */
class Ret extends Jalr {
  constructor() {
    super('x0', 'ra', 0);
  }
}

export const instructions: Map<string, typeof AssemblyInstruction> = new Map([
  // Console
  ['print', Console],
  ['printm', ConsoleMem],

  // R-Type Register Operations
  ['add', Add],
  ['sub', Sub],
  ['and', And],
  ['or', Or],
  ['xor', Xor],
  ['sll', Sll],
  ['srl', Srl],
  ['sra', Sra],
  ['slt', Slt],
  ['sltu', Sltu],

  // I-Type Register Immediate Operations
  ['addi', Addi],
  ['andi', Andi],
  ['ori', Ori],
  ['xori', Xori],
  ['slti', Slti],
  ['sltiu', Sltiu],
  ['slli', Slli],
  ['srli', Srli],
  ['srai', Srai],

  // B-Type Branch Operations
  ['beq', Beq],
  ['bne', Bne],
  ['blt', Blt],
  ['bge', Bge],
  ['bgt', Bgt],
  ['ble', Ble],
  ['bltu', Bltu],
  ['bgeu', Bgeu],

  // Load/Store Memory Operations
  ['lw', Lw],
  ['sw', Sw],

  // Upper Immediate & Pseudo-Instructions
  ['li', Li],
  ['lui', Lui],
  ['auipc', Auipc],
  ['mv', Mv],
  ['nop', Nop],

  // Jump Operations
  ['jal', Jal],
  ['jalr', Jalr],
  ['j', J],
  ['ret', Ret]
]);
