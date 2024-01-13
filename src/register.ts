  import {RegisterIndexError} from './exception';

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
  
  
  export function regValidStr(reg: string): boolean {
        const pattern = /^x([0-9]|[1-2]\d|3[0-1])$/;
        return pattern.test(reg) || reg in regMap;
  }
  
  export type Register = string | number;

  function regToIndex(reg: Register): number {
    if (typeof reg === 'number') {
      // Check if it's an integer and within the range 0-31
       if (Number.isInteger(reg) && reg >= 0 && reg < 32){
          return reg;
       } else {
          throw new RegisterIndexError();
       }
    } else {
      if (reg in regMap){
        reg = regMap[reg];
      } else{
        const pattern = /^x([0-9]|[1-2]\d|3[0-1])$/;
        if (! pattern.test(reg)){
          throw new RegisterIndexError();
        }
      }
      return parseInt(reg.slice(1));
    }
  }

  export function regValid(reg: Register): boolean {
    if (typeof reg === 'number') {
        // Check if it's an integer and within the range 0-31
        return Number.isInteger(reg) && reg >= 0 && reg < 32;
    } else {
        const pattern = /^x([0-9]|[1-2]\d|3[0-1])$/;
        return pattern.test(reg) || reg in regMap;
    }
  }

  export class Counter {
    val: number;
  
    constructor(val = 0) {
      this.val = val;
    }
    jump(val:number){
      this.val = val;
    }
  
    step() {
      this.val += 4;
    }
  }
  
  export class RegisterSet {
    registers: number[];
  
    constructor() {
      this.registers = new Array(32).fill(0);
    }
  
  
    getValue(reg: Register): number {
      const index = regToIndex(reg);
      return this.registers[index];
    }
  
    setValue(reg: Register, value: number): void {
      const index = regToIndex(reg);
      this.registers[index] = value;
    }
    outHTML() {
        let html = "";
        for (const regName in regMap) {
          let regValue = this.registers[regToIndex(regName)].toString();
          if (regValue.length < 8){
            regValue = "0".repeat(8-regValue.length) + regValue;
          }
          html += `
            <div class="register flex-vertical">
              <span>${regName}</span>
              <span>0d${regValue}</span>
              <span>${regMap[regName]}</span>
            </div>
          `;
        }
        // this.regElement.innerHTML = html;
    }
  }
  
