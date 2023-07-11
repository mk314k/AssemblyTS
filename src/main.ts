import { RegisterSet } from './register';
import './style.css'


function main(): void {
  const registers:HTMLElement|null = document.getElementById("registers");
  const imemory:HTMLElement|null = document.getElementById("instruction-memory");
  const dmemory:HTMLElement|null = document.getElementById("data-memory");
  const compile = document.getElementById("compile") as HTMLButtonElement;

  if (registers !== null && imemory !== null && dmemory){
    const regs = new RegisterSet(registers);
    let code = "";
    regs.outHTML();
    compile?.addEventListener(
      'click', ()=>{
        const textarea = document.getElementById("code") as HTMLTextAreaElement;
        code = textarea.value;
        console.log(code);
      }
    );
  }

  
  
}

// Call the main function when the DOM is ready
document.addEventListener("DOMContentLoaded", main);

