import { Assembler, AssemblyInstruction } from './instruction';
import { parser } from './parser';
import './style.css'


function main(): void {
  const registers:HTMLElement|null = document.getElementById("registers");
  const imemory:HTMLElement|null = document.getElementById("instruction-memory");
  const dmemory:HTMLElement|null = document.getElementById("data-memory");
  const consoleLog:HTMLElement|null = document.getElementById("console");

  Assembler.dataMemory.outHTML(dmemory);
  Assembler.registers.outHTML(registers);
  Assembler.instMemory.outHTML(imemory);

  function compile():void{
    const codeArea = document.getElementById("code") as HTMLTextAreaElement;
    const code = codeArea.value;
    const addrArea = document.getElementById("buildAddr") as HTMLTextAreaElement;
    let addr = parseInt(addrArea.value);
    if (isNaN(addr)){
      addr = 540;
    }
    parser(code, addr, Assembler.instMemory);
    Assembler.instMemory.outHTML(imemory as HTMLElement);
  }

  function execute():void{
    const addrArea = document.getElementById("runAddr") as HTMLTextAreaElement;
    let addr = parseInt(addrArea.value);
    if (isNaN(addr)){
      addr = 540;
    }
    Assembler.pc.jump(addr);
    while (Assembler.pc.val !== 0){
      const inst = Assembler.instMemory.get(Assembler.pc.val) as AssemblyInstruction;
      inst.execute();
      Assembler.pc.step();
    }
    Assembler.dataMemory.outHTML(dmemory as HTMLElement);
    Assembler.registers.outHTML(registers);
    Assembler.consoleOut(consoleLog);
  }

  if (registers !== null && imemory !== null && dmemory){
    const buildRun = document.getElementById("buildRun") as HTMLButtonElement;
    const build = document.getElementById("build") as HTMLButtonElement;
    const run = document.getElementById("run") as HTMLButtonElement;

    buildRun?.addEventListener(
      'click', ()=>{
        compile();
        execute();
      }
    );
    build?.addEventListener(
      'click', ()=>{
        compile();
      }
    );
    run?.addEventListener(
      'click', ()=>{
        execute();
      }
    );
  }
  
}

// Call the main function when the DOM is ready
document.addEventListener("DOMContentLoaded", main);

