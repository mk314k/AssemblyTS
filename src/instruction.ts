import { Memory } from "./memory";
import { Counter, RegisterSet, Register, regValid} from "./register";
import {RegisterIndexError} from './exception';

export class AssemblyInstruction {
    static registers = new RegisterSet();
    static instMemory = new Memory();
    static dataMemory = new Memory();
    static pc = new Counter();
    static ic = new Counter();
    constructor(
        public readonly reg1:Register,
        public readonly reg2:Register,
        public readonly reg_num:Register
    ){}
    func = (_:number, __:number, ___?:number):number=>{
        throw new Error("function not implemented");
    };
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
        
    }
    execute(){
        AssemblyInstruction.registers.setValue(
            this.reg1, this.func(
                AssemblyInstruction.registers.getValue(this.reg2), 
                AssemblyInstruction.registers.getValue(this.reg_num as Register|string)
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
    }
    execute(){
        AssemblyInstruction.registers.setValue(
            this.reg1, this.func(
                AssemblyInstruction.registers.getValue(this.reg2), 
                this.reg_num as number
            ) as number
        );
    }
}
class MemInstruction extends AssemblyInstruction {}
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
        AssemblyInstruction.pc.jump(
            this.func(
                AssemblyInstruction.registers.getValue(this.reg1),
                AssemblyInstruction.registers.getValue(this.reg2),
                this.reg_num as number
            )
        );
    }
}

// Memory Operation
class Lw extends MemInstruction{
    constructor(
        rd:Register,
        rs2:Register,
        offset:number
    ){
        super(rd, rs2, offset);
    }
    execute(){
        const jump:number = this.func(
            AssemblyInstruction.registers.getValue(this.reg1),
            AssemblyInstruction.registers.getValue(this.reg2),
            this.reg_num as number
        );
        if (jump){
            AssemblyInstruction.pc.jump(this.reg_num as number);
        }
    }
}
class Sw extends MemInstruction{
    constructor(
        rs2:Register|string,
        rs1:Register|string,
        offset:number
    ){
        super(rs1, rs2, offset);
    }
    execute(){
        const jump:number = this.func(
            AssemblyInstruction.registers.getValue(this.reg1),
            AssemblyInstruction.registers.getValue(this.reg2),
            this.reg_num as number
        );
        if (jump){
            AssemblyInstruction.pc.jump(this.reg_num as number);
        }
    }
}

// Register loading
class Li extends RegImmInstruction{
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Lui extends RegImmInstruction{
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}

// Reg operations
class Add extends RegInstruction{
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}

class Sub extends RegInstruction{
    static func = (arg1: number, arg2: number): number => arg1 - arg2;
}
class And extends RegInstruction {
    static func = (arg1: number, arg2: number): number => arg1 & arg2;
}
class Or extends RegInstruction {
    static func = (arg1: number, arg2: number): number => arg1 | arg2;
}
class Xor extends RegInstruction {
    static func = (arg1: number, arg2: number): number => arg1 ^ arg2;
}
class Sll extends RegInstruction {
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Srl extends RegInstruction {
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Sra extends RegInstruction {
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}

// Reg Immediate Operations
class Addi extends RegImmInstruction{
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Andi extends RegImmInstruction {
    static func = (arg1: number, arg2: number): number => arg1 & arg2;
}
class Ori extends RegImmInstruction {
    static func = (arg1: number, arg2: number): number => arg1 | arg2;
}
class Xori extends RegImmInstruction {
    static func = (arg1: number, arg2: number): number => arg1 ^ arg2;
}
class Slti extends RegImmInstruction {
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Sltiu extends RegImmInstruction {
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Slli extends RegImmInstruction {
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Srli extends RegImmInstruction {
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Srai extends RegImmInstruction {
    static func = (arg1: number, arg2: number): number => arg1 + arg2;
}

// Branch 
class Beq extends BranchInstruction{
    static func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : AssemblyInstruction.pc.val;
}
class Bne extends BranchInstruction {
    static func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : AssemblyInstruction.pc.val;
}
class Blt extends BranchInstruction {
    static func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : AssemblyInstruction.pc.val;
}
class Bge extends BranchInstruction {
    static func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : AssemblyInstruction.pc.val;
}
class Bltu extends BranchInstruction{
    static func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : AssemblyInstruction.pc.val;
}
class Bgeu extends BranchInstruction{
    static func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : AssemblyInstruction.pc.val;
}

// Jump
class Jal {
    static func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : AssemblyInstruction.pc.val;
}
class Jalr{
    static func = (arg1: number, arg2: number, arg3?:number): number => 
    arg1 == arg2 ? arg3 as number : AssemblyInstruction.pc.val;
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
    ['bltu', Bltu],
    ['bgeu', Bgeu],
]);

export class InstructionSet {

}