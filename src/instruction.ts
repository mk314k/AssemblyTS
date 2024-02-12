import { Memory, MemContent, Data, numToBin} from "./memory";
import { Counter, RegisterSet, Register, regValid, regToBin} from "./register";
import {RegisterIndexError} from './exception';

/**
 * The Assembler class represents an Assembler (emulator for  hardware 
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

    /**
     * Outputs the console log to the specified HTML element.
     * 
     * @param consoleElement - The HTML element where the console log will be displayed.
     */
    static consoleOut = (consoleElement: HTMLElement | null) => {
        if (consoleElement) {
            consoleElement.innerHTML = Assembler.consoleLog;
        }
    }
}


/**
 * Represents an assembly instruction.
 */
export class AssemblyInstruction implements MemContent {
    /**
     * Creates an instance of AssemblyInstruction.
     * @param reg1 - The first register.
     * @param reg2 - The second register.
     * @param reg_num - The third register or a number.
     */
    constructor(
        public readonly reg1?: Register,
        public readonly reg2?: Register,
        public readonly reg_num?: Register
    ){}

    // Values for binary representation for the instruction
    funct7 = ""; // Function 7 field
    funct3 = ""; // Function 3 field
    opcode = ""; // Opcode field

    /**
     * Left to be implemented by specific instruction if required
     * @param _ - Placeholder for the first parameter.
     * @param __ - Placeholder for the second parameter.
     * @param ___ - Optional placeholder for the third parameter.
     * @throws an error since the function is not implemented.
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
        return this.numValue().toString(16);
    }

    /**
     * @returns The numerical value of the instruction.
     */
    numValue(): number {
        return parseInt(this.binaryRep(), 2);
    }

    /**
     * Executes the instruction.
     */
    execute(): void {
       throw new Error("Not Implemented execute function");
    }
}


/**
 * Represents an instruction that operates on three registers.
 * Inherits from AssemblyInstruction.
 */
class RegInstruction extends AssemblyInstruction {
    /**
     * Creates an instance of RegInstruction.
     * @param rd - The destination register.
     * @param rs1 - The first source register.
     * @param rs2 - The second source register.
     */
    constructor(
        rd: Register,
        rs1: Register,
        rs2: Register
    ){
        // Check if register indices are valid
        if (regValid(rd) && regValid(rs1) && regValid(rs2)){
            super(rd, rs1, rs2); // Call the superclass constructor
        } else {
            throw new RegisterIndexError(); // Throw an error for invalid register indices
        }
        this.funct7 = "0000000"; // Initialize funct7 field
        this.opcode = "0110011"; // Initialize opcode field
    }

    /**
     * Generates the binary representation of the instruction.
     * @returns The binary representation of the instruction.
     */
    binaryRep(): string {
        return this.funct7 +
                regToBin(this.reg_num as Register) +
                regToBin(this.reg2 as Register) +
                this.funct3 +
                regToBin(this.reg1 as Register) +
                this.opcode;
    }

    /**
     * Executes the instruction.
     */
    execute(): void {
        // Update the value of the destination register based on the operation result
        Assembler.registers.setValue(
            this.reg1 as Register,
            this.func(
                Assembler.registers.getValue(this.reg2 as Register), 
                Assembler.registers.getValue(this.reg_num as Register)
            ) as number
        );
    }
}

/**
 * Represents an instruction that operates on a register and an immediate value.
 * Inherits from AssemblyInstruction.
 */
class RegImmInstruction extends AssemblyInstruction {
    /**
     * Creates an instance of RegImmInstruction.
     * @param rd - The destination register.
     * @param rs1 - The source register.
     * @param rsval - The immediate value.
     */
    constructor(
        rd: Register,
        rs1: Register,
        rsval: number
    ){
        // Check if register indices are valid
        if (regValid(rd) && regValid(rs1)){
            super(rd, rs1, rsval); // Call the superclass constructor
        } else {
            throw new RegisterIndexError(); // Throw an error for invalid register indices
        }
        this.opcode = "0010011"; // Initialize opcode field
    }

    /**
     * Generates the binary representation of the instruction.
     * @returns The binary representation of the instruction.
     */
    binaryRep(): string {
        return numToBin(this.reg_num as number, 12) +
                regToBin(this.reg2 as Register) +
                this.funct3 +
                regToBin(this.reg1 as Register) +
                this.opcode;
    }

    /**
     * Executes the instruction.
     */
    execute(): void {
        // Update the value of the destination register based on the operation result
        Assembler.registers.setValue(
            this.reg1 as Register,
            this.func(
                Assembler.registers.getValue(this.reg2 as Register), 
                this.reg_num as number
            ) as number
        );
    }
}

/**
 * Represents a memory instruction that operates on two registers and an offset.
 * Inherits from AssemblyInstruction.
 */
class MemInstruction extends AssemblyInstruction {
    /**
     * Creates an instance of MemInstruction.
     * @param rs2 - The second source register.
     * @param offset - The offset value.
     * @param rs1 - The first source register.
     */
    constructor(
        rs2: Register,
        offset: number,
        rs1: Register
    ){
        // Check if register indices are valid
        if (regValid(rs2) && regValid(rs1)){
            super(rs2, rs1, offset); // Call the superclass constructor
        } else {
            throw new RegisterIndexError(); // Throw an error for invalid register indices
        }
        this.funct3 = "010"; // Set the funct3 field
    }
}

/**
 * Represents a branch instruction that operates on two registers and a label.
 * Inherits from AssemblyInstruction.
 */
class BranchInstruction extends AssemblyInstruction {
    /**
     * Creates an instance of BranchInstruction.
     * @param rs1 - The first source register.
     * @param rs2 - The second source register.
     * @param label - The label value.
     */
    constructor(
        rs1: Register,
        rs2: Register,
        label: number
    ){
        // Check if register indices are valid
        if (regValid(rs2) && regValid(rs1)){
            super(rs1, rs2, label); // Call the superclass constructor
        } else {
            throw new RegisterIndexError(); // Throw an error for invalid register indices
        }
        this.opcode = "1100011"; // Set the opcode field
    }

    /**
     * Executes the instruction by jumping to the specified address.
     */
    execute(): void {
        Assembler.pc.jump(
            this.func(
                Assembler.registers.getValue(this.reg1 as Register),
                Assembler.registers.getValue(this.reg2 as Register),
                this.reg_num as number
            )
        );
    }
}

/**
 * Represents a console instruction that operates on a single register.
 * Inherits from AssemblyInstruction.
 */
class ConsoleInstruction extends AssemblyInstruction {
    /**
     * Creates an instance of ConsoleInstruction.
     * @param reg - The register.
     * @param mode - The mode for console operation (optional, default is 'dec').
     */
    constructor(
        reg: Register,
        mode: string | number = 'dec'
    ){
        // Check if register index is valid
        if (regValid(reg)){
            super(reg, mode); // Call the superclass constructor
        } else {
            throw new RegisterIndexError(); // Throw an error for invalid register index
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