import { AssemblyInstruction, instructions } from "./instruction";
import { SyntaxError } from "./exception";
import { Register, regValidStr } from "./register";
import { Memory } from "./memory";

// Represents a mapping of labels to memory addresses
const labels: Map<string, number> = new Map();

// Instructions whose target operand is a PC-relative byte offset when given a label
const PC_RELATIVE_INSTRUCTIONS = new Set([
  'beq', 'bne', 'blt', 'bge', 'bgt', 'ble', 'bltu', 'bgeu',
  'jal', 'j'
]);

/**
 * Function to determine the register or numerical argument based on the token provided.
 * If the instruction is PC-relative (branch or jal/j) and the argument is a label,
 * converts the label's absolute address into a PC-relative byte offset (`labelAddr - currentPc`).
 *
 * @param arg - label or reg or (number in string form)
 * @param currentPc - address of the current instruction
 * @param isPcRelative - whether label resolution should be relative to currentPc
 */
function getRegNum(
  arg: string | undefined,
  currentPc: number,
  isPcRelative: boolean
): Register | number {
  if (arg === undefined) {
    return '';
  }
  arg = arg.trim();
  if (arg === '') {
    return '';
  }

  if (labels.has(arg)) {
    const labelAddr = labels.get(arg) as number;
    return isPcRelative ? labelAddr - currentPc : labelAddr;
  } else if (regValidStr(arg)) {
    return arg;
  } else if (/^-?0x[0-9a-fA-F]+$/.test(arg)) {
    return parseInt(arg, 16);
  } else {
    return parseFloat(arg);
  }
}

// Type for pseudo memory, which has all required properties similar to Memory; Used for type safety
type pseudoMem = Map<number, AssemblyInstruction>;

/**
 * Function to parse the assembly code and populate the memory with instructions
 * Uses a two-pass approach so forward and backward label references both resolve properly.
 * @param code
 * @param start_addr
 * @param memory
 */
export function parser(code: string, start_addr = 504, memory?: Memory): pseudoMem | void {
  const lines = code.split("\n");
  let instMem: Memory | pseudoMem | undefined = memory;

  if (instMem === undefined) {
    instMem = new Map<number, AssemblyInstruction>();
  } else if (instMem instanceof Memory) {
    instMem.clear();
  }

  labels.clear();

  // Pass 1: Collect all labels and their corresponding instruction addresses
  let scanAddr = start_addr;
  const instructionLines: { addr: number; text: string; lineNo: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].split('#')[0].trim();
    if (!line) continue;

    // Support labels on their own line ("loop:") or inline ("loop: addi a0, a0, 1")
    while (line.includes(':')) {
      const colonIdx = line.indexOf(':');
      const labelName = line.slice(0, colonIdx).trim();
      if (!labelName || /\s/.test(labelName)) {
        throw new SyntaxError(`Line ${i + 1}: Invalid label name "${labelName}"`);
      }
      labels.set(labelName, scanAddr);
      line = line.slice(colonIdx + 1).trim();
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
