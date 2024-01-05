import { RegIndex, RegisterSet, Counter } from "./register";
import { Memory } from "./memory";

// const x0 = zero = new RegIndex(0);
// const x1 = ra = new RegIndex(1);
// const x2 = sp = new RegIndex(2);
// const x3 = gp = new RegIndex(3);
// const x4 = tp = new RegIndex(4);
// const x5 = t0 = new RegIndex(5);
// const x6 = t1 = new RegIndex(6);
// const x7 = t2 = new RegIndex(7);
// const x8 = s0 = new RegIndex(8);
// const x9 = s1 = new RegIndex(9);
// const x10 = a0 = new RegIndex(10);
// const x11 = a1 = new RegIndex(11);
// const x12 = a2 = new RegIndex(12);
// const x13 = a3 = new RegIndex(13);
// const x14 = a4 = new RegIndex(14);
// const x15 = a5 = new RegIndex(15);
// const x16 = a6 = new RegIndex(16);
// const x17 = a7 = new RegIndex(17);
// const x18 = s2 = new RegIndex(18);
// const x19 = s3 = new RegIndex(19);
// const x20 = s4 = new RegIndex(20);
// const x21 = s5 = new RegIndex(21);
// const x22 = s6 = new RegIndex(22);
// const x23 = s7 = new RegIndex(23);
// const x24 = s8 = new RegIndex(24);
// const x25 = s9 = new RegIndex(25);
// const x26 = s10 = new RegIndex(26);
// const x27 = s11 = new RegIndex(27);
// const x28 = t3 = new RegIndex(28);
// const x29 = t4 = new RegIndex(29);
// const x30 = t5 = new RegIndex(30);
// const x31 = t6 = new RegIndex(31);

class PyInstruction {
  static regs = new RegisterSet(T);
  static ic = new Counter();
  static pc = new Counter();
  static instruction_memory = new Memory();
  static data_memory = new Memory();

  execute(): void {
    while (PyInstruction.pc.val < PyInstruction.ic.val) {
      PyInstruction.instruction_memory[PyInstruction.pc.val].execute();
    }
  }
}

class RegInstruction extends PyInstruction {
  rd: RegIndex;
  rs1: RegIndex;
  rs2: RegIndex;

  constructor(rd: RegIndex, rs1: RegIndex, rs2: RegIndex) {
    super();
    this.rd = rd;
    this.rs1 = rs1;
    this.rs2 = rs2;
    PyInstruction.instruction_memory[PyInstruction.ic.val] = this;
    PyInstruction.ic.step();
  }

  execute(): void {
    PyInstruction.regs[this.rd.index] = this.func(
      PyInstruction.regs[this.rs1.index],
      PyInstruction.regs[this.rs2.index]
    );
    PyInstruction.pc.step();
  }
}

class RegImmInstruction extends RegInstruction {
  execute(): void {
    PyInstruction.regs[this.rd.index] = this.func(
      PyInstruction.regs[this.rs1.index],
      this.rs2
    );
    PyInstruction.pc.step();
  }
}

class Add extends RegInstruction {
  func = (arg1: number, arg2: number): number => arg1 + arg2;
}

class Sub extends RegInstruction {
  func = (arg1: number, arg2: number): number => arg1 - arg2;
}

class Or extends RegInstruction {
  func = (arg1: number, arg2: number): number => arg1 | arg2;
}

class And extends RegInstruction {
  func = (arg1: number, arg2: number): number => arg1 & arg2;
}

class Xor extends RegInstruction {
  func = (arg1: number, arg2: number): number => arg1 ^ arg2;
}

class Addi extends RegImmInstruction {
  constructor(rd: RegIndex, rs1: RegIndex, rs2: number) {
    super(rd, rs1, rs2);
  }
}

class Ori extends RegImmInstruction {
  constructor(rd: RegIndex, rs1: RegIndex, rs2: number) {
    super(rd, rs1, rs2);
  }
}

class Andi extends RegImmInstruction {
  constructor(rd: RegIndex, rs1: RegIndex, rs2: number) {
    super(rd, rs1, rs2);
  }
}

class Xori extends RegImmInstruction {
  constructor(rd: RegIndex, rs1: RegIndex, rs2: number) {
    super(rd, rs1, rs2);
