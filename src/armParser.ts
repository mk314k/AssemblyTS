import { Assembler, AssemblyInstruction } from "./instruction";
import { armInstructions } from "./armInstruction";
import { SyntaxError } from "./exception";
import { Register } from "./register";
import { armRegValidStr } from "./armRegister";
import { Memory } from "./memory";
import { parseDataDirective } from "./parser";

export const armLabels: Map<string, number> = new Map();

const DEFAULT_DATA_START_ADDR = 100;

const ARM_PC_RELATIVE_INSTRUCTIONS = new Set([
  'b', 'bl', 'beq', 'bne', 'blt', 'bge', 'bgt', 'ble',
  'bhi', 'bls', 'bcs', 'bhs', 'bcc', 'blo'
]);

/**
 * Strips ARM comments (`;`, `@`, or `#` comments that are not `#<number>` immediates).
 */
function stripArmComments(rawLine: string): string {
  const withoutSemiOrAt = rawLine.split(/[;@]/)[0];
  const hashCommentMatch = withoutSemiOrAt.match(/(^|\s)#(?![+-]?(?:0x[0-9a-fA-F]+|\d+)\b)/);
  if (hashCommentMatch && hashCommentMatch.index !== undefined) {
    return withoutSemiOrAt.slice(0, hashCommentMatch.index).trim();
  }
  return withoutSemiOrAt.trim();
}

function getArmArg(
  arg: string | undefined,
  currentPc: number,
  isPcRelative: boolean
): Register | number {
  if (arg === undefined) {
    return '';
  }
  let cleaned = arg.trim();
  if (cleaned === '') {
    return '';
  }
  if (cleaned.startsWith('#') || cleaned.startsWith('=')) {
    cleaned = cleaned.slice(1).trim();
  }

  if (armLabels.has(cleaned)) {
    const labelAddr = armLabels.get(cleaned) as number;
    return isPcRelative ? labelAddr - currentPc : labelAddr;
  } else if (armRegValidStr(cleaned)) {
    return cleaned.toLowerCase();
  } else if (/^[+-]?0x[0-9a-fA-F]+$/.test(cleaned)) {
    return parseInt(cleaned, 16);
  } else if (/^[+-]?\d+(\.\d+)?$/.test(cleaned)) {
    return parseFloat(cleaned);
  } else {
    return cleaned;
  }
}

type pseudoMem = Map<number, AssemblyInstruction>;

/**
 * Two-pass ARM (AArch32) assembly parser for AssemblyTS.
 * Supports `#imm` immediates, `[rn, #offset]` bracket memory addressing, `{r0, lr}` stack lists,
 * `;` / `@` / `#` comments, and `.data` / `.text` directives.
 */
export function parseArm(
  code: string,
  start_addr = 504,
  memory?: Memory,
  dataMemory: Memory = Assembler.dataMemory
): pseudoMem | void {
  const lines = code.split("\n");
  let instMem: Memory | pseudoMem | undefined = memory;

  if (instMem === undefined) {
    instMem = new Map<number, AssemblyInstruction>();
  } else if (instMem instanceof Memory) {
    instMem.clear();
  }

  armLabels.clear();

  let currentSection: 'text' | 'data' = 'text';
  let scanTextAddr = start_addr;
  let scanDataAddr = DEFAULT_DATA_START_ADDR;
  let hasDataDirectives = false;

  const instructionLines: { addr: number; text: string; lineNo: number }[] = [];

  // Pass 1: Process .data / .text sections and collect all labels
  for (let i = 0; i < lines.length; i++) {
    let line = stripArmComments(lines[i]);
    if (!line) continue;

    const lower = line.toLowerCase();
    if (lower === '.data') {
      if (!hasDataDirectives) {
        dataMemory.clear();
        hasDataDirectives = true;
      }
      currentSection = 'data';
      continue;
    } else if (lower === '.text' || lower.startsWith('.globl') || lower.startsWith('.global') || lower.startsWith('.arm')) {
      currentSection = 'text';
      continue;
    }

    while (line.includes(':')) {
      const firstQuote = line.indexOf('"');
      const colonIdx = line.indexOf(':');
      if (firstQuote !== -1 && colonIdx > firstQuote) {
        break;
      }
      const labelName = line.slice(0, colonIdx).trim();
      if (!labelName || /\s/.test(labelName)) {
        throw new SyntaxError(`Line ${i + 1}: Invalid ARM label name "${labelName}"`);
      }

      if (currentSection === 'data') {
        const remainder = line.slice(colonIdx + 1).trim().toLowerCase();
        if (remainder.startsWith('.word') && (scanDataAddr & 3) !== 0) {
          scanDataAddr = (scanDataAddr + 3) & ~3;
        } else if (remainder.startsWith('.half') && (scanDataAddr & 1) !== 0) {
          scanDataAddr += 1;
        }
        armLabels.set(labelName, scanDataAddr);
      } else {
        armLabels.set(labelName, scanTextAddr);
      }

      line = line.slice(colonIdx + 1).trim();
    }

    if (!line) continue;

    const remLower = line.toLowerCase();
    if (remLower === '.data') {
      if (!hasDataDirectives) {
        dataMemory.clear();
        hasDataDirectives = true;
      }
      currentSection = 'data';
      continue;
    } else if (remLower === '.text' || remLower.startsWith('.globl') || remLower.startsWith('.global')) {
      currentSection = 'text';
      continue;
    }

    if (currentSection === 'data') {
      scanDataAddr = parseDataDirective(line, i + 1, scanDataAddr, dataMemory);
    } else {
      instructionLines.push({ addr: scanTextAddr, text: line, lineNo: i + 1 });
      scanTextAddr += 4;
    }
  }

  // Pass 2: Assemble ARM instructions
  for (const item of instructionLines) {
    const normalized = item.text
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .replace(/\{/g, '')
      .replace(/\}/g, '')
      .replace(/\(/g, ',')
      .replace(/\)/g, '');

    const commaParts = normalized.split(',').map(part => part.trim());
    const firstTokens = commaParts[0].split(/\s+/);
    const mnemonic = firstTokens[0].toLowerCase();

    if (!armInstructions.has(mnemonic)) {
      throw new SyntaxError(`Line ${item.lineNo}: "${firstTokens[0]}" is not a defined ARM instruction`);
    }

    const isPcRel = ARM_PC_RELATIVE_INSTRUCTIONS.has(mnemonic);
    const InstClass = armInstructions.get(mnemonic) as typeof AssemblyInstruction;
    const firstArgStr = firstTokens.slice(1).join(' ');
    const arg1 = getArmArg(firstArgStr || undefined, item.addr, isPcRel);

    let inst: AssemblyInstruction;
    if ((arg1 !== '' && !Number.isNaN(arg1)) || arg1 === 0) {
      const arg2 = getArmArg(commaParts[1], item.addr, isPcRel);
      if ((arg2 !== '' && !Number.isNaN(arg2)) || arg2 === 0) {
        const arg3 = getArmArg(commaParts[2], item.addr, isPcRel);
        if ((arg3 !== '' && !Number.isNaN(arg3)) || arg3 === 0) {
          inst = new InstClass(arg1, arg2, arg3);
        } else {
          inst = new InstClass(arg1, arg2);
        }
      } else {
        inst = new InstClass(arg1);
      }
    } else {
      inst = new InstClass();
    }

    inst.sourceLine = item.lineNo;
    instMem.set(item.addr, inst);
  }

  if (memory === undefined) {
    return instMem as pseudoMem;
  }
}
