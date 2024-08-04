import { Assembler} from './instruction';
import { parser } from './parser';
import { CodeEditor } from './editor';
import './style.css'
import { handleLogin } from './login';
import { consoleBox } from './consoleBox';


/**
 * Initializes the main function responsible for compiling and executing assembly code.
 */
function main(): void {
  CodeEditor.init();
  consoleBox.init();
  Assembler.init();
  memOptionStyle('imemory', 'dmemory');

  const gitButton = document.getElementById("git");
  gitButton?.addEventListener('click', (e)=>{
      e.stopPropagation();
      handleLogin();
  });

  function memOptionStyle(activeMem:string, inactiveMem:string){
      const activeElem = document.getElementById(activeMem);
      const inactiveElem = document.getElementById(inactiveMem);
      if (activeElem && inactiveElem){
        Assembler.isDataMemActive = (activeMem === 'dmemory');
        activeElem.style.color = 'white';
        inactiveElem.style.color = '#999999';
      }
  }
  document.getElementById('dmemory')?.addEventListener('click', ()=>{
    if (!Assembler.isDataMemActive){
      memOptionStyle('dmemory', 'imemory');
      Assembler.showData();
    }
  });
  document.getElementById('imemory')?.addEventListener('click', ()=>{
    if (Assembler.isDataMemActive){
      memOptionStyle('imemory', 'dmemory');
      Assembler.showInst();
    }
  });

  function getAddr(id:string):number{
    const addrArea = document.getElementById(id) as HTMLInputElement;
    let addr = parseInt(addrArea.value);
    if (isNaN(addr)) {
      addr = 504;
    }
    return addr;
  }

  // Compile assembly code
  function compile(): void {
    parser(CodeEditor.code, getAddr('buildAddr'), Assembler.instMemory);
    Assembler.showInst();
  }

  // Attach event listeners to buttons for compiling and executing code
  const buildRun = document.getElementById("buildRun") as HTMLButtonElement;
  const build = document.getElementById("build") as HTMLButtonElement;
  const run = document.getElementById("run") as HTMLButtonElement;

  buildRun?.addEventListener(
    'click', () => {
      compile();
      Assembler.execute(getAddr('runAddr'));
    }
  );
  build?.addEventListener(
    'click', () => {
      compile();
    }
  );
  run?.addEventListener(
    'click', () => {
      Assembler.execute(getAddr('runAddr'));
    }
  );
}

// Call the main function when the DOM is ready
document.addEventListener("DOMContentLoaded", main);

