import { AssemblyInstruction, instructions } from "./instruction";
import { SyntaxError } from "./exception";
import { Register, regValidStr } from "./register";
import { Memory } from "./memory";

// Represents a mapping of labels to memory addresses
const labels: Map<string, number> = new Map();


function getRegNum(arg: string | undefined): Register | number {
    /** 
     * Function to determine the register number based on the argument provided
     * @param arg - label or reg or (number in string form)
    */
    if (arg === undefined) {
        return '';
    }
    arg = arg.trim();

    if (labels.has(arg)) {
        return labels.get(arg) as number;
    } else if (regValidStr(arg)) {
        return arg;
    } else {
        return parseFloat(arg);
    }
}

// Type for pseudo memory, which has all required properties similar to Memory; Used for type safety
type pseudoMem = Map<number, AssemblyInstruction>;

export function parser(code: string, start_addr = 540, memory?: Memory): pseudoMem | void {
    /**
     * Function to parse the assembly code and populate the memory with instructions
     * @param code
     * @param start_addr
     * @param memory
     */

    // Split the code into lines
    const lines = code.split("\n");
    let instMem: Memory | pseudoMem | undefined = memory;

    // If memory is not provided, initialize a new pseudo memory
    if (instMem === undefined) {
        instMem = new Map<number, AssemblyInstruction>;
    }
    let addr = start_addr;

    // Avoid using previous code labels
    labels.clear();
    
    for (let line of lines) {
        // Remove white spaces in either ends and comments
        line = line.split('#')[0];
        line = line.trim();
        
 
        if (line) {
            // If the line ends with ':', it's a label declaration
            if (line.endsWith(':')) {
                labels.set(line.slice(0, line.length - 1), addr)
            } else {
                // Replace '(' and ')' with ',' for splitting
                line = line.replace(/\(/g, ',').replace(/\)/g, '');
                const idrdres = line.split(',');
                const idrd = idrdres[0].split(' ');
                // Only instructions existing in the instruction map are processed
                if (instructions.has(idrd[0])) {
                    const id = instructions.get(idrd[0]) as typeof AssemblyInstruction;
                    // Get the register numbers or values for the instruction
                    const reg1 = getRegNum(idrd[1]);
                    if (reg1) {
                        const reg2 = getRegNum(idrdres[1]);
                        if (reg2 || reg2 === 0) {
                            const reg3 = getRegNum(idrdres[2]);
                            if (reg3 || reg3 === 0) {
                                // Create an instance of the instruction with the provided arguments
                                const inst = new id(reg1, reg2, reg3);
                                // Set the instruction at the current memory address
                                instMem.set(addr, inst);
                            } else {
                                const inst = new id(reg1, reg2);
                                instMem.set(addr, inst);
                            }
                        } else {
                            const inst = new id(reg1);
                            instMem.set(addr, inst);
                        }
                    } else {
                        const inst = new id();
                        instMem.set(addr, inst);
                    }
                    // Increment the memory address by 4
                    addr = addr + 4;
                } else {
                    // Throw a syntax error if the instruction is not recognized
                    throw new SyntaxError(`${idrd[0]} is not a defined Assembly instruction`);
                }
            }
        }
    }
    // If memory was not provided, return the pseudo memory
    if (memory === undefined) {
        return instMem as pseudoMem;
    }
}
