import { AssemblyInstruction, instructions } from "./instruction";
import { SyntaxError } from "./exception";
import { Register, regValidStr } from "./register";
import { Memory } from "./memory";

// Represents a mapping of labels to memory addresses
const labels: Map<string, number> = new Map();

// Function to determine the register number based on the argument provided
function getRegNum(arg: string | undefined): Register | number {
    if (arg === undefined) {
        return '';
    }
    arg = arg.trim();
    // Check if the argument exists in the labels map
    if (labels.has(arg)) {
        // Return the memory address associated with the label
        return labels.get(arg) as number;
    } else if (regValidStr(arg)) {
        console.log(arg);
        // Return the register number if it's valid
        return arg;
    } else {
        // Convert the argument to a number and return
        return parseFloat(arg);
    }
}

// Define a type for pseudo memory, which is a mapping of memory addresses to assembly instructions
type pseudoMem = Map<number, AssemblyInstruction>;

// Function to parse the assembly code and populate the memory with instructions
export function parser(code: string, start_addr = 540, memory?: Memory): pseudoMem | void {
    // Split the code into lines
    const lines = code.split("\n");
    let instMem: Memory | pseudoMem | undefined = memory;
    // If memory is not provided, initialize a new pseudo memory
    if (instMem === undefined) {
        instMem = new Map<number, AssemblyInstruction>;
    }
    let addr = start_addr;
    // Clear existing labels
    labels.clear();
    // Iterate through each line of the code
    for (let line of lines) {
        line = line.trim();
        // If the line is not empty
        if (line) {
            // If the line ends with ':', it's a label declaration
            if (line.endsWith(':')) {
                // Set the label with the corresponding memory address
                labels.set(line.slice(0, line.length - 1), addr)
            } else {
                // Replace '(' and ')' with ',' for splitting
                line = line.replace(/\(/g, ',').replace(/\)/g, '');
                const idrdres = line.split(',');
                const idrd = idrdres[0].split(' ');
                // Check if the instruction exists in the instruction map
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
