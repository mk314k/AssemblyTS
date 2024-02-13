/**
 * Represents the content stored in memory.
 */
export interface MemContent {
  binaryRep(): string;  // Returns the binary representation of the content.
  hexRep(): string;     // Returns the hexadecimal representation of the content.
  numValue(): number;   // Returns the numerical value of the content.
}

/**
 * Converts a number to binary format with a specified bit length.
 * @param num The number to convert to binary.
 * @param bitLength The desired length of the binary representation.
 * @returns The binary representation of the number.
 */
export function numToBin(num: number, bitLength = 5): string {
  let numBin = num.toString(2);
  if (numBin.length < bitLength) {
    numBin = "0".repeat(bitLength - numBin.length) + numBin;
  }
  return numBin;
}

/**
 * Represents data stored in memory.
 */
export class Data implements MemContent {
  constructor(public readonly data: number) { }
  
  numValue(): number {
    return this.data;
  }

  binaryRep(): string {
    return numToBin(this.data, 32);
  }

  hexRep(): string {
    return this.data.toString(16);
  }
}

/**
 * Represents memory in the system.
 */
export class Memory {
  public readonly memory: Map<number, MemContent>;

  constructor() {
    this.memory = new Map<number, MemContent>();
  }

  /**
   * Retrieves the content stored at the specified memory address.
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
    if (memElement) {
      memElement.innerHTML = '';
      this.memory.forEach((value, address) => {
        const memByteDiv = document.createElement('div');
        memByteDiv.classList.add('mem-byte');
        memByteDiv.classList.add('flex-horizontal');
        memByteDiv.innerHTML = `
          <div class='address'>${address}</div>
          <div class='value'>${value.hexRep()}</div>
        `;
        memElement.appendChild(memByteDiv);
      });
    }
  }
}
