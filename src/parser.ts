import { Assembler, AssemblyInstruction, instructions } from "./instruction";
import { SyntaxError } from "./exception";
import { Register, regValidStr } from "./register";
import { Memory } from "./memory";

// Represents a mapping of labels to memory addresses (both .data and .text labels)
export const labels: Map<string, number> = new Map();

// Default starting address for `.data` segment
const DEFAULT_DATA_START_ADDR = 100;

// Instructions whose target operand is a PC-relative byte offset when given a label
const PC_RELATIVE_INSTRUCTIONS = new Set([
  'beq', 'bne', 'blt', 'bge', 'bgt', 'ble', 'bltu', 'bgeu',
  'jal', 'j'
]);

/**
 * Parses a numeric literal (decimal or hexadecimal `0x...`).
 */
function parseNumericLiteral(token: string, lineNo?: number): number {
  const trimmed = token.trim();
  if (/^-?0x[0-9a-fA-F]+$/.test(trimmed)) {
    return parseInt(trimmed, 16);
  }
  const num = Number(trimmed);
  if (Number.isNaN(num)) {
    throw new SyntaxError(
      lineNo ? `Line ${lineNo}: Invalid numeric literal "${token}"` : `Invalid numeric literal "${token}"`
    );
  }
  return num;
}

/**
 * Function to determine the register or numerical argument based on the token provided.
 * If the instruction is PC-relative (branch or jal/j) and the argument is a label,
 * converts the label's absolute address into a PC-relative byte offset (`labelAddr - currentPc`).
 * For `la` / `li` or other instructions, resolves a label to its absolute address.
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
  } else if (/^-?\d+(\.\d+)?$/.test(arg)) {
    return parseFloat(arg);
  } else {
    // Return non-numeric string token (e.g. invalid register like "x99") so instruction constructors can throw RegisterIndexError
    return arg;
  }
}

/**
 * Unescapes common C-style escape sequences inside `.asciz` / `.string` literals.
 */
function unescapeStringLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\0/g, '\0')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Parses a `.data` directive line and writes the values into `dataMem` starting at `dataAddr`.
 * Returns the updated `dataAddr`.
 */
function parseDataDirective(
  line: string,
  lineNo: number,
  dataAddr: number,
  dataMem: Memory
): number {
  const match = line.match(/^(\.\w+)\s*(.*)$/);
  if (!match) {
    throw new SyntaxError(`Line ${lineNo}: Expected data directive (e.g., .word, .byte, .half, .asciz) in .data section`);
  }
  const directive = match[1].toLowerCase();
  const rest = match[2].trim();

  if (directive === '.word') {
    // Align to 4-byte boundary if needed
    if ((dataAddr & 3) !== 0) {
      dataAddr = (dataAddr + 3) & ~3;
    }
    const values = rest.split(',').map(v => v.trim()).filter(Boolean);
    if (values.length === 0) {
      throw new SyntaxError(`Line ${lineNo}: .word directive requires at least one value`);
    }
    for (const valStr of values) {
      dataMem.storeWord(dataAddr, parseNumericLiteral(valStr, lineNo));
      dataAddr += 4;
    }
  } else if (directive === '.half') {
    if ((dataAddr & 1) !== 0) {
      dataAddr += 1;
    }
    const values = rest.split(',').map(v => v.trim()).filter(Boolean);
    if (values.length === 0) {
      throw new SyntaxError(`Line ${lineNo}: .half directive requires at least one value`);
    }
    for (const valStr of values) {
      dataMem.storeHalf(dataAddr, parseNumericLiteral(valStr, lineNo));
      dataAddr += 2;
    }
  } else if (directive === '.byte') {
    const values = rest.split(',').map(v => v.trim()).filter(Boolean);
    if (values.length === 0) {
      throw new SyntaxError(`Line ${lineNo}: .byte directive requires at least one value`);
    }
    for (const valStr of values) {
      dataMem.storeByte(dataAddr, parseNumericLiteral(valStr, lineNo));
      dataAddr += 1;
    }
  } else if (directive === '.asciz' || directive === '.string') {
    const strMatch = rest.match(/^"(.*)"$/);
    if (!strMatch) {
      throw new SyntaxError(`Line ${lineNo}: ${directive} requires a double-quoted string literal`);
    }
    const str = unescapeStringLiteral(strMatch[1]);
    for (let i = 0; i < str.length; i++) {
      dataMem.storeByte(dataAddr, str.charCodeAt(i));
      dataAddr += 1;
    }
    // Null terminator
    dataMem.storeByte(dataAddr, 0);
    dataAddr += 1;
  } else if (directive === '.space' || directive === '.zero') {
    const numBytes = parseNumericLiteral(rest, lineNo);
    for (let i = 0; i < numBytes; i++) {
      dataMem.storeByte(dataAddr + i, 0);
    }
    dataAddr += numBytes;
  } else {
    throw new SyntaxError(`Line ${lineNo}: Unknown data directive "${directive}"`);
  }

  return dataAddr;
}

// Type for pseudo memory, which has all required properties similar to Memory; Used for type safety
type pseudoMem = Map<number, AssemblyInstruction>;

/**
 * Function to parse the assembly code and populate the memory with instructions (and `.data` into data memory).
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

    if (line) {
      instructionLines.push({ addr: scanAddr, text: line, lineNo: i + 1 });
      scanAddr += 4;
    }
  }

  // Pass 2: Parse instructions and resolve operands/labels
  for (const item of instructionLines) {
    // Normalize memory addressing syntax `offset(base)` -> `,offset,base`
    const normalized = item.text.replace(/\(/g, ',').replace(/\)/g, '');
    const commaParts = normalized.split(',').map(part => part.trim());
    const firstTokens = commaParts[0].split(/\s+/);
    const mnemonic = firstTokens[0].toLowerCase();

    if (!instructions.has(mnemonic)) {
      throw new SyntaxError(`Line ${item.lineNo}: "${firstTokens[0]}" is not a defined Assembly instruction`);
    }

    const isPcRel = PC_RELATIVE_INSTRUCTIONS.has(mnemonic);
    const InstClass = instructions.get(mnemonic) as typeof AssemblyInstruction;
    const firstArgStr = firstTokens.slice(1).join(' ');
    const reg1 = getRegNum(firstArgStr || undefined, item.addr, isPcRel);

    if ((reg1 !== '' && !Number.isNaN(reg1)) || reg1 === 0) {
      const reg2 = getRegNum(commaParts[1], item.addr, isPcRel);
      if ((reg2 !== '' && !Number.isNaN(reg2)) || reg2 === 0) {
        const reg3 = getRegNum(commaParts[2], item.addr, isPcRel);
        if ((reg3 !== '' && !Number.isNaN(reg3)) || reg3 === 0) {
          const inst = new InstClass(reg1, reg2, reg3);
          instMem.set(item.addr, inst);
        } else {
          const inst = new InstClass(reg1, reg2);
          instMem.set(item.addr, inst);
        }
      } else {
        const inst = new InstClass(reg1);
        instMem.set(item.addr, inst);
      }
    } else {
      const inst = new InstClass();
      instMem.set(item.addr, inst);
    }
  }

  if (memory === undefined) {
    return instMem as pseudoMem;
  }
}
