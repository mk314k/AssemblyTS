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
    const direct = this.memory.get(address);
    if (direct !== undefined) {
      return direct;
    }
    // Check if any overlapping aligned 32-bit words exist around this address
    const base0 = address & ~3;
    const base1 = (address + 3) & ~3;
    if (this.memory.has(base0) || this.memory.has(base1)) {
      return new Data(this.loadWord(address));
    }
    return undefined;
  }

  /**
   * Sets the content at the specified memory address.
   * If `value` is a `Data` instance, stores it using little-endian byte-addressable words.
   * @param address The memory address to set content at.
   * @param value The content to be stored at the memory address.
   */
  set(address: number, value: MemContent): void {
    if (value instanceof Data) {
      this.storeWord(address, value.numValue());
    } else {
      this.memory.set(address, value);
    }
  }

  /**
   * Reads a single unsigned byte (0..255) from a byte address (little-endian within 4-byte aligned words).
   */
  public readByteUnsigned(address: number): number {
    const wordAddr = address & ~3;
    const byteOffset = address & 3;
    const content = this.memory.get(wordAddr);
    if (!content) return 0;
    const wordVal = content.numValue();
    return (wordVal >>> (byteOffset * 8)) & 0xff;
  }

  /**
   * Writes a single byte (0..255) to a byte address (little-endian within 4-byte aligned words).
   */
  public writeByte(address: number, byteVal: number): void {
    const wordAddr = address & ~3;
    const byteOffset = address & 3;
    const shift = byteOffset * 8;
    const currentWord = this.memory.get(wordAddr)?.numValue() ?? 0;
    const mask = ~(0xff << shift);
    const updatedWord = (currentWord & mask) | ((byteVal & 0xff) << shift);
    this.memory.set(wordAddr, new Data(updatedWord));
  }

  /**
   * Loads a signed 8-bit byte (`lb`) from `address`.
   */
  public loadByte(address: number): number {
    const b = this.readByteUnsigned(address);
    return (b << 24) >> 24;
  }

  /**
   * Loads an unsigned 8-bit byte (`lbu`) from `address`.
   */
  public loadByteUnsigned(address: number): number {
    return this.readByteUnsigned(address);
  }

  /**
   * Loads a signed 16-bit halfword (`lh`, little-endian) from `address`.
   */
  public loadHalf(address: number): number {
    const b0 = this.readByteUnsigned(address);
    const b1 = this.readByteUnsigned(address + 1);
    const half = b0 | (b1 << 8);
    return (half << 16) >> 16;
  }

  /**
   * Loads an unsigned 16-bit halfword (`lhu`, little-endian) from `address`.
   */
  public loadHalfUnsigned(address: number): number {
    const b0 = this.readByteUnsigned(address);
    const b1 = this.readByteUnsigned(address + 1);
    return (b0 | (b1 << 8)) >>> 0;
  }

  /**
   * Loads a 32-bit word (`lw`, little-endian) from `address`.
   */
  public loadWord(address: number): number {
    if ((address & 3) === 0) {
      return (this.memory.get(address)?.numValue() ?? 0) | 0;
    }
    const b0 = this.readByteUnsigned(address);
    const b1 = this.readByteUnsigned(address + 1);
    const b2 = this.readByteUnsigned(address + 2);
    const b3 = this.readByteUnsigned(address + 3);
    return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) | 0;
  }

  /**
   * Stores an 8-bit byte (`sb`) to `address`.
   */
  public storeByte(address: number, value: number): void {
    this.writeByte(address, value & 0xff);
  }

  /**
   * Stores a 16-bit halfword (`sh`, little-endian) to `address`.
   */
  public storeHalf(address: number, value: number): void {
    this.writeByte(address, value & 0xff);
    this.writeByte(address + 1, (value >>> 8) & 0xff);
  }

  /**
   * Stores a 32-bit word (`sw`, little-endian) to `address`.
   */
  public storeWord(address: number, value: number): void {
    if ((address & 3) === 0) {
      this.memory.set(address, new Data(value | 0));
      return;
    }
    this.writeByte(address, value & 0xff);
    this.writeByte(address + 1, (value >>> 8) & 0xff);
    this.writeByte(address + 2, (value >>> 16) & 0xff);
    this.writeByte(address + 3, (value >>> 24) & 0xff);
  }

  /**
   * Outputs the memory content to the specified HTML element.
   * @param memElement The HTML element to display memory content.
   * @param activeAddress Optional PC address to highlight in instruction memory.
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
