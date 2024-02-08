# AssemblyTS Instructions Documentation

## Registers

AssemblyTS utilizes registers for data storage and manipulation. The following registers are available:

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

Both Register name and its Symbolic name can be used interchangeably.

## Console Instructions

- **print**: Print the value of a register to the console.
  - **Syntax**: `print <register>`
- **printm**: Print the value stored in memory to the console. The value in the register serve as memory address.
  - **Syntax**: `printm <register>`

## Register Operations

- **add**: Add the values of two registers and store the result in a destination register.
  - **Syntax**: `add <destination_register>, <source_register1>, <source_register2>`
- **sub**: Subtract the value of one register from another and store the result in a destination register.
  - **Syntax**: `sub <destination_register>, <source_register1>, <source_register2>`
- **and**: Perform a bitwise AND operation between two registers and store the result in a destination register.
  - **Syntax**: `and <destination_register>, <source_register1>, <source_register2>`
- **or**: Perform a bitwise OR operation between two registers and store the result in a destination register.
  - **Syntax**: `or <destination_register>, <source_register1>, <source_register2>`
- **xor**: Perform a bitwise XOR operation between two registers and store the result in a destination register.
  - **Syntax**: `xor <destination_register>, <source_register1>, <source_register2>`
- **sll**: Perform a logical left shift operation on a register and store the result in a destination register.
  - **Syntax**: `sll <destination_register>, <source_register>, <shift_amount>`
- **srl**: Perform a logical right shift operation on a register and store the result in a destination register.
  - **Syntax**: `srl <destination_register>, <source_register>, <shift_amount>`
- **sra**: Perform an arithmetic right shift operation on a register and store the result in a destination register.
  - **Syntax**: `sra <destination_register>, <source_register>, <shift_amount>`

## Register Immediate Operations

- **addi**: Add an immediate value to a register and store the result in a destination register.
  - **Syntax**: `addi <destination_register>, <source_register>, <immediate_value>`
- **andi**: Perform a bitwise AND operation between an immediate value and a register and store the result in a destination register.
  - **Syntax**: `andi <destination_register>, <source_register>, <immediate_value>`
- **ori**: Perform a bitwise OR operation between an immediate value and a register and store the result in a destination register.
  - **Syntax**: `ori <destination_register>, <source_register>, <immediate_value>`
- **xori**: Perform a bitwise XOR operation between an immediate value and a register and store the result in a destination register.
  - **Syntax**: `xori <destination_register>, <source_register>, <immediate_value>`
- **slti**: Set a register to 1 if it is less than an immediate value; otherwise, set it to 0.
  - **Syntax**: `slti <destination_register>, <source_register>, <immediate_value>`
- **sltiu**: Set a register to 1 if it is less than an unsigned immediate value; otherwise, set it to 0.
  - **Syntax**: `sltiu <destination_register>, <source_register>, <immediate_value>`
- **slli**: Perform a logical left shift operation on a register by an immediate value and store the result in a destination register.
  - **Syntax**: `slli <destination_register>, <source_register>, <shift_amount>`
- **srli**: Perform a logical right shift operation on a register by an immediate value and store the result in a destination register.
  - **Syntax**: `srli <destination_register>, <source_register>, <shift_amount>`
- **srai**: Perform an arithmetic right shift operation on a register by an immediate value and store the result in a destination register.
  - **Syntax**: `srai <destination_register>, <source_register>, <shift_amount>`

## Branch Instructions

- **beq**: Branch if two registers are equal.
  - **Syntax**: `beq <register1>, <register2>, <offset>`
- **bne**: Branch if two registers are not equal.
  - **Syntax**: `bne <register1>, <register2>, <offset>`
- **blt**: Branch if one register is less than another.
  - **Syntax**: `blt <register1>, <register2>, <offset>`
- **bge**: Branch if one register is greater than or equal to another.
  - **Syntax**: `bge <register1>, <register2>, <offset>`
- **bgt**: Branch if one register is greater than another.
  - **Syntax**: `bgt <register1>, <register2>, <offset>`
- **ble**: Branch if one register is less than or equal to another.
  - **Syntax**: `ble <register1>, <register2>, <offset>`
- **bltu**: Branch if one register is less than another (unsigned).
  - **Syntax**: `bltu <register1>, <register2>, <offset>`
- **bgeu**: Branch if one register is greater than or equal to another (unsigned).
  - **Syntax**: `bgeu <register1>, <register2>, <offset>`

## Memory Operations

- **lw**: Load a word from memory into a register.
  - **Syntax**: `lw <destination_register>, <offset>(<memory_address>)`
- **sw**: Store a word from a register into memory.
  - **Syntax**: `sw <source_register>, <offset>(<memory_address>)`

## Register Loading Operations

- **li**: Load an immediate value into a register.
  - **Syntax**: `li <register>, <immediate_value>`
- **lui**: Load a 20-bit immediate value into the upper 20 bits of a register.
  - **Syntax**: `lui <register>, <immediate_value>`

## Jump Operations

- **ret**: Return from a subroutine.
  - **Syntax**: `ret`
