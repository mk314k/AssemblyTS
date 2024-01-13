import { Assembler } from './instruction';
import { parser } from './parser';
import './style.css'


function main(): void {
  const registers:HTMLElement|null = document.getElementById("registers");
  const imemory:HTMLElement|null = document.getElementById("instruction-memory");
  const dmemory:HTMLElement|null = document.getElementById("data-memory");
  const compile = document.getElementById("compile") as HTMLButtonElement;

  if (registers !== null && imemory !== null && dmemory){
    let code = "";
    compile?.addEventListener(
      'click', ()=>{
        const textarea = document.getElementById("code") as HTMLTextAreaElement;
        code = textarea.value;
        let parsedCode = parser(code);
        console.log(parsedCode);
      }
    );
  }

  
  
}

// Call the main function when the DOM is ready
document.addEventListener("DOMContentLoaded", main);

