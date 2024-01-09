import { Memory } from "./memory";
import { Counter, RegisterSet, RegIndex } from "./register";

export class AssemblyInstruction {
    static registers = new RegisterSet();
    static instMemory = new Memory();
    static dataMemory = new Memory();
    static pc = new Counter();
    static ic = new Counter();
    constructor(
        public readonly rd:RegIndex|string,
        public readonly rs1:RegIndex|string,
        public readonly rs2:RegIndex|string|number
    ){}
    func = (arg1:number, arg2:number):number=>{
        throw new Error("function not implemented");
    };
}

class RegInstruction extends AssemblyInstruction {
    constructor(
        rd:RegIndex|string,
        rs1:RegIndex|string,
        rs2:RegIndex|string
    ){
        super(rd, rs1, rs2);
    }
    execute(){
        const rs2:RegIndex|string = this.rs2 ?? 'x0'; 
        RegInstruction.registers.setValue(
            this.rd, this.func(
                RegInstruction.registers.getValue(this.rs1), 
                RegInstruction.registers.getValue(this.rs2)
            )
        );
    }
}
class RegImmInstruction extends AssemblyInstruction {
    constructor(
        public readonly rd:RegIndex|string,
        public readonly rs1:RegIndex|string,
        public readonly rsval:number
    ){
        super();
    }
    execute(){
        RegImmInstruction.registers.setValue(
            this.rd, this.func(
                RegImmInstruction.registers.getValue(this.rs1), 
                this.rsval
            )
        );
    }
}
class MemInstruction extends AssemblyInstruction {

}
class BranchInstruction extends AssemblyInstruction {

}

// Register loading
class Li extends RegImmInstruction{
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Lui extends RegImmInstruction{
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}

// Memory Operation
class Lw extends MemInstruction{
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Sw extends MemInstruction{

}

// Reg operations
class Add extends RegInstruction{
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}

class Sub extends RegInstruction{
    func = (arg1: number, arg2: number): number => arg1 - arg2;
}
class And extends RegInstruction {
    func = (arg1: number, arg2: number): number => arg1 & arg2;
}
class Or extends RegInstruction {
    func = (arg1: number, arg2: number): number => arg1 | arg2;
}
class Xor extends RegInstruction {
    func = (arg1: number, arg2: number): number => arg1 ^ arg2;
}
class Sll extends RegInstruction {
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Srl extends RegInstruction {
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Sra extends RegInstruction {
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}

// Reg Immediate Operations
class Addi extends RegImmInstruction{
    func = (arg1: number, arg2: number): number => arg1 + arg2;
}
class Andi extends RegImmInstruction {

}
class Ori extends RegImmInstruction {

}
class Xori extends RegImmInstruction {

}
class Slti extends RegImmInstruction {

}
class Sltiu extends RegImmInstruction {

}
class Slli extends RegImmInstruction {

}
class Srli extends RegImmInstruction {

}
class Srai extends RegImmInstruction {

}

// Branch 
class Beq extends BranchInstruction{

}
class Bne extends BranchInstruction {

}
class Blt extends BranchInstruction {

}
class Bge extends BranchInstruction {

}
class Bltu extends BranchInstruction{

}
class Bgeu extends BranchInstruction{

}

// Jump
class Jal {

}
class Jalr{

}

export const instructions: Map<string, typeof AssemblyInstruction> = new Map([
    ['add', Add],
    ['addi', Addi],

]);

export class InstructionSet {

}