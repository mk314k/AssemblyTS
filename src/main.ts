import { StateVar, StateVarList } from 'statebinderk';
import { Assembler, AssemblyInstruction, Architecture } from './instruction';
import { parser } from './parser';
import { parseArm } from './armParser';
import { CodeEditor } from './editor';
import './style.css';
import { handleLogin } from './login';
import { consoleBox } from './consoleBox';
import { codeTabPane, GitUser } from './github';

const RISCV_SAMPLE_PROGRAMS: Record<string, string> = {
  'quickstart.asm': `# AssemblyTS Quickstart Demo (RV32IM)
# Load two immediate values into registers a0 and a1
li a0, 5            # a0 = 5
li a1, 3            # a1 = 3

# Add and multiply using RV32I + RV32M instructions
add a2, a0, a1      # a2 = a0 + a1 (8)
mul a3, a2, a0      # a3 = 8 * 5 (40)
print a2            # Prints 8
print a3            # Prints 40

# End of program
ret                 # Return from program`,

  'fibonacci.asm': `# Compute first 7 Fibonacci numbers in a loop
li t0, 0            # F(0) = 0
li t1, 1            # F(1) = 1
li t2, 7            # Counter = 7 terms

loop:
beq t2, zero, done  # If counter == 0, exit loop
print t0            # Print current Fibonacci term
add t3, t0, t1      # t3 = t0 + t1
mv t0, t1           # t0 = t1
mv t1, t3           # t1 = t3
addi t2, t2, -1     # counter--
bne t2, zero, loop  # Repeat while counter != 0

done:
ret`,

  'subroutine.asm': `# Function Call (jal) and Return (ret) Demo
li sp, 1024         # Initialize stack pointer
addi sp, sp, -4     # Allocate 4 bytes on stack
sw ra, 0(sp)        # Save main's return address (0)

li a0, 6            # Compute 6! (factorial = 720)
jal ra, factorial   # Call factorial(6)

print a0            # Prints 720

lw ra, 0(sp)        # Restore main's return address
addi sp, sp, 4      # Deallocate stack frame
ret                 # Exit program

factorial:
li t0, 1            # accumulator = 1
fact_loop:
ble a0, zero, fact_done
mul t0, t0, a0      # accumulator *= a0
addi a0, a0, -1     # a0--
j fact_loop
fact_done:
mv a0, t0
ret                 # Return to caller (jumps to ra)`,

  'data_section.asm': `# .data & .text Section Directives + Byte/Word Memory Demo
.data
nums: .word 10, 20, 30, 40
bytes: .byte 0x41, 0x42, 0x43, 0x00

.text
la s0, nums         # Load address of 'nums' array (100)
lw t0, 0(s0)        # t0 = 10
lw t1, 4(s0)        # t1 = 20
lw t2, 8(s0)        # t2 = 30
lw t3, 12(s0)       # t3 = 40

add a0, t0, t1      # 10 + 20 = 30
add a0, a0, t2      # 30 + 30 = 60
add a0, a0, t3      # 60 + 40 = 100
print a0            # Prints sum of array (100)

la s1, bytes        # Load address of 'bytes'
lbu a1, 0(s1)       # Load first byte (0x41 = 65)
print a1            # Prints 65
ret`
};

const ARM_SAMPLE_PROGRAMS: Record<string, string> = {
  'arm_quickstart.s': `; AssemblyTS Quickstart Demo (ARM AArch32)
mov r0, #12         ; r0 = 12
mov r1, #5          ; r1 = 5
add r2, r0, r1      ; r2 = 12 + 5 (17)
mul r3, r2, r1      ; r3 = 17 * 5 (85)
cmp r3, #50         ; Sets CPSR flags (N=0, Z=0, C=1, V=0)
print r2            ; Prints 17
print r3            ; Prints 85
bx lr               ; Return from program`,

  'arm_fibonacci.s': `; Compute first 7 Fibonacci numbers in ARM
mov r0, #0          ; F(0) = 0
mov r1, #1          ; F(1) = 1
mov r2, #7          ; Counter = 7 terms

loop:
cmp r2, #0
beq done            ; If Z == 1 (counter == 0), exit loop
print r0            ; Print current Fibonacci term
add r3, r0, r1      ; r3 = r0 + r1
mov r0, r1          ; r0 = r1
mov r1, r3          ; r1 = r3
subs r2, r2, #1     ; counter-- (updates CPSR Z flag)
bne loop            ; Repeat while Z == 0

done:
bx lr`,

  'arm_subroutine.s': `; ARM Subroutine (bl), Stack (push/pop) & Return (bx lr)
mov sp, #1024
push {lr}           ; Save main return address (0) on stack

mov r0, #6          ; Compute 6! (factorial = 720)
bl factorial        ; Call factorial(6)

print r0            ; Prints 720
pop {lr}            ; Restore return address
bx lr               ; Exit program

factorial:
mov r1, #1
fact_loop:
cmp r0, #1
ble fact_done
mul r1, r1, r0
sub r0, r0, #1
b fact_loop
fact_done:
mov r0, r1
bx lr`,

  'arm_data_memory.s': `; ARM .data Section & Bracket Addressing [rn, #offset]
.data
weights: .word 15, 25, 35, 45

.text
adr r4, weights     ; Load base address of 'weights' (100)
ldr r0, [r4]        ; r0 = 15
ldr r1, [r4, #4]    ; r1 = 25
ldr r2, [r4, #8]    ; r2 = 35
ldr r3, [r4, #12]   ; r3 = 45

add r0, r0, r1
add r0, r0, r2
add r0, r0, r3      ; r0 = 120
print r0            ; Prints 120
bx lr`
};

// Reactive status badge state managed via statebinderk
const statusBadgeState = new StateVar<{ text: string; isError: boolean }>(
  { text: 'Ready', isError: false },
  'statusBadge',
  (elem, state) => {
    elem.className = state.isError ? 'status-indicator status-error' : 'status-indicator';
    elem.innerHTML = `<span class="status-dot"></span> ${state.text}`;
  }
);

// Reactive memory tab state list (Instruction vs Data) managed via statebinderk
const memTabState = new StateVarList<boolean>(
  [
    { id: 'imemory', state: true },
    { id: 'dmemory', state: false },
  ],
  (elem, isActive) => {
    elem.classList.toggle('active', isActive);
  }
);

function getActiveSampleMap(): Record<string, string> {
  return Assembler.arch === 'arm' ? ARM_SAMPLE_PROGRAMS : RISCV_SAMPLE_PROGRAMS;
}

function updateRegHeaderForArch(): void {
  const titleEl = document.getElementById('regPanelTitle');
  const hintEl = document.getElementById('regPanelHint');
  if (Assembler.arch === 'arm') {
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-sliders"></i> CPSR Flags (NZCV) &amp; ARM Registers (r0 – r15)`;
    if (hintEl) hintEl.textContent = 'CPSR flags + 16 general-purpose registers (fp, ip, sp, lr, pc)';
  } else {
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-sliders"></i> Registers (x0 – x31)`;
    if (hintEl) hintEl.textContent = 'Scroll horizontally to inspect all 32 registers';
  }
}

function renderLocalExamples(activeFile?: string): void {
  if (GitUser.repo !== '' && GitUser.userName !== '') {
    codeTabPane.showHTML();
    return;
  }
  const codeTab = document.getElementById('codeTab');
  if (!codeTab) return;

  const sampleMap = getActiveSampleMap();
  const defaultFile = Object.keys(sampleMap)[0];
  const selectedFile = activeFile && activeFile in sampleMap ? activeFile : defaultFile;

  const itemsHTML = Object.keys(sampleMap)
    .map(name => {
      const activeClass = name === selectedFile ? ' active-file' : '';
      return `<div id="sample-${name}" class="code-tab-layer file-item${activeClass}"><i class="fa-regular fa-file-code"></i> ${name}</div>`;
    })
    .join('');

  const headerLabel = Assembler.arch === 'arm' ? 'ARM EXAMPLES' : 'RISC-V EXAMPLES';

  codeTab.innerHTML = `
    <div class="explorer-header">${headerLabel}</div>
    <div class="explorer-list">
      ${itemsHTML}
    </div>
    <div class="explorer-hint">
      <i class="fa-brands fa-github"></i>
      <span>Use the <b>Login</b> button in the left toolbar to load your own GitHub <code>.asm</code> / <code>.s</code> repository.</span>
    </div>
  `;

  Object.entries(sampleMap).forEach(([name, content]) => {
    const el = document.getElementById(`sample-${name}`);
    el?.addEventListener('click', () => {
      CodeEditor.changeCode(content);
      renderLocalExamples(name);
      consoleBox.log(`Loaded example "${name}"`, 'info');
    });
  });
}

function setStatus(text: string, isError = false): void {
  statusBadgeState.transition({ text, isError });
}

/**
 * Initializes the main function responsible for compiling and executing assembly code.
 */
function main(): void {
  CodeEditor.init(RISCV_SAMPLE_PROGRAMS['quickstart.asm']);
  consoleBox.init();
  Assembler.init();
  updateRegHeaderForArch();
  renderLocalExamples('quickstart.asm');
  memTabState.listTransition([true, false]);

  const archSelect = document.getElementById('archSelect') as HTMLSelectElement | null;
  archSelect?.addEventListener('change', () => {
    const chosen = (archSelect.value === 'arm' ? 'arm' : 'riscv') as Architecture;
    Assembler.setArch(chosen);
    Assembler.reset();
    CodeEditor.setActiveLine(null);
    updateRegHeaderForArch();

    const sampleMap = getActiveSampleMap();
    const firstFile = Object.keys(sampleMap)[0];
    CodeEditor.changeCode(sampleMap[firstFile]);
    renderLocalExamples(firstFile);
    consoleBox.clear();
    consoleBox.log(`Switched architecture to ${chosen === 'arm' ? 'ARM (AArch32)' : 'RISC-V (RV32IM)'}.`, 'info');
    setStatus('Ready');
  });

  const gitButton = document.getElementById("git");
  gitButton?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleLogin();
    if (GitUser.repo === '') {
      renderLocalExamples();
    }
  });

  document.getElementById('dmemory')?.addEventListener('click', () => {
    if (!Assembler.isDataMemActive) {
      Assembler.isDataMemActive = true;
      memTabState.listTransition([false, true]);
      Assembler.showData();
    }
  });

  document.getElementById('imemory')?.addEventListener('click', () => {
    if (Assembler.isDataMemActive) {
      Assembler.isDataMemActive = false;
      memTabState.listTransition([true, false]);
      Assembler.showInst();
    }
  });

  function getAddr(id: string): number {
    const addrArea = document.getElementById(id) as HTMLInputElement;
    let addr = parseInt(addrArea.value, 10);
    if (isNaN(addr)) {
      addr = 504;
      addrArea.value = '504';
    }
    return addr;
  }

  // Compile assembly code for active architecture
  function compile(): boolean {
    try {
      const startAddr = getAddr('buildAddr');
      Assembler.isStepping = false;
      Assembler.pc.jump(0);
      Assembler.syncPcUI();
      CodeEditor.setActiveLine(null);

      if (Assembler.arch === 'arm') {
        parseArm(CodeEditor.code, startAddr, Assembler.instMemory, Assembler.dataMemory);
      } else {
        parser(CodeEditor.code, startAddr, Assembler.instMemory, Assembler.dataMemory);
      }

      Assembler.refreshMemoryUI();
      const count = Assembler.instMemory.memory.size;
      const isaLabel = Assembler.arch === 'arm' ? 'ARM' : 'RISC-V';
      consoleBox.log(`${isaLabel} build succeeded (${count} instruction${count === 1 ? '' : 's'} at address ${startAddr}).`, 'info');
      setStatus('Build OK');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      consoleBox.log(`${msg}`, 'error');
      setStatus('Build Error', true);
      return false;
    }
  }

  function runProgram(): void {
    try {
      const runAddr = getAddr('runAddr');
      CodeEditor.setActiveLine(null);
      Assembler.execute(runAddr);
      setStatus('Executed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      consoleBox.log(`${msg}`, 'error');
      setStatus('Runtime Error', true);
    }
  }

  function stepProgram(): void {
    try {
      const runAddr = getAddr('runAddr');
      if (Assembler.instMemory.memory.size === 0) {
        if (!compile()) return;
      }
      const executedPc = Assembler.isStepping && Assembler.pc.val !== 0 ? Assembler.pc.val : runAddr;
      const executedInst = Assembler.instMemory.get(executedPc) as AssemblyInstruction | undefined;
      const lineInfo = executedInst?.sourceLine ? ` (line ${executedInst.sourceLine})` : '';

      const hasMore = Assembler.stepInstruction(runAddr);
      if (hasMore) {
        const nextInst = Assembler.instMemory.get(Assembler.pc.val) as AssemblyInstruction | undefined;
        CodeEditor.setActiveLine(nextInst?.sourceLine ?? executedInst?.sourceLine ?? null);
        setStatus(`Stepping @ ${executedPc}${lineInfo}`);
      } else {
        CodeEditor.setActiveLine(null);
        setStatus('Step Complete');
        consoleBox.log('Program execution completed.', 'info');
      }
    } catch (err) {
      CodeEditor.setActiveLine(null);
      const msg = err instanceof Error ? err.message : String(err);
      consoleBox.log(`${msg}`, 'error');
      setStatus('Runtime Error', true);
    }
  }

  // Attach event listeners to buttons for compiling and executing code
  const buildRun = document.getElementById("buildRun");
  const build = document.getElementById("build");
  const run = document.getElementById("run");
  const step = document.getElementById("step");
  const reset = document.getElementById("reset");
  const clearConsoleBtn = document.getElementById("clearConsole");

  buildRun?.addEventListener('click', () => {
    if (compile()) {
      runProgram();
    }
  });

  build?.addEventListener('click', () => {
    compile();
  });

  run?.addEventListener('click', () => {
    runProgram();
  });

  step?.addEventListener('click', () => {
    stepProgram();
  });

  reset?.addEventListener('click', () => {
    Assembler.reset();
    CodeEditor.setActiveLine(null);
    consoleBox.clear();
    consoleBox.log('Registers, memory, and console reset.', 'info');
    setStatus('Ready');
  });

  clearConsoleBtn?.addEventListener('click', () => {
    consoleBox.clear();
  });
}

// Call the main function when the DOM is ready
document.addEventListener("DOMContentLoaded", main);
