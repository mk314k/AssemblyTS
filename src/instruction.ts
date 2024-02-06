import { Memory, MemContent, Data, numToBin} from "./memory";
import { Counter, RegisterSet, Register, regValid, regToBin} from "./register";
import {RegisterIndexError} from './exception';

export class Assembler {
    static registers = new RegisterSet();
    static instMemory = new Memory();
    static dataMemory = new Memory();
    static pc = new Counter();
}

export class AssemblyInstruction implements MemContent {
    constructor(
        public readonly reg1?:Register,
        public readonly reg2?:Register,
        public readonly reg_num?:Register
    ){}
    funct7 = "";
    funct3 = "";
    opcode = "";
    func = (_:number, __:number, ___?:number):number=>{
        throw new Error("function not implemented");
    };
    binaryRep(): string {
        throw new Error("Not Implemented Binary");
    }
    hexRep(): string {
        return this.numValue().toString(16);
    }
    numValue(): number {
        return parseInt(this.binaryRep(), 2);
    }
    execute():void{}
}

class RegInstruction extends AssemblyInstruction {
    constructor(
        rd:Register,
        rs1:Register,
        rs2:Register
    ){
        if (regValid(rd) && regValid(rs1) && regValid(rs2)){
            super(rd, rs1, rs2);
        }else{
            throw new RegisterIndexError();
        }
        this.funct7 = "0000000";
        this.opcode = "0110011";
    }
    binaryRep(): string {
        return this.funct7 +
                regToBin(this.reg_num as Register) +
                regToBin(this.reg2 as Register) +
                this.funct3 +
                regToBin(this.reg1 as Register) +
                this.opcode
    }
    execute(){
        Assembler.registers.setValue(
            this.reg1 as Register, this.func(
                Assembler.registers.getValue(this.reg2 as Register), 
                Assembler.registers.getValue(this.reg_num as Register)
            ) as number
        );
    }
}
class RegImmInstruction extends AssemblyInstruction {
    constructor(
        rd:Register,
        rs1:Register,
        rsval:number
    ){
        if (regValid(rd) && regValid(rs1)){
            super(rd, rs1, rsval);
        }else{
            throw new RegisterIndexError();
        }
        this.opcode = "0010011";
    }
    binaryRep(): string {
        return numToBin(this.reg_num as number, 12) +
                regToBin(this.reg2 as Register) +
                this.funct3 +
                regToBin(this.reg1 as Register) +
                this.opcode
    }
    execute(){
        Assembler.registers.setValue(
            this.reg1 as Register, this.func(
                Assembler.registers.getValue(this.reg2 as Register), 
                this.reg_num as number
            ) as number
        );
    }
}
class MemInstruction extends AssemblyInstruction {
    constructor(
        rs2:Register,
        offset:number,
        rs1:Register
    ){
        if (regValid(rs2) && regValid(rs1)){
            super(rs2, rs1, offset);
        }else{
            throw new RegisterIndexError();
        }
        this.funct3 = "010";
    }
}
class BranchInstruction extends AssemblyInstruction {
    constructor(
        rs1:Register,
        rs2:Register,
        label:number
    ){
        if (regValid(rs2) && regValid(rs1)){
            super(rs1, rs2, label);
        }else{
            throw new RegisterIndexError();
        }
    }
    execute(){
        Assembler.pc.jump(
            this.func(
                Assembler.registers.getValue(this.reg1 as Register),
                Assembler.registers.getValue(this.reg2 as Register),
                this.reg_num as number
            )
        );
    }
}

// Memory Operation
class Lw extends MemInstruction{
    opcode: string = '0000011';
    funct3: string = '010';
    binaryRep(): string {
        return numToBin(this.reg_num as number, 12) +
                regToBin(this.reg2 as Register) +
                this.funct3 +
                regToBin(this.reg1 as Register) +
                this.opcode
    }
    execute(){
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
class Sw extends MemInstruction{
    opcode: string = '0100011';
    funct3: string = '010';
    binaryRep(): string {
        const immVal = numToBin(this.reg_num as number, 12);
        return immVal.slice(0,7)+
                regToBin(this.reg2 as Register) +
                regToBin(this.reg1 as Register) +
                this.funct3 +
                immVal.slice(7) +
                this.opcode
    }
    execute(){
        Assembler.dataMemory.set(
            Assembler.registers.getValue(this.reg2 as Register) + (this.reg_num as number),
            new Data(Assembler.registers.getValue(this.reg1 as Register))
        );
    }
}

// Register loading
class Li extends RegImmInstruction{
    constructor(
        rd:Register,
        liConstant:number
    ){
        super(rd, rd, liConstant);
    }
    execute(){
        Assembler.registers.setValue(
            this.reg1 as Register,
            this.reg_num as number
        );
    }
}
class Lui extends RegImmInstruction{
    constructor(
        rd:Register,
        luiConstant:number
    ){
        super(rd, rd, luiConstant);
    }
    execute(){
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

class Ret extends AssemblyInstruction{
    constructor(){
        super();
    }
    binaryRep(): string {
        return '1100'+'0000'.repeat(7);
    }
    execute(): void {
        Assembler.pc.jump(
            Assembler.registers.getValue('ra') - 4
        );
    }
}

export const instructions: Map<string, typeof AssemblyInstruction> = new Map([
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