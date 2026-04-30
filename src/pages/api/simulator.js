let memory = new Array(65536).fill(0)
let registers = {
  R0: 0,
  R1: 0,
  R2: 0,
  R3: 0,
  R4: 0,
  R5: 0,
  R6: 0,
  R7: 0,
  PC: 0,
  N: 0,
  Z: 0,
  P: 0,
}
let instructionCount = 0

function resetSimulator() {
  memory.fill(0)
  registers = {
    R0: 0,
    R1: 0,
    R2: 0,
    R3: 0,
    R4: 0,
    R5: 0,
    R6: 0,
    R7: 0,
    PC: 0,
    N: 0,
    Z: 0,
    P: 0,
  }
  instructionCount = 0
}

function clearRegistersR0toR7() {
  registers.R0 = 0
  registers.R1 = 0
  registers.R2 = 0
  registers.R3 = 0
  registers.R4 = 0
  registers.R5 = 0
  registers.R6 = 0
  registers.R7 = 0
}

function setConditionFlags(value) {
  if (value === 0) {
    registers.N = 0
    registers.Z = 1
    registers.P = 0
  } else if (value < 0) {
    registers.N = 1
    registers.Z = 0
    registers.P = 0
  } else {
    registers.N = 0
    registers.Z = 0
    registers.P = 1
  }
}

function executeCycle() {

  const instruction = memory[registers.PC]
  registers.PC++

  // Decode
  const opcode = (instruction >> 12) & 0xf

  switch (opcode) {
    case 0b0001: // ADD
      const dr = (instruction >> 9) & 0x7
      const sr1 = (instruction >> 6) & 0x7
      const isImmediate = (instruction >> 5) & 0x1
      if (isImmediate) {
        const imm5 = ((instruction & 0x1f) << 27) >> 27 // Sign extension
        registers[`R${dr}`] = registers[`R${sr1}`] + imm5
      } else {
        const sr2 = instruction & 0x7
        registers[`R${dr}`] = registers[`R${sr1}`] + registers[`R${sr2}`]
      }
      setConditionFlags(registers[`R${dr}`])
      break

    case 0b0101: // AND
      const drAnd = (instruction >> 9) & 0x7
      const sr1And = (instruction >> 6) & 0x7
      const isImmediateAnd = (instruction >> 5) & 0x1
      if (isImmediateAnd) {
        const imm5And = ((instruction & 0x1f) << 27) >> 27 // Sign extension
        registers[`R${drAnd}`] = registers[`R${sr1And}`] & imm5And
      } else {
        const sr2And = instruction & 0x7
        registers[`R${drAnd}`] = registers[`R${sr1And}`] & registers[`R${sr2And}`]
      }
      setConditionFlags(registers[`R${drAnd}`])
      break

    case 0b1001: // NOT
      const drNot = (instruction >> 9) & 0x7
      const srNot = (instruction >> 6) & 0x7
      registers[`R${drNot}`] = ~registers[`R${srNot}`]
      setConditionFlags(registers[`R${drNot}`])
      break

    case 0b0010: // LD
      const drLd = (instruction >> 9) & 0x7
      const pcOffset = ((instruction & 0x1ff) << 23) >> 23 // Sign extension
      registers[`R${drLd}`] = memory[registers.PC + pcOffset]
      setConditionFlags(registers[`R${drLd}`])
      break

    case 0b1010: // LDI
      const drLdi = (instruction >> 9) & 0x7
      const pcOffsetLdi = ((instruction & 0x1ff) << 23) >> 23 // Sign extension
      const address = memory[registers.PC + pcOffsetLdi]
      registers[`R${drLdi}`] = memory[address]
      setConditionFlags(registers[`R${drLdi}`])
      break

    case 0b0110: // LDR
      const drLdr = (instruction >> 9) & 0x7
      const baseR = (instruction >> 6) & 0x7
      const offset = ((instruction & 0x3f) << 26) >> 26 // Sign extension
      registers[`R${drLdr}`] = memory[registers[`R${baseR}`] + offset]
      setConditionFlags(registers[`R${drLdr}`])
      break

    case 0b1110: // LEA
      const drLea = (instruction >> 9) & 0x7
      const pcOffsetLea = ((instruction & 0x1ff) << 23) >> 23 // Sign extension
      registers[`R${drLea}`] = registers.PC + pcOffsetLea
      setConditionFlags(registers[`R${drLea}`])
      break

    case 0b0011: // ST (Store)
      const srSt = (instruction >> 9) & 0x7
      const pcOffsetSt = ((instruction & 0x1ff) << 23) >> 23 // Sign extension
      memory[registers.PC + pcOffsetSt] = registers[`R${srSt}`]
      break

    case 0b1011: // STI (Store Indirect)
      const srSti = (instruction >> 9) & 0x7
      const pcOffsetSti = ((instruction & 0x1ff) << 23) >> 23 // Sign extension
      const addressSti = memory[registers.PC + pcOffsetSti]
      memory[addressSti] = registers[`R${srSti}`]
      break

    case 0b0111: // STR (Store Register)
      const srStr = (instruction >> 9) & 0x7
      const baseStr = (instruction >> 6) & 0x7
      const offsetStr = ((instruction & 0x3f) << 26) >> 26 // Sign extension
      memory[registers[`R${baseStr}`] + offsetStr] = registers[`R${srStr}`]
      break

    case 0b0000: // BR
      const n = (instruction >> 11) & 0x1
      const z = (instruction >> 10) & 0x1
      const p = (instruction >> 9) & 0x1
      const pcOffsetBr = ((instruction & 0x1ff) << 23) >> 23 // Sign extension
      if ((n && registers.N) || (z && registers.Z) || (p && registers.P)) {
        registers.PC += pcOffsetBr
      }
      break

    case 0b1100: // JMP, RET
      const baseJmp = (instruction >> 6) & 0x7
      registers.PC = registers[`R${baseJmp}`]
      break

    case 0b0100: // JSR, JSRR
      const isJsrr = (instruction >> 11) & 0x1
      registers.R7 = registers.PC
      if (isJsrr) {
        const baseJsrr = (instruction >> 6) & 0x7
        registers.PC = registers[`R${baseJsrr}`]
      } else {
        const pcOffsetJsr = ((instruction & 0x7ff) << 21) >> 21 // Sign extension
        registers.PC += pcOffsetJsr
      }
      break

    case 0b1101: // MUL
      const drMul = (instruction >> 9) & 0x7
      const sr1Mul = (instruction >> 6) & 0x7
      const isImmediateMul = (instruction >> 5) & 0x1
      if (isImmediateMul) {
        const imm5Mul = ((instruction & 0x1f) << 27) >> 27 // Sign extension
        registers[`R${drMul}`] = registers[`R${sr1Mul}`] * imm5Mul
      } else {
        const sr2Mul = instruction & 0x7
        registers[`R${drMul}`] = registers[`R${sr1Mul}`] * registers[`R${sr2Mul}`]
      }
      setConditionFlags(registers[`R${drMul}`])
      break

    case 0b1111: // SUB
      const drSub = (instruction >> 9) & 0x7
      const sr1Sub = (instruction >> 6) & 0x7
      const isImmediateSub = (instruction >> 5) & 0x1
      if (isImmediateSub) {
        const imm5Sub = ((instruction & 0x1f) << 27) >> 27 // Sign extension
        registers[`R${drSub}`] = registers[`R${sr1Sub}`] - imm5Sub
      } else {
        const sr2Sub = instruction & 0x7
        registers[`R${drSub}`] = registers[`R${sr1Sub}`] - registers[`R${sr2Sub}`]
      }
      setConditionFlags(registers[`R${drSub}`])
      break


    default:
      throw new Error('Unsupported instruction')
  }
  instructionCount++
}

export default function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { program, startAddress  } = req.body
      const start = parseInt(startAddress || 0, 10)

      if (isNaN(start) || start < 0 || start >= 65536) {
        return res.status(400).json({ message: 'Invalid start address' })
      }

      for (let i = 0; i < program.length; i++) {
        memory[start + i] = parseInt(program[i], 16)
      }
      registers.PC = start
      instructionCount = 0
      res.status(200).json({ message: 'Program loaded successfully' })
    } else if (req.method === 'GET') {
      executeCycle()
      res.status(200).json({ registers, memory, instructionCount })
    } else if (req.method === 'DELETE') {
      const { type } = req.query
      if (type === 'all') {
        resetSimulator()
        res.status(200).json({ message: 'Simulator state cleared successfully', registers: { ...registers }, memory: [...memory] })
      } else if (type === 'R0-R7') {
        clearRegistersR0toR7()
        res.status(200).json({ message: 'R0-R7 registers cleared successfully', registers: { ...registers } })
      } else {
        res.status(400).json({ message: 'Missing or invalid clear type' })
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
