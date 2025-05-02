# AssemblyTS

**AssemblyTS** is an interactive **RISC-V (`RV32IM`, default) and ARM (`AArch32`, selectable)** Assembly language IDE and emulator implemented in TypeScript. It provides a complete browser-based environment for writing, assembling, stepping through, and executing RISC-V and ARM assembly code in real time.

## Live Playground

Try AssemblyTS directly in your browser at the **[AssemblyTS Playground](https://mk314k.github.io/AssemblyTS/)**.

## Key Features

- **Dual-ISA Support (`RISC-V` default + selectable `ARM`)**:
  - **RISC-V (`RV32IM`)**: 32 registers (`x0`–`x31` / `zero`–`t6`), base integer (`add`, `sub`, `and`, `or`, `xor`, `sll`, `srl`, `sra`, `slt`, `sltu`, `addi`..`srai`, `lui`, `auipc`), multiply/divide (`mul`, `mulh`, `mulhsu`, `mulhu`, `div`, `divu`, `rem`, `remu`), PC-relative branches (`beq`, `bne`, `blt`, `bge`, `bltu`, `bgeu`, `ble`, `bgt`), and jumps (`jal`, `jalr`, `j`, `ret`).
  - **ARM (`AArch32`)**: 16 general-purpose registers (`r0`–`r15` with `fp`, `ip`, `sp`, `lr`, `pc` aliases), live CPSR condition flags (`N`, `Z`, `C`, `V`), unified register/immediate data processing (`mov`, `mvn`, `add`/`adds`, `sub`/`subs`, `rsb`, `mul`, `sdiv`, `udiv`, `and`, `orr`, `eor`, `bic`, `lsl`, `lsr`, `asr`, `cmp`, `cmn`, `tst`), bracket memory addressing (`ldr r0, [r4, #4]`, `str`, `ldrb`, `strb`, `ldrh`, `strh`, `push`, `pop`), and conditional branches (`b`, `bl`, `bx lr`, `beq`, `bne`, `blt`, `bge`, `bgt`, `ble`).
  - **Assembler Directives**: `.data` and `.text` segments supporting `.word`, `.half`, `.byte`, `.asciz` / `.string`, `.space` / `.zero`, and `la` / `adr`.
- **Step-by-Step Debugger**: Step forward instruction-by-instruction with live Program Counter (`PC`) tracking, active instruction highlighting in memory, and active source line highlighting in the editor gutter.
- **Reactive Register & UI State**: Powered by [`statebinderk`](https://www.npmjs.com/package/statebinderk) for targeted DOM updates across all 32 registers (`x0`–`x31`), status indicators, and modals.
- **GitHub Integration**: Load `.asm` files from any public GitHub repository or authenticate via OAuth / Personal Access Token to commit and save files directly from the browser.

## Documentation

For detailed documentation on all supported instructions and directives, see [`docs/documentation.md`](docs/documentation.md).

## Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run automated unit tests
npm test

# Type-check and build production bundle
npm run build
```

## License

AssemblyTS is licensed under the [MIT License](LICENSE).

## Support

For bug reports or feature requests, please [open an issue](https://github.com/mk314k/AssemblyTS/issues) on GitHub.
