import { Memory, MemContent, Data, numToBin } from "./memory";
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

    /**
     * Generates the binary representation of the instruction.
     * @returns The binary representation of the instruction.
     */
    binaryRep(): string {
        return '1'.repeat(32); // Placeholder binary representation
    }
}

// Console Instruction
// Represents a console instruction to print the value of a register to the console
class Console extends ConsoleInstruction {
    // Executes the instruction by appending the register value to the console log
    execute(): void {
        Assembler.consoleLog += Assembler.registers.getValue(this.reg1 as Register) + "\n";
    }
}

// Represents a console instruction to print the value stored in memory to the console
class ConsoleMem extends ConsoleInstruction {
    // Executes the instruction by appending the memory value to the console log
    execute(): void {
        Assembler.consoleLog += Assembler.dataMemory.get(
            Assembler.registers.getValue(this.reg1 as Register)
        )?.numValue();
    }
}

// Represents a load word (lw) instruction that loads data from memory into a register
class Lw extends MemInstruction {
    opcode: string = '0000011'; // Set opcode for load word instruction
    funct3: string = '010'; // Set funct3 for load word instruction

    // Generates the binary representation of the lw instruction
    binaryRep(): string {
        return numToBin(this.reg_num as number, 12) +
                regToBin(this.reg2 as Register) +
                this.funct3 +
                regToBin(this.reg1 as Register) +
                this.opcode;
    }

    // Executes the lw instruction by loading data from memory into the specified register
    execute(): void {
        const memData = Assembler.dataMemory.get(
            Assembler.registers.getValue(this.reg2 as Register) + 
            (this.reg_num as number)
        ) as MemContent;
        Assembler.registers.setValue(
            this.reg1 as Register,
            memData.numValue()
        );
    }
}

// Represents a store word (sw) instruction that stores data from a register into memory
class Sw extends MemInstruction {
    opcode: string = '0100011'; // Set opcode for store word instruction
    funct3: string = '010'; // Set funct3 for store word instruction

    // Generates the binary representation of the sw instruction
    binaryRep(): string {
        const immVal = numToBin(this.reg_num as number, 12);
        return immVal.slice(0,7)+
                regToBin(this.reg2 as Register) +
                regToBin(this.reg1 as Register) +
                this.funct3 +
                immVal.slice(7) +
                this.opcode;
    }

    // Executes the sw instruction by storing data from the specified register into memory
    execute(): void {
        Assembler.dataMemory.set(
            Assembler.registers.getValue(this.reg2 as Register) + (this.reg_num as number),
            new Data(Assembler.registers.getValue(this.reg1 as Register))
        );
    }
}


// Represents a load immediate (li) instruction that loads a constant value into a register
class Li extends RegImmInstruction {
    // Constructor for the li instruction
    constructor(
        rd: Register,
        liConstant: number
    ) {
        super(rd, rd, liConstant); // Call the superclass constructor
    }

    // Executes the li instruction by loading the constant value into the specified register
    execute(): void {
        Assembler.registers.setValue(
            this.reg1 as Register,
            this.reg_num as number
        );
    }
}

// Represents a load upper immediate (lui) instruction that loads a constant upper value into a register
class Lui extends RegImmInstruction {
    // Constructor for the lui instruction
    constructor(
        rd: Register,
        luiConstant: number
    ) {
        super(rd, rd, luiConstant); // Call the superclass constructor
    }

    // Executes the lui instruction by loading the constant upper value into the specified register
    execute(): void {
        Assembler.registers.setValue(
            this.reg1 as Register,
            this.reg_num as number
        );
    }
}


let funcList = {
    add: (arg1: number, arg2: number): number => arg1 + arg2,
    sub: (arg1: number, arg2: number): number => arg1 - arg2,
    and: (arg1: number, arg2: number): number => arg1 & arg2,
    or: (arg1: number, arg2: number): number => arg1 | arg2,
    xor: (arg1: number, arg2: number): number => arg1 ^ arg2,
    sll: (arg1: number, arg2: number): number => arg1 + arg2,
    srl: (arg1: number, arg2: number): number => arg1 + arg2,
    sra: (arg1: number, arg2: number): number => arg1 + arg2
}
// Reg operations
class Add extends RegInstruction{
    funct3 = "000";
    func = funcList.add;
}

class Sub extends RegInstruction{
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

// Reg Immediate Operations
class Addi extends RegImmInstruction{
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
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Sltiu extends RegImmInstruction {
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Slli extends RegImmInstruction {
    funct3 = "001";
    func = funcList.sll;
}
class Srli extends RegImmInstruction {
    funct3 = "101";
    func = funcList.srl;
}
class Srai extends RegImmInstruction {
    funct3 = "101";
    funct7 = "0100000";
    func = funcList.sra;
}

// Branch 
class Beq extends BranchInstruction{
    func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : Assembler.pc.val;
}
class Bne extends BranchInstruction {
    func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 != arg2 ? arg3 as number : Assembler.pc.val;
}
class Blt extends BranchInstruction {
    func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 < arg2 ? arg3 as number : Assembler.pc.val;
}
class Ble extends BranchInstruction {
    func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 <= arg2 ? arg3 as number : Assembler.pc.val;
}
class Bgt extends BranchInstruction {
    func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 > arg2 ? arg3 as number : Assembler.pc.val;
}
class Bge extends BranchInstruction {
    func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 >= arg2 ? arg3 as number : Assembler.pc.val;
}
class Bltu extends BranchInstruction{
    func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : Assembler.pc.val;
}
class Bgeu extends BranchInstruction{
    func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : Assembler.pc.val;
}

// Jump
// class Jal {
//     func = (arg1: number, arg2: number, arg3?:number): number => 
//     arg1 == arg2 ? arg3 as number : Assembler.pc.val;
// }
// class Jalr{
//     func = (arg1: number, arg2: number, arg3?:number): number => 
//     arg1 == arg2 ? arg3 as number : Assembler.pc.val;
// }

// Represents a return instruction extending AssemblyInstruction
class Ret extends AssemblyInstruction {
    constructor() {
        super();
    }

    // Generates the binary representation of the return instruction
    binaryRep(): string {
        return '1100' + '0000'.repeat(7);
    }

    // Executes the return instruction
    execute(): void {
        // Jumps to the address stored in the 'ra' register minus 4
        // -4 is here because pc will step up after each instruction
        // cancelling the -4
        Assembler.pc.jump(
            Assembler.registers.getValue('ra') - 4
        );
    }
}


export const instructions: Map<string, typeof AssemblyInstruction> = new Map([
    // console 
    ['print', Console],
    ['printm', ConsoleMem],
    // Reg operations
    ['add', Add],
    ['sub', Sub],
    ['and', And],
    ['or', Or],
    ['xor', Xor],
    ['sll', Sll],
    ['srl', Srl],
    ['sra', Sra],

    // Reg Immediate Operations
    ['addi', Addi],
    ['andi', Andi],
    ['ori', Ori],
    ['xori', Xori],
    ['slti', Slti],
    ['sltiu', Sltiu],
    ['slli', Slli],
    ['srli', Srli],
    ['srai', Srai],

    // Branch 
    ['beq', Beq],
    ['bne', Bne],
    ['blt', Blt],
    ['bge', Bge],
    ['bgt', Bgt],
    ['ble', Ble],
    ['bltu', Bltu],
    ['bgeu', Bgeu],

    // Mem Operations
    ['lw', Lw],
    ['sw', Sw],

    // Reg Loading Operations
    ['li', Li],
    ['lui', Lui],

    // Jump operations
    ['ret', Ret]
]);