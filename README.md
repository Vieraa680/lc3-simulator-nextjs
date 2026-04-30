# LC-3 Simulator

Web-based LC-3-style simulator built with Next.js. The app lets you load hexadecimal instructions into memory from a chosen start address and execute the program cycle by cycle while inspecting registers and memory.

## What It Does

- Lets you edit the program manually in a textarea, one instruction per line.
- Supports uploading `.txt` files with valid hexadecimal content.
- Loads the program into a simulated memory space of `65,536` positions.
- Executes one instruction at a time through `Run Cycle`.
- Displays the state of registers `R0` through `R7`, plus `PC`, `N`, `Z`, and `P`.
- Displays the full memory space in a virtualized table.
- Lets you clear only `R0` through `R7` or reset the entire simulator state.
- Persists the dark mode preference in `localStorage`.

## How To Use

1. Enter the program in hexadecimal, one 16-bit instruction per line.
2. Optionally upload a `.txt` file in the same format.
3. Set a start address in `Start Address`.
4. Click `Load Program` to copy the instructions into memory and position the `PC`.
5. Run the program one step at a time with `Run Cycle`.
6. Inspect register and memory changes after each cycle.

## Supported Instructions

The simulator API currently implements these operations:

- `ADD`
- `AND`
- `NOT`
- `LD`
- `LDI`
- `LDR`
- `LEA`
- `ST`
- `STI`
- `STR`
- `BR`
- `JMP` / `RET`
- `JSR` / `JSRR`
- `MUL`
- `SUB`

## Current Limitations

- The simulator is not a complete implementation of the standard LC-3 ISA.
- `MUL` and `SUB` use custom opcodes in the API.
- There is no continuous execution mode or `HALT` instruction exposed in the UI; each click on `Run Cycle` executes a single CPU cycle.
- The program must already be assembled into hexadecimal; there is no assembler or mnemonic input support.
- Simulator state lives in memory inside the Next.js API route. If the server restarts, the state is lost.
- The `Start Address` field accepts hexadecimal-looking input in the UI, but the API parses it with `parseInt(..., 10)`. In the current implementation, decimal values are the safest option.

## Tech Stack

- Next.js 14
- React 18
- Material UI
- Sass Modules
- `react-virtualized` for the memory table

## Scripts

```bash
npm install
npm run dev
```

Development server: `http://localhost:8012`

```bash
npm run build
npm run start
```

Local production server: `http://localhost:3002`

## Main API

Simulation is handled by [`src/pages/api/simulator.js`](./src/pages/api/simulator.js):

- `POST /api/simulator`: loads the program into memory and sets the `PC`.
- `GET /api/simulator`: executes one CPU cycle and returns registers and memory.
- `DELETE /api/simulator?type=R0-R7`: clears only the general-purpose registers.
- `DELETE /api/simulator?type=all`: resets memory, registers, and the internal instruction counter.

## Relevant Structure

- [`src/pages/index.tsx`](./src/pages/index.tsx): main simulator interface.
- [`src/pages/api/simulator.js`](./src/pages/api/simulator.js): CPU and memory simulation logic.
- [`src/hooks/FileUpload/useFileUpload.tsx`](./src/hooks/FileUpload/useFileUpload.tsx): uploaded file reading and validation.
- [`public/css/Styles.module.scss`](./public/css/Styles.module.scss): main UI styles.

## Expected Program Format

Each line must contain one hexadecimal instruction. Example:

```text
1261
1442
56A0
```

Empty lines are ignored when the program is loaded.
