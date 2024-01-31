export interface MemContent {
  binaryRep():string;
  hexRep():string;
  numValue():number;
}

export function numToBin(num:number, bitLength=5):string{
  let numBin =  num.toString(2);
  if (numBin.length < bitLength){
    numBin = "0".repeat(bitLength - numBin.length) + numBin;
  }
  return numBin;
}

export class Data implements MemContent{
  constructor(public readonly data:number){}
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
export class Memory {
    public readonly memory: Map<number, MemContent>;
  
    constructor() {
      this.memory = new Map<number, MemContent>();
    }
  
    get(address: number): MemContent | undefined {
      return this.memory.get(address);
    }
  
    set(address: number, value: MemContent): void {
      this.memory.set(address, value);
    }
    outHTML(memElement:HTMLElement|null){
      if (memElement) {
        memElement.innerHTML = '';
        this.memory.forEach((value, address) => {
            const memByteDiv = document.createElement('div');
            memByteDiv.classList.add('mem-byte');
            memByteDiv.classList.add('flex-horizontal');
            memByteDiv.innerHTML = `
                <div class= 'address'>${address}</div>
                <div class= 'value'>${value.hexRep()}</div>
              `;
            memElement.appendChild(memByteDiv);
        });
    }
    }
  }