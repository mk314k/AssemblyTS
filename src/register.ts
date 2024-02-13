  import {RegisterIndexError} from './exception';
import { numToBin } from './memory';

  const regMap: { [key: string]: string } = {
    zero: "x0",
    ra: "x1",
    sp: "x2",
    gp: "x3",
    tp: "x4",
    t0: "x5",
    t1: "x6",
    t2: "x7",
    s0: "x8",
    s1: "x9",
    a0: "x10",
    a1: "x11",
    a2: "x12",
    a3: "x13",
    a4: "x14",
    a5: "x15",
    a6: "x16",
    a7: "x17",
    s2: "x18",
    s3: "x19",
    s4: "x20",
    s5: "x21",
    s6: "x22",
    s7: "x23",
    s8: "x24",
    s9: "x25",
    s10: "x26",
    s11: "x27",
    t3: "x28",
    t4: "x29",
    t5: "x30",
    t6: "x31",
  };
  
  
  // Function to validate if the register string is valid
export function regValidStr(reg: string): boolean {
  const pattern = /^x([0-9]|[1-2]\d|3[0-1])$/;
  return pattern.test(reg) || reg in regMap;
}

// Define Register type as string or number
export type Register = string | number;

// Function to convert register string or number to its corresponding index
function regToIndex(reg: Register): number {
  if (typeof reg === 'number') {
      // Check if it's an integer and within the range 0-31
      if (Number.isInteger(reg) && reg >= 0 && reg < 32) {
          return reg;
      } else {
          throw new RegisterIndexError();
      }
  } else {
      // If it's a string, convert it to index
      if (reg in regMap) {
          reg = regMap[reg];
      } else {
          const pattern = /^x([0-9]|[1-2]\d|3[0-1])$/;
          if (!pattern.test(reg)) {
              throw new RegisterIndexError();
          }
      }
      return parseInt(reg.slice(1));
  }
}

// Function to convert register string or number to its binary representation
export function regToBin(reg: Register): string {
  return numToBin(regToIndex(reg), 5);
}

// Function to validate if the register string or number is valid
export function regValid(reg: Register): boolean {
  if (typeof reg === 'number') {
      // Check if it's an integer and within the range 0-31
      return Number.isInteger(reg) && reg >= 0 && reg < 32;
  } else {
      const pattern = /^x([0-9]|[1-2]\d|3[0-1])$/;
      return pattern.test(reg) || reg in regMap;
  }
}

// Counter class to manage program counter
export class Counter {
  val: number;

  constructor(val = 0) {
      this.val = val;
  }

  // Method to set program counter to a specific value
  jump(val: number): void {
      this.val = val;
  }

  // Method to increment program counter by 4 (size of instruction)
  step(): void {
      this.val += 4;
  }
}

// RegisterSet class to manage registers
export class RegisterSet {
  registers: number[];

  constructor() {
      this.registers = new Array(32).fill(0);
  }

  // Method to get value of a register
  getValue(reg: Register): number {
      const index = regToIndex(reg);
      return this.registers[index];
  }

  // Method to set value of a register
  setValue(reg: Register, value: number): void {
      const index = regToIndex(reg);
      // Prevent setting the value of register x0
      if (index != 0) {
          this.registers[index] = value;
      }
  }

  // Method to output register values to HTML element
  outHTML(regElement: HTMLElement | null): void {
      if (regElement) {
          let html = "";
          // Iterate through registers
          for (const regName in regMap) {
              let regValue = this.getValue(regName).toString(16);
              // Add leading zeros if necessary
              if (regValue.length < 8) {
                  regValue = "0".repeat(8 - regValue.length) + regValue;
              }
              // Create HTML for register display
              html += `
                  <div class="register flex-vertical">
                      <span>${regName}</span>
                      <span>0x${regValue}</span>
                      <span>${regMap[regName]}</span>
                  </div>
              `;
          }
          // Set HTML content of register element
          regElement.innerHTML = html;
      }
  }
}

  
