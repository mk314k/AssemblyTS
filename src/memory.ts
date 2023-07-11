export class Memory {
    public readonly memory: Map<number, string>;
    public readonly size: number;
  
    constructor() {
      this.memory = new Map<number, string>();
      this.size = 0;
    }
  
    getItem(address: number): string | undefined {
      return this.memory.get(address);
    }
  
    setItem(address: number, value: string): void {
      this.memory.set(address, value);
    }
  }