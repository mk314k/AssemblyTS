import { Memory } from "./memory";
import { Counter, RegisterSet } from "./register";

export class AssemblyInstruction {
    static registers = new RegisterSet();
    static instMemory = new Memory();
    static dataMemory = new Memory();
    static pc = new Counter();
    static ic = new Counter();

}

class RegInstruction extends AssemblyInstruction {

}
class RegImmInstruction extends AssemblyInstruction {

}
class MemInstruction extends AssemblyInstruction {

}
class BranchInstruction extends AssemblyInstruction {

}

// Register loading
class Li extends RegImmInstruction{

}
class Lui extends RegImmInstruction{

}

// Memory Operation
class Lw extends MemInstruction{

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

}
class Or extends RegInstruction {

}
class Xor extends RegInstruction {

}
class Sll extends RegInstruction {

}
class Srl extends RegInstruction {

}
class Sra extends RegInstruction {

}

// Reg Immediate Operations
class Addi extends RegImmInstruction{

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
    ['li', Li],
    ['lw', Lw]
]);