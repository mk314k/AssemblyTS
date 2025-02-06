# AssemblyTS

**AssemblyTS** is an interactive **RISC-V (`RV32IM`)** Assembly language IDE and emulator implemented in TypeScript. It provides a complete browser-based environment for writing, assembling, stepping through, and executing RISC-V assembly code in real time.

## Live Playground

Try AssemblyTS directly in your browser at the **[AssemblyTS Playground](https://mk314k.github.io/AssemblyTS/)**.

## Key Features

- **RISC-V `RV32IM` Instruction Set**:
  - **Base Integer (`RV32I`)**: `add`, `sub`, `and`, `or`, `xor`, `sll`, `srl`, `sra`, `slt`, `sltu`, `addi`, `andi`, `ori`, `xori`, `slti`, `sltiu`, `slli`, `srli`, `srai`, `lui`, `auipc`.
  - **Multiply & Divide (`RV32M`)**: `mul`, `mulh`, `mulhsu`, `mulhu`, `div`, `divu`, `rem`, `remu`.
  - **Branches & Jumps**: PC-relative branches (`beq`, `bne`, `blt`, `bge`, `bltu`, `bgeu`, `ble`, `bgt`) and jumps (`jal`, `jalr`, `j`, `ret`).
  - **Byte-Addressable Memory**: Little-endian byte (`lb`, `lbu`, `sb`), halfword (`lh`, `lhu`, `sh`), and 32-bit word (`lw`, `sw`) operations.
  - **Assembler Directives**: `.data` and `.text` segments supporting `.word`, `.half`, `.byte`, `.asciz` / `.string`, `.space` / `.zero`, and the `la` pseudo-instruction.
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

<!-- ## Contributing

We welcome contributions from the community! Whether you're interested in adding new features, fixing bugs, or improving documentation, your contributions are highly appreciated. Please see our [Contribution Guidelines](CONTRIBUTING.md) for more information on how to get started. -->

## License

AssemblyTS is licensed under the [MIT License](LICENSE), allowing for free use, modification, and distribution of the software. See the LICENSE file for details.

## Support

For support, bug reports, or feature requests, please [open an issue](https://github.com/mk314k/AssemblyTS/issues) on GitHub.
