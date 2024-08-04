import { Assembler, AssemblyInstruction } from './instruction';
import { parser } from './parser';
import { CodeEditor } from './editor';
import './style.css'
import { handleLogin } from './login';
import { consoleBox } from './consoleBox';


/**
 * Initializes the main function responsible for compiling and executing assembly code.
 */
function main(): void {
  // Retrieve HTML elements
  const registers: HTMLElement | null = document.getElementById("registers");
  const imemory: HTMLElement | null = document.getElementById("instruction-memory");
  const dmemory: HTMLElement | null = document.getElementById("data-memory");
  // const consoleLog: HTMLElement | null = document.getElementById("console");

  CodeEditor.init();
  consoleBox.init();

  const gitButton = document.getElementById("git");
  gitButton?.addEventListener('click', (e)=>{
      e.stopPropagation();
      handleLogin();
  });
  
  // Output initial state of data memory, registers, and instruction memory
  Assembler.dataMemory.outHTML(dmemory);
  Assembler.registers.outHTML(registers);
  Assembler.instMemory.outHTML(imemory);

  // Compile assembly code
  function compile(): void {
    const addrArea = document.getElementById("buildAddr") as HTMLInputElement;
    let addr = parseInt(addrArea.value);
    if (isNaN(addr)) {
      addr = 540;
    }
    parser(CodeEditor.code, addr, Assembler.instMemory);
    Assembler.instMemory.outHTML(imemory as HTMLElement);
  }

  // Execute compiled assembly code
  function execute(): void {
    const addrArea = document.getElementById("runAddr") as HTMLInputElement;
    let addr = parseInt(addrArea.value);
    if (isNaN(addr)) {
      addr = 540;
    }
    Assembler.pc.jump(addr);
    while (Assembler.pc.val !== 0) {
      const inst = Assembler.instMemory.get(Assembler.pc.val) as AssemblyInstruction;
      inst.execute();
      Assembler.pc.step();
    }
    Assembler.dataMemory.outHTML(dmemory as HTMLElement);
    Assembler.registers.outHTML(registers);
    Assembler.consoleOut();
  }

  // Attach event listeners to buttons for compiling and executing code
  if (registers !== null && imemory !== null && dmemory) {
    const buildRun = document.getElementById("buildRun") as HTMLButtonElement;
    const build = document.getElementById("build") as HTMLButtonElement;
    const run = document.getElementById("run") as HTMLButtonElement;

    buildRun?.addEventListener(
      'click', () => {
        compile();
        execute();
      }
    );
    build?.addEventListener(
      'click', () => {
        compile();
      }
    );
    run?.addEventListener(
      'click', () => {
        execute();
      }
    );
  }
}

// Call the main function when the DOM is ready
document.addEventListener("DOMContentLoaded", main);

