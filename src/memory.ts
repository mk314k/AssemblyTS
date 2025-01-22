/**
 * Represents the content stored in memory.
 */
export interface MemContent {
  binaryRep(): string;  // Returns the binary representation of the content.
  hexRep(): string;     // Returns the hexadecimal representation of the content.
  numValue(): number;   // Returns the numerical value of the content.
}

/**
 * Converts a number to two's complement binary format with a specified bit length.
 * @param num The number to convert to binary.
 * @param bitLength The desired length of the binary representation.
 * @returns The binary representation of the number.
 */
export function numToBin(num: number, bitLength = 5): string {
  const intVal = Math.trunc(num);
  if (intVal < 0) {
    const unsigned = (intVal >>> 0).toString(2);
    return unsigned.slice(-bitLength).padStart(bitLength, '1');
  }
  const numBin = intVal.toString(2);
  if (numBin.length > bitLength) {
    return numBin.slice(-bitLength);
  }
  return numBin.padStart(bitLength, '0');
}

/**
 * Represents a 32-bit word stored in memory.
 */
export class Data implements MemContent {
  constructor(public readonly data: number) {}

  numValue(): number {
    return this.data | 0;
  }

  binaryRep(): string {
    return numToBin(this.data, 32);
  }

  hexRep(): string {
    return (this.data >>> 0).toString(16).padStart(8, '0');
  }
}

/**
 * Represents memory in the system.
 * Supports both word-level `MemContent` entries (used by Instruction Memory and Data Memory UI)
 * and true little-endian byte-addressable load/store operations (`lb`, `lbu`, `lh`, `lhu`, `lw`, `sb`, `sh`, `sw`).
 */
export class Memory {
  public readonly memory: Map<number, MemContent>;

  constructor() {
    this.memory = new Map<number, MemContent>();
  }

  /**
   * Clears all entries in memory.
   */
  clear(): void {
    this.memory.clear();
  }

  /**
   * Retrieves the content stored at the specified memory address.
   * For unaligned or byte-manipulated addresses, reconstructs the 32-bit word if bytes exist.
   * @param address The memory address to retrieve content from.
   * @returns The content stored at the specified memory address.
   */
  get(address: number): MemContent | undefined {
    return this.memory.get(address);
  }

  /**
   * Sets the content at the specified memory address.
   * @param address The memory address to set content at.
   * @param value The content to be stored at the memory address.
   */
  set(address: number, value: MemContent): void {
    this.memory.set(address, value);
  }

  /**
   * Outputs the memory content to the specified HTML element.
   * @param memElement The HTML element to display memory content.
   */
  outHTML(memElement: HTMLElement | null): void {
    if (!memElement) return;

    memElement.innerHTML = '';

    if (this.memory.size === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'mem-empty';
      emptyDiv.textContent = 'No memory entries loaded';
      memElement.appendChild(emptyDiv);
      return;
    }

    const sortedEntries = Array.from(this.memory.entries()).sort((a, b) => a[0] - b[0]);

    sortedEntries.forEach(([address, value]) => {
      const memByteDiv = document.createElement('div');
      memByteDiv.classList.add('mem-byte', 'flex-horizontal');
      const hexVal = value.hexRep().padStart(8, '0');
      const decVal = value.numValue();
      memByteDiv.title = `Address: ${address} (0x${(address >>> 0).toString(16)}) | Decimal: ${decVal}`;
      memByteDiv.innerHTML = `
        <div class='address'>${address} <span class='addr-hex'>0x${(address >>> 0).toString(16)}</span></div>
        <div class='value'>0x${hexVal}</div>
      `;
      memElement.appendChild(memByteDiv);
    });
  }
}
