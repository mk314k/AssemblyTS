import { numToBin } from "./memory";
import { Register } from "./register";
import { armRegValid, armRegToBin, armRegToIndex } from "./armRegister";
import { Assembler, AssemblyInstruction } from "./instruction";
import { RegisterIndexError } from "./exception";

const COND_CODES: { [key: string]: string } = {
  eq: '0000',
  ne: '0001',
  cs: '0010',
  hs: '0010',
  cc: '0011',
  lo: '0011',
  mi: '0100',
  pl: '0101',
  vs: '0110',
  vc: '0111',
  hi: '1000',
  ls: '1001',
  ge: '1010',
  lt: '1011',
  gt: '1100',
  le: '1101',
  al: '1110',
};

function parseArmInt(val: Register | undefined): number {
  if (typeof val === 'number' && !Number.isNaN(val)) {
    return val | 0;
  }
  if (typeof val === 'string') {
    let cleaned = val.trim();
    if (cleaned.startsWith('#')) {
      cleaned = cleaned.slice(1).trim();
    }
    if (/^[+-]?0x[0-9a-fA-F]+$/.test(cleaned)) {
      return parseInt(cleaned, 16) | 0;
    }
    if (/^[+-]?\d+$/.test(cleaned)) {
      return parseInt(cleaned, 10) | 0;
    }
  }
  throw new RegisterIndexError(`Invalid ARM immediate value "${val}"`);
}

/**
 * Base class for 32-bit ARM (AArch32) instructions.
 */
export class ARMInstruction extends AssemblyInstruction {
  cond = 'al';

  protected get condBits(): string {
    return COND_CODES[this.cond.toLowerCase()] ?? '1110';
  }
}

/**
 * ARM Data Processing Instruction (`ADD`, `ADDS`, `SUB`, `SUBS`, `RSB`, `AND`, `ORR`, `EOR`, `BIC`).
 * Supports 3-operand (`ADD r0, r1, r2` / `ADD r0, r1, #5`) and 2-operand shorthand (`ADD r0, #5`).
 */
abstract class ARMDataProcInstruction extends ARMInstruction {
  dpOpcode = '0100';
  setFlags = false;
  isImm = false;

  constructor(
    rd: Register,
    rnOrOp2: Register,
    op2?: Register
  ) {
    if (!armRegValid(rd)) {
      throw new RegisterIndexError(`Invalid ARM destination register "${rd}"`);
    }
    const actualRn = op2 === undefined ? rd : rnOrOp2;
    const rawOp2 = op2 === undefined ? rnOrOp2 : op2;

    if (!armRegValid(actualRn)) {
      throw new RegisterIndexError(`Invalid ARM source register "${actualRn}"`);
    }

    const isRegOp2 = typeof rawOp2 === 'string' && armRegValid(rawOp2);
    const resolvedOp2 = isRegOp2 ? rawOp2 : parseArmInt(rawOp2);

    super(rd, actualRn, resolvedOp2);
    this.isImm = !isRegOp2;
  }

  protected getOp2Value(): number {
    if (this.isImm) {
      return (this.reg_num as number) | 0;
    }
    return Assembler.armRegisters.getValue(this.reg_num as Register);
  }

  binaryRep(): string {
    const iBit = this.isImm ? '1' : '0';
    const sBit = this.setFlags ? '1' : '0';
    const op2Bits = this.isImm
      ? numToBin(this.reg_num as number, 12)
      : '00000000' + armRegToBin(this.reg_num as Register);
    return (
      this.condBits +
      '00' +
      iBit +
      this.dpOpcode +
      sBit +
      armRegToBin(this.reg2 as Register) +
      armRegToBin(this.reg1 as Register) +
      op2Bits
    );
  }

  protected abstract compute(a: number, b: number): number;

  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    const a = Assembler.armRegisters.getValue(this.reg2 as Register);
    const b = this.getOp2Value();
    const res = this.compute(a, b);
    Assembler.armRegisters.setValue(this.reg1 as Register, res);
    if (this.setFlags) {
      Assembler.armRegisters.syncFlagsDOM();
    }
  }
}

class ARMAdd extends ARMDataProcInstruction {
  dpOpcode = '0100';
  protected compute(a: number, b: number): number {
    return this.setFlags ? Assembler.armRegisters.flags.updateAdd(a, b) : (a + b) | 0;
  }
}

class ARMAdds extends ARMAdd {
  setFlags = true;
}

class ARMSub extends ARMDataProcInstruction {
  dpOpcode = '0010';
  protected compute(a: number, b: number): number {
    return this.setFlags ? Assembler.armRegisters.flags.updateSub(a, b) : (a - b) | 0;
  }
}

class ARMSubs extends ARMSub {
  setFlags = true;
}

class ARMRsb extends ARMDataProcInstruction {
  dpOpcode = '0011';
  protected compute(a: number, b: number): number {
    return this.setFlags ? Assembler.armRegisters.flags.updateSub(b, a) : (b - a) | 0;
  }
}

class ARMAnd extends ARMDataProcInstruction {
  dpOpcode = '0000';
  protected compute(a: number, b: number): number {
    const res = a & b;
    if (this.setFlags) Assembler.armRegisters.flags.updateNZ(res);
    return res;
  }
}

class ARMOrr extends ARMDataProcInstruction {
  dpOpcode = '1100';
  protected compute(a: number, b: number): number {
    const res = a | b;
    if (this.setFlags) Assembler.armRegisters.flags.updateNZ(res);
    return res;
  }
}

class ARMEor extends ARMDataProcInstruction {
  dpOpcode = '0001';
  protected compute(a: number, b: number): number {
    const res = a ^ b;
    if (this.setFlags) Assembler.armRegisters.flags.updateNZ(res);
    return res;
  }
}

class ARMBic extends ARMDataProcInstruction {
  dpOpcode = '1110';
  protected compute(a: number, b: number): number {
    const res = a & ~b;
    if (this.setFlags) Assembler.armRegisters.flags.updateNZ(res);
    return res;
  }
}

/**
 * ARM `MOV`, `MOVS`, `MVN`, `ADR` Instructions.
 */
class ARMMov extends ARMInstruction {
  dpOpcode = '1101';
  setFlags = false;
  isImm = false;

  constructor(rd: Register, op2: Register) {
    if (!armRegValid(rd)) {
      throw new RegisterIndexError(`Invalid ARM destination register "${rd}"`);
    }
    const isReg = typeof op2 === 'string' && armRegValid(op2);
    const resolved = isReg ? op2 : parseArmInt(op2);
    super(rd, undefined, resolved);
    this.isImm = !isReg;
  }

  protected getOp2Value(): number {
    if (this.isImm) {
      return (this.reg_num as number) | 0;
    }
    return Assembler.armRegisters.getValue(this.reg_num as Register);
  }

  binaryRep(): string {
    const iBit = this.isImm ? '1' : '0';
    const sBit = this.setFlags ? '1' : '0';
    const op2Bits = this.isImm
      ? numToBin(this.reg_num as number, 12)
      : '00000000' + armRegToBin(this.reg_num as Register);
    return (
      this.condBits +
      '00' +
      iBit +
      this.dpOpcode +
      sBit +
      '0000' +
      armRegToBin(this.reg1 as Register) +
      op2Bits
    );
  }

  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    const val = this.getOp2Value();
    Assembler.armRegisters.setValue(this.reg1 as Register, val);
    if (this.setFlags) {
      Assembler.armRegisters.flags.updateNZ(val);
      Assembler.armRegisters.syncFlagsDOM();
    }
  }
}

class ARMMovs extends ARMMov {
  setFlags = true;
}

class ARMMvn extends ARMMov {
  dpOpcode = '1111';
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    const val = ~this.getOp2Value();
    Assembler.armRegisters.setValue(this.reg1 as Register, val);
    if (this.setFlags) {
      Assembler.armRegisters.flags.updateNZ(val);
      Assembler.armRegisters.syncFlagsDOM();
    }
  }
}

class ARMAdr extends ARMMov {}

/**
 * ARM Shift & Multiply/Divide Instructions (`LSL`, `LSR`, `ASR`, `MUL`, `SDIV`, `UDIV`).
 */
class ARMLsl extends ARMDataProcInstruction {
  dpOpcode = '1101';
  protected compute(a: number, b: number): number {
    return a << (b & 0x1f);
  }
}

class ARMLsr extends ARMDataProcInstruction {
  dpOpcode = '1101';
  protected compute(a: number, b: number): number {
    return a >>> (b & 0x1f);
  }
}

class ARMAsr extends ARMDataProcInstruction {
  dpOpcode = '1101';
  protected compute(a: number, b: number): number {
    return a >> (b & 0x1f);
  }
}

class ARMMul extends ARMDataProcInstruction {
  protected compute(a: number, b: number): number {
    return Math.imul(a, b);
  }

  binaryRep(): string {
    const rmBits = this.isImm
      ? numToBin(this.reg_num as number, 4)
      : armRegToBin(this.reg_num as Register);
    const sBit = this.setFlags ? '1' : '0';
    return (
      this.condBits +
      '0000000' +
      sBit +
      armRegToBin(this.reg1 as Register) +
      '0000' +
      rmBits +
      '1001' +
      armRegToBin(this.reg2 as Register)
    );
  }
}

class ARMSdiv extends ARMDataProcInstruction {
  protected compute(a: number, b: number): number {
    if (b === 0) return 0;
    if ((a | 0) === -2147483648 && (b | 0) === -1) return -2147483648;
    return Math.trunc((a | 0) / (b | 0)) | 0;
  }
}

class ARMUdiv extends ARMDataProcInstruction {
  protected compute(a: number, b: number): number {
    if (b === 0) return 0;
    return Math.trunc((a >>> 0) / (b >>> 0)) | 0;
  }
}

/**
 * ARM Compare & Test Instructions (`CMP`, `CMN`, `TST`).
 */
class ARMCmp extends ARMInstruction {
  dpOpcode = '1010';
  isImm = false;

  constructor(rn: Register, op2: Register) {
    if (!armRegValid(rn)) {
      throw new RegisterIndexError(`Invalid ARM register "${rn}"`);
    }
    const isReg = typeof op2 === 'string' && armRegValid(op2);
    const resolved = isReg ? op2 : parseArmInt(op2);
    super(rn, undefined, resolved);
    this.isImm = !isReg;
  }

  protected getOp2Value(): number {
    if (this.isImm) {
      return (this.reg_num as number) | 0;
    }
    return Assembler.armRegisters.getValue(this.reg_num as Register);
  }

  binaryRep(): string {
    const iBit = this.isImm ? '1' : '0';
    const op2Bits = this.isImm
      ? numToBin(this.reg_num as number, 12)
      : '00000000' + armRegToBin(this.reg_num as Register);
    return (
      this.condBits +
      '00' +
      iBit +
      this.dpOpcode +
      '1' +
      armRegToBin(this.reg1 as Register) +
      '0000' +
      op2Bits
    );
  }

  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    const rnVal = Assembler.armRegisters.getValue(this.reg1 as Register);
    Assembler.armRegisters.flags.updateSub(rnVal, this.getOp2Value());
    Assembler.armRegisters.syncFlagsDOM();
  }
}

class ARMCmn extends ARMCmp {
  dpOpcode = '1011';
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    const rnVal = Assembler.armRegisters.getValue(this.reg1 as Register);
    Assembler.armRegisters.flags.updateAdd(rnVal, this.getOp2Value());
    Assembler.armRegisters.syncFlagsDOM();
  }
}

class ARMTst extends ARMCmp {
  dpOpcode = '1000';
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    const rnVal = Assembler.armRegisters.getValue(this.reg1 as Register);
    Assembler.armRegisters.flags.updateNZ(rnVal & this.getOp2Value());
    Assembler.armRegisters.syncFlagsDOM();
  }
}

/**
 * ARM Memory Instructions (`LDR`, `STR`, `LDRB`, `LDRSB`, `STRB`, `LDRH`, `LDRSH`, `STRH`).
 */
abstract class ARMMemInstruction extends ARMInstruction {
  isLoad = true;
  directAddr: number | null = null;

  constructor(
    rd: Register,
    arg2: Register,
    arg3?: Register
  ) {
    if (!armRegValid(rd)) {
      throw new RegisterIndexError(`Invalid ARM register "${rd}"`);
    }

    let rn: Register = 'r0';
    let offset = 0;
    let direct: number | null = null;

    if (arg3 === undefined) {
      if (typeof arg2 === 'string' && armRegValid(arg2)) {
        rn = arg2;
        offset = 0;
      } else {
        rn = 'r0';
        offset = parseArmInt(arg2);
        direct = offset;
      }
    } else if (typeof arg2 === 'string' && armRegValid(arg2)) {
      rn = arg2;
      offset = parseArmInt(arg3);
    } else if (typeof arg3 === 'string' && armRegValid(arg3)) {
      rn = arg3;
      offset = parseArmInt(arg2);
    } else {
      throw new RegisterIndexError("Invalid arguments for ARM memory instruction");
    }

    super(rd, rn, offset);
    this.directAddr = direct;
  }

  protected getEffectiveAddr(): number {
    if (this.directAddr !== null) {
      return this.directAddr;
    }
    return Assembler.armRegisters.getValue(this.reg2 as Register) + (this.reg_num as number);
  }

  binaryRep(): string {
    const lBit = this.isLoad ? '1' : '0';
    const offsetVal = this.reg_num as number;
    const uBit = offsetVal >= 0 ? '1' : '0';
    const imm12 = numToBin(Math.abs(offsetVal), 12);
    return (
      this.condBits +
      '0101' +
      uBit +
      '00' +
      lBit +
      armRegToBin(this.reg2 as Register) +
      armRegToBin(this.reg1 as Register) +
      imm12
    );
  }
}

class ARMLdr extends ARMMemInstruction {
  isLoad = true;
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    Assembler.armRegisters.setValue(
      this.reg1 as Register,
      Assembler.dataMemory.loadWord(this.getEffectiveAddr())
    );
  }
}

class ARMStr extends ARMMemInstruction {
  isLoad = false;
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    Assembler.dataMemory.storeWord(
      this.getEffectiveAddr(),
      Assembler.armRegisters.getValue(this.reg1 as Register)
    );
  }
}

class ARMLdrb extends ARMMemInstruction {
  isLoad = true;
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    Assembler.armRegisters.setValue(
      this.reg1 as Register,
      Assembler.dataMemory.loadByteUnsigned(this.getEffectiveAddr())
    );
  }
}

class ARMLdrsb extends ARMMemInstruction {
  isLoad = true;
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    Assembler.armRegisters.setValue(
      this.reg1 as Register,
      Assembler.dataMemory.loadByte(this.getEffectiveAddr())
    );
  }
}

class ARMStrb extends ARMMemInstruction {
  isLoad = false;
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    Assembler.dataMemory.storeByte(
      this.getEffectiveAddr(),
      Assembler.armRegisters.getValue(this.reg1 as Register)
    );
  }
}

class ARMLdrh extends ARMMemInstruction {
  isLoad = true;
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    Assembler.armRegisters.setValue(
      this.reg1 as Register,
      Assembler.dataMemory.loadHalfUnsigned(this.getEffectiveAddr())
    );
  }
}

class ARMLdrsh extends ARMMemInstruction {
  isLoad = true;
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    Assembler.armRegisters.setValue(
      this.reg1 as Register,
      Assembler.dataMemory.loadHalf(this.getEffectiveAddr())
    );
  }
}

class ARMStrh extends ARMMemInstruction {
  isLoad = false;
  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    Assembler.dataMemory.storeHalf(
      this.getEffectiveAddr(),
      Assembler.armRegisters.getValue(this.reg1 as Register)
    );
  }
}

/**
 * ARM `PUSH` and `POP` Stack Instructions.
 */
class ARMPush extends ARMInstruction {
  private regList: Register[];

  constructor(...regs: (Register | undefined)[]) {
    const validRegs = regs.filter((r): r is Register => r !== undefined && r !== '');
    if (validRegs.length === 0 || !validRegs.every(r => armRegValid(r))) {
      throw new RegisterIndexError("Invalid register list for PUSH");
    }
    super(validRegs[0]);
    this.regList = validRegs;
  }

  binaryRep(): string {
    let mask = 0;
    for (const r of this.regList) {
      mask |= 1 << armRegToIndex(r);
    }
    return this.condBits + '100100101101' + numToBin(mask, 16);
  }

  execute(): void {
    for (let i = this.regList.length - 1; i >= 0; i--) {
      const spVal = Assembler.armRegisters.getValue('sp') - 4;
      Assembler.armRegisters.setValue('sp', spVal);
      Assembler.dataMemory.storeWord(spVal, Assembler.armRegisters.getValue(this.regList[i]));
    }
  }
}

class ARMPop extends ARMInstruction {
  private regList: Register[];

  constructor(...regs: (Register | undefined)[]) {
    const validRegs = regs.filter((r): r is Register => r !== undefined && r !== '');
    if (validRegs.length === 0 || !validRegs.every(r => armRegValid(r))) {
      throw new RegisterIndexError("Invalid register list for POP");
    }
    super(validRegs[0]);
    this.regList = validRegs;
  }

  binaryRep(): string {
    let mask = 0;
    for (const r of this.regList) {
      mask |= 1 << armRegToIndex(r);
    }
    return this.condBits + '100010111101' + numToBin(mask, 16);
  }

  execute(): void {
    for (const r of this.regList) {
      const spVal = Assembler.armRegisters.getValue('sp');
      const val = Assembler.dataMemory.loadWord(spVal);
      Assembler.armRegisters.setValue('sp', spVal + 4);
      if (armRegToIndex(r) === 15) {
        Assembler.pc.jump(val - 4);
      } else {
        Assembler.armRegisters.setValue(r, val);
      }
    }
  }
}

/**
 * ARM Branch (`B{cond}`), Branch with Link (`BL`), and Branch Exchange (`BX`).
 */
class ARMBranch extends ARMInstruction {
  cond = 'al';
  link = false;

  constructor(offset: Register) {
    const numOffset = parseArmInt(offset);
    super(undefined, undefined, numOffset);
  }

  binaryRep(): string {
    const lBit = this.link ? '1' : '0';
    const imm24 = numToBin((this.reg_num as number) >> 2, 24);
    return this.condBits + '101' + lBit + imm24;
  }

  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    if (this.link) {
      Assembler.armRegisters.setValue('lr', Assembler.pc.val + 4);
    }
    Assembler.pc.jump(Assembler.pc.val + (this.reg_num as number) - 4);
  }
}

class ARMBl extends ARMBranch {
  link = true;
}

class ARMBeq extends ARMBranch {
  cond = 'eq';
}

class ARMBne extends ARMBranch {
  cond = 'ne';
}

class ARMBlt extends ARMBranch {
  cond = 'lt';
}

class ARMBge extends ARMBranch {
  cond = 'ge';
}

class ARMBgt extends ARMBranch {
  cond = 'gt';
}

class ARMBle extends ARMBranch {
  cond = 'le';
}

class ARMBhi extends ARMBranch {
  cond = 'hi';
}

class ARMBls extends ARMBranch {
  cond = 'ls';
}

class ARMBcs extends ARMBranch {
  cond = 'cs';
}

class ARMBcc extends ARMBranch {
  cond = 'cc';
}

class ARMBx extends ARMInstruction {
  constructor(rm: Register = 'lr') {
    if (!armRegValid(rm)) {
      throw new RegisterIndexError(`Invalid ARM register "${rm}" for BX`);
    }
    super(rm);
  }

  binaryRep(): string {
    return this.condBits + '000100101111111111110001' + armRegToBin(this.reg1 as Register);
  }

  execute(): void {
    if (!Assembler.armRegisters.flags.checkCond(this.cond)) return;
    const target = Assembler.armRegisters.getValue(this.reg1 as Register);
    Assembler.pc.jump(target - 4);
  }
}

class ARMRet extends ARMBx {
  constructor() {
    super('lr');
  }
}

class ARMNop extends ARMInstruction {
  constructor() {
    super();
  }

  binaryRep(): string {
    return this.condBits + '0011001000001111000000000000';
  }

  execute(): void {
    // Do nothing
  }
}

class ARMConsole extends ARMInstruction {
  constructor(reg: Register) {
    if (!armRegValid(reg)) {
      throw new RegisterIndexError(`Invalid ARM register "${reg}"`);
    }
    super(reg);
  }

  binaryRep(): string {
    return '1'.repeat(32);
  }

  execute(): void {
    Assembler.consoleLog += Assembler.armRegisters.getValue(this.reg1 as Register) + "\n";
  }
}

class ARMConsoleMem extends ARMInstruction {
  constructor(reg: Register) {
    if (!armRegValid(reg)) {
      throw new RegisterIndexError(`Invalid ARM register "${reg}"`);
    }
    super(reg);
  }

  binaryRep(): string {
    return '1'.repeat(32);
  }

  execute(): void {
    const addr = Assembler.armRegisters.getValue(this.reg1 as Register);
    const val = Assembler.dataMemory.loadWord(addr);
    Assembler.consoleLog += val + "\n";
  }
}

export const armInstructions: Map<string, typeof AssemblyInstruction> = new Map<string, typeof AssemblyInstruction>([
  // Console
  ['print', ARMConsole],
  ['printm', ARMConsoleMem],

  // Data Processing
  ['mov', ARMMov],
  ['movs', ARMMovs],
  ['mvn', ARMMvn],
  ['adr', ARMAdr],
  ['la', ARMAdr],
  ['li', ARMMov],
  ['add', ARMAdd],
  ['adds', ARMAdds],
  ['sub', ARMSub],
  ['subs', ARMSubs],
  ['rsb', ARMRsb],
  ['and', ARMAnd],
  ['orr', ARMOrr],
  ['or', ARMOrr],
  ['eor', ARMEor],
  ['xor', ARMEor],
  ['bic', ARMBic],
  ['lsl', ARMLsl],
  ['lsr', ARMLsr],
  ['asr', ARMAsr],
  ['mul', ARMMul],
  ['sdiv', ARMSdiv],
  ['div', ARMSdiv],
  ['udiv', ARMUdiv],

  // Compare & Test
  ['cmp', ARMCmp],
  ['cmn', ARMCmn],
  ['tst', ARMTst],

  // Memory Load / Store & Stack
  ['ldr', ARMLdr],
  ['str', ARMStr],
  ['ldrb', ARMLdrb],
  ['ldrsb', ARMLdrsb],
  ['strb', ARMStrb],
  ['ldrh', ARMLdrh],
  ['ldrsh', ARMLdrsh],
  ['strh', ARMStrh],
  ['push', ARMPush],
  ['pop', ARMPop],

  // Branches & Subroutines
  ['b', ARMBranch],
  ['bl', ARMBl],
  ['bx', ARMBx],
  ['beq', ARMBeq],
  ['bne', ARMBne],
  ['blt', ARMBlt],
  ['bge', ARMBge],
  ['bgt', ARMBgt],
  ['ble', ARMBle],
  ['bhi', ARMBhi],
  ['bls', ARMBls],
  ['bcs', ARMBcs],
  ['bhs', ARMBcs],
  ['bcc', ARMBcc],
  ['blo', ARMBcc],
  ['ret', ARMRet],
  ['nop', ARMNop],
]);
