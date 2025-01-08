# AssemblyTS Instructions Documentation

## Registers

AssemblyTS utilizes 32-bit RISC-V integer registers (`RV32IM`) for data storage and manipulation:

| Register | Symbolic Name | Description          |
|----------|----------------|----------------------|
| x0       | zero           | Fixed zero           |
| x1       | ra             | Return address       |
| x2       | sp             | Stack pointer        |
| x3       | gp             | Global pointer       |
| x4       | tp             | Thread pointer       |
| x5-x7    | t0-t2          | Temporary registers  |
| x8-x9    | s0-s1          | Saved registers      |
| x10-x11  | a0-a1          | Function arguments and return values |
| x12-x17  | a2-a7          | Function arguments   |
| x18-x27  | s2-s11         | Saved registers      |
| x28-x31  | t3-t6          | Temporary registers  |

Both Register name (`x0`–`x31`) and its Symbolic ABI name (`zero`–`t6`) can be used interchangeably.

## Assembler Directives (`.data` & `.text`)

AssemblyTS supports `.data` and `.text` sections for pre-populating Data Memory at build time (starting at address `100`):

- **`.data`**: Switch to the data segment.
- **`.text`**: Switch to the code/instruction segment (default).
- **`.word w1, w2, ...`**: Store 32-bit 4-byte aligned words in Data Memory.
- **`.half h1, h2, ...`**: Store 16-bit 2-byte aligned halfwords in Data Memory.
- **`.byte b1, b2, ...`**: Store 8-bit bytes in Data Memory.
- **`.asciz "str"` / `.string "str"`**: Store a null-terminated ASCII string in Data Memory.
- **`.space N` / `.zero N`**: Reserve `N` zero-initialized bytes in Data Memory.

## Console Instructions

- **print**: Print the signed 32-bit decimal value of a register to the console.
  - **Syntax**: `print <register>`
- **printm**: Print the 32-bit word stored in data memory at the address held in `<register>`.
  - **Syntax**: `printm <register>`

## Register Operations (RV32I R-Type)

- **add**: Add `<rs1>` and `<rs2>` and store the result in `<rd>`.
  - **Syntax**: `add <rd>, <rs1>, <rs2>`
- **sub**: Subtract `<rs2>` from `<rs1>` and store the result in `<rd>`.
  - **Syntax**: `sub <rd>, <rs1>, <rs2>`
- **and**: Bitwise AND between `<rs1>` and `<rs2>`.
  - **Syntax**: `and <rd>, <rs1>, <rs2>`
- **or**: Bitwise OR between `<rs1>` and `<rs2>`.
  - **Syntax**: `or <rd>, <rs1>, <rs2>`
- **xor**: Perform a bitwise XOR operation between two registers.
  - **Syntax**: `xor <rd>, <rs1>, <rs2>`
- **sll**: Perform a logical left shift on `<rs1>` by `<rs2>[4:0]`.
  - **Syntax**: `sll <rd>, <rs1>, <rs2>`
- **srl**: Perform a logical right shift on `<rs1>` by `<rs2>[4:0]`.
  - **Syntax**: `srl <rd>, <rs1>, <rs2>`
- **sra**: Perform an arithmetic right shift on `<rs1>` by `<rs2>[4:0]`.
  - **Syntax**: `sra <rd>, <rs1>, <rs2>`
- **slt**: Set `<rd>` to `1` if `<rs1> < <rs2>` (signed); otherwise `0`.
  - **Syntax**: `slt <rd>, <rs1>, <rs2>`
- **sltu**: Set `<rd>` to `1` if `<rs1> < <rs2>` (unsigned); otherwise `0`.
  - **Syntax**: `sltu <rd>, <rs1>, <rs2>`

## Register Immediate Operations (I-Type)

- **addi**: Add a 12-bit signed immediate value to `<rs1>` and store the result in `<rd>`.
  - **Syntax**: `addi <rd>, <rs1>, <imm>`
- **andi**: Perform a bitwise AND between `<rs1>` and `<imm>`.
  - **Syntax**: `andi <rd>, <rs1>, <imm>`
- **ori**: Perform a bitwise OR between `<rs1>` and `<imm>`.
  - **Syntax**: `ori <rd>, <rs1>, <imm>`
- **xori**: Perform a bitwise XOR between `<rs1>` and `<imm>`.
  - **Syntax**: `xori <rd>, <rs1>, <imm>`
- **slti**: Set `<rd>` to `1` if `<rs1> < <imm>` (signed); otherwise `0`.
  - **Syntax**: `slti <rd>, <rs1>, <imm>`
- **sltiu**: Set `<rd>` to `1` if `<rs1> < <imm>` (unsigned); otherwise `0`.
  - **Syntax**: `sltiu <rd>, <rs1>, <imm>`
- **slli**: Logical left shift `<rs1>` by immediate `<shamt>`.
  - **Syntax**: `slli <rd>, <rs1>, <shamt>`
- **srli**: Logical right shift `<rs1>` by immediate `<shamt>`.
  - **Syntax**: `srli <rd>, <rs1>, <shamt>`
- **srai**: Arithmetic right shift `<rs1>` by immediate `<shamt>`.
  - **Syntax**: `srai <rd>, <rs1>, <shamt>`

## Branch Instructions (B-Type & Pseudo-Branches)

Branch targets can be either a **label** (resolved automatically to a PC-relative byte offset `label_addr - PC`) or a numeric **PC-relative byte offset**.

- **beq**: Branch if `<rs1> == <rs2>`.
  - **Syntax**: `beq <rs1>, <rs2>, <label_or_offset>`
- **bne**: Branch if `<rs1> != <rs2>`.
  - **Syntax**: `bne <rs1>, <rs2>, <label_or_offset>`
- **blt**: Branch if `<rs1> < <rs2>` (signed).
  - **Syntax**: `blt <rs1>, <rs2>, <label_or_offset>`
- **bge**: Branch if `<rs1> >= <rs2>` (signed).
  - **Syntax**: `bge <rs1>, <rs2>, <label_or_offset>`
- **bgt**: Branch if `<rs1> > <rs2>` (signed pseudo-instruction, encoded as `blt <rs2>, <rs1>, <offset>`).
  - **Syntax**: `bgt <rs1>, <rs2>, <label_or_offset>`
- **ble**: Branch if `<rs1> <= <rs2>` (signed pseudo-instruction, encoded as `bge <rs2>, <rs1>, <offset>`).
  - **Syntax**: `ble <rs1>, <rs2>, <label_or_offset>`
- **bltu**: Branch if `<rs1> < <rs2>` (unsigned).
  - **Syntax**: `bltu <rs1>, <rs2>, <label_or_offset>`
- **bgeu**: Branch if `<rs1> >= <rs2>` (unsigned).
  - **Syntax**: `bgeu <rs1>, <rs2>, <label_or_offset>`

## Memory Operations

- **lw**: Load a 32-bit word from data memory at `<rs1> + <offset>` into `<rd>`.
  - **Syntax**: `lw <rd>, <offset>(<rs1>)`
- **sw**: Store a 32-bit word from `<rs2>` into data memory at `<rs1> + <offset>`.
  - **Syntax**: `sw <rs2>, <offset>(<rs1>)`

## Upper Immediate & Pseudo-Instructions

- **li**: Load an immediate value into `<rd>`.
  - **Syntax**: `li <rd>, <imm>`
- **lui**: Load a 20-bit immediate value into the upper 20 bits of `<rd>` (`<imm> << 12`).
  - **Syntax**: `lui <rd>, <imm>`
- **auipc**: Add upper 20-bit immediate to PC (`<rd> = PC + (<imm> << 12)`).
  - **Syntax**: `auipc <rd>, <imm>`
- **mv**: Copy value from `<rs1>` to `<rd>` (`addi <rd>, <rs1>, 0`).
  - **Syntax**: `mv <rd>, <rs1>`
- **nop**: No operation (`addi x0, x0, 0`).
  - **Syntax**: `nop`

## Jump Operations

- **jal**: Jump and Link (`<rd> = PC + 4; PC = PC + <offset>`). If `<rd>` is omitted, defaults to `ra` (`x1`).
  - **Syntax**: `jal <rd>, <label_or_offset>` or `jal <label_or_offset>`
- **jalr**: Jump and Link Register (`<rd> = PC + 4; PC = (<rs1> + <offset>) & ~1`).
  - **Syntax**: `jalr <rd>, <rs1>, <offset>` or `jalr <rd>, <offset>(<rs1>)` or `jalr <rs1>`
- **j**: Unconditional jump pseudo-instruction (`jal x0, <label_or_offset>`).
  - **Syntax**: `j <label_or_offset>`
- **ret**: Return from subroutine (`jalr x0, ra, 0`).
  - **Syntax**: `ret`
