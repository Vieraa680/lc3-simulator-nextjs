import { Icon } from '@iconify/react'
import { fetcher } from '@lib/fetch'
import Button from '@mui/material/Button'
import { Box, Paper, TextField } from '@mui/material'
import Switch from '@mui/material/Switch'
import TextareaAutosize from '@mui/material/TextareaAutosize'
import Typography from '@mui/material/Typography'
import { useRouter } from 'next/router'
import Stylesmodulescss from 'public/css/Styles.module.scss'
import React, { FunctionComponent, useRef } from 'react'
import { useFileUpload } from '../hooks/FileUpload/useFileUpload'
import { AutoSizer, Column, Table } from 'react-virtualized'
import 'react-virtualized/styles.css'

const Dashboard: FunctionComponent = (props: any) => {
  const router = useRouter()
  const { history: navigation, match: { params = {} } = {} } = props
  const theme = { ...Stylesmodulescss }
  const classes = { ...Stylesmodulescss }
  const textareaRef = useRef(null)
  const lineNumbersRef = useRef(null)
  const [lines, setlines] = React.useState<any>(10)
  const [darkMode, setdarkMode] = React.useState<any>(false)
  const [instructionCount, setinstructionCount] = React.useState<any>(0)
  const [registers, setregisters] = React.useState<any>({
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
  })
  const [memory, setmemory] = React.useState<any>(new Array(65536).fill(0))
  const [program, setprogram] = React.useState<any>('')
  const [simulatorOutput, setsimulatorOutput] = React.useState<any>(null)
  const [startAddress, setStartAddress] = React.useState(0)

  const handleStartAddressChange = (e) => {
    const value = e.target.value
    if (/^[0-9A-Fa-f]{0,5}$/.test(value)) {
      setStartAddress(value)
    }
  }

  const handleProgramChange = (event) => {
    const text = event.target.value
    const filteredText = text
      .split('\n')
      .map((line) => line.replace(/[^0-9A-Fa-f\s]/g, '').substring(0, 4))
      .join('\n')
    const lineCount = Math.max(10, text.split('\n').length)
    setprogram(filteredText)

    setlines(lineCount)
  }

  const loadProgram = async () => {
    try {
      const instructions = program.split('\n').filter((line) => line.trim() !== '')
      setinstructionCount(instructions.length)

      await fetcher('/api/simulator', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: instructions,
          startAddress: startAddress || 0,
        }),
      }).catch((error) => {
        console.error(error)
      })
    } catch (e) {
      console.log('Error loading program:', e)
    }
  }

  const updateMemory = (simulatorOutput) => {
    if (simulatorOutput && simulatorOutput.memory) {
      setmemory(simulatorOutput.memory)
    }
  }

  const runCycle = async () => {
    try {
      const response = await fetch('/api/simulator')
      const output = await response.json()
      updateRegisters(output)
      updateMemory(output)
      setsimulatorOutput(output)
    } catch (e) {
      console.log('Error running cycle:', e)
    }
  }

  const clearR0toR7 = async () => {
    try {
      const data = await fetcher('/api/simulator?type=R0-R7', { method: 'delete' }).catch((error) => {
        console.error(error)
      })

      if (data?.registers) {
        setregisters(data.registers)
      }
    } catch (e) {
      console.log('Error clearing R0-R7 registers:', e)
    }
  }

  const clearAllRegisters = async () => {
    try {
      const data = await fetcher('/api/simulator?type=all', { method: 'delete' }).catch((error) => {
        console.error(error)
      })

      setsimulatorOutput(null)

      setinstructionCount(null)

      setprogram('')

      if (data?.registers) {
        setregisters(data.registers)
        updateMemory(data)
      }
    } catch (e) {
      console.log('Error clearing all registers:', e)
    }
  }

  const updateRegisters = (simulatorOutput) => {
    if (simulatorOutput && simulatorOutput.registers) {
      setregisters(simulatorOutput.registers)
    }
  }

  const isValidHexFile = (content) => {
    const lines = content.split('\n')
    return lines.every((line) => /^[0-9A-Fa-f\s]*$/.test(line.trim()))
  }

  const { fileName, error, handleFileChange } = useFileUpload(
    (content) => {
      setprogram(content)
    },
    ['.txt'],
    isValidHexFile
  )

  const syncHeights = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      const lineNumbersHeight = lineNumbersRef.current.scrollHeight
      textareaRef.current.style.height = `${lineNumbersHeight}px`
    }
  }

  const handleScroll = (event) => {
    const scrollTop = event.target.scrollTop
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop
    }
  }

  React.useEffect(() => {
    syncHeights()
  }, [lines])

  React.useEffect(() => {
    setlines(10)

    syncHeights()
  }, [])

  const colsPerPage = 4

  const getChunk = (rowIndex) => {
    const start = rowIndex * colsPerPage
    return memory.slice(start, start + colsPerPage)
  }

  const rowGetter = ({ index }) => {
    const chunk = getChunk(index)
    return {
      address: index * colsPerPage,
      ...chunk.reduce((acc, value, i) => {
        acc[`col${i + 1}`] = value
        return acc
      }, {}),
    }
  }

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode')
      if (savedDarkMode) {
        setdarkMode(JSON.parse(savedDarkMode))
      }
    }
  }, [])

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }
  }, [darkMode])

  return (
    <React.Fragment>
      <div className={darkMode ? theme.darkBody : theme.body}>
        <div title="div navbar" data-title="div navbar" className={darkMode ? theme.darkNavbar : theme.navbar}>
          <div title="div title" data-title="div title" className={theme.title}>
            <Typography variant="h1">
              <span>LC-3</span> SIMULATOR
            </Typography>
          </div>

          <div title="div uploadFile" data-title="div uploadFile" className={theme.uploadFile}>
            <div title="div" data-title="div">
              <input accept=".txt" type="file" style={{ display: 'none' }} id="file-upload" onChange={handleFileChange} />
              <label htmlFor="file-upload">
                <Button variant="contained" color="primary" component="span">
                  <Icon icon="ci:file-add" style={{ fontSize: '32' }} />
                  Upload
                </Button>
              </label>
              {error && <Typography variant="body1">{error}</Typography>}
            </div>
          </div>

          <div title="div switch" data-title="div switch" className={theme.switches}>

            <div title="div theme switch" data-title="div theme switch" style={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1">{darkMode ? 'Dark Mode On' : 'Clear Mode On'}</Typography>

              <Switch
                checked={darkMode}
                onChange={(e) => {
                  setdarkMode((prev) => !prev)
                }}
                className={theme.batata}
                icon={<Icon icon="mdi:weather-sunny" />}
                checkedIcon={<Icon icon="mdi:moon-waning-crescent" />}
                size={'medium'}
              />
            </div>
          </div>
        </div>

        <div title="div skibidiContainer" data-title="div skibidiContainer" className={theme.skibidiContainer}>
          <div title="div leftColumn" data-title="div leftColumn" className={theme.leftColumn}>
            <Typography variant="h5" className={darkMode ? theme.whieText : theme.darkText}>Editor</Typography>

            <div title="div textArea Container" data-title="div textArea Container" className={theme.textarea_container}>
              <div title="div line Numbers" data-title="div line Numbers" className={darkMode ? theme.darkLine_number : theme.line_numbers} ref={lineNumbersRef}>
                {Array.from({ length: lines }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              <TextareaAutosize
                minRows="10"
                maxRows={15}
                placeholder="Enter hexadecimal code, one instruction per line"
                value={program}
                className={darkMode ? theme.darkTextArea : theme.textArea}
                onChange={handleProgramChange}
                ref={textareaRef}
                onScroll={handleScroll}
              />
            </div>

            <div title="div buttons" data-title="div buttons" className={theme.buttons} style={{ marginBottom: '20px' }}>
              {instructionCount > 0 && <Typography variant="body1">Instruction Count: {instructionCount}</Typography>}

              <Button color="primary" onClickCapture={loadProgram}>
                Load Program
              </Button>

              <Button color="primary" onClickCapture={runCycle}>
                Run Cycle
              </Button>

              <Button color="primary" onClickCapture={clearAllRegisters}>
                Clear State
              </Button>

              <TextField
                label="Start Address"
                value={startAddress}
                onChange={handleStartAddressChange}
                placeholder="0000"
                inputProps={{ maxLength: 5 }}
                variant="outlined"
                size="medium"
                sx={{
                  backgroundColor: darkMode ? "#252526" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                }}
              />
            </div>

            <div title="div textArea Container" data-title="div textArea Container" className={theme.memory_container}>
              <Box sx={{ p: 3, backgroundColor: darkMode ? "#313131" : "#f0f0f0" }}>
                <Typography variant="h5" gutterBottom className={darkMode ? theme.whieText : theme.darkText}>
                  Memory Viewer
                </Typography>
                <Paper sx={{ height: "400px", borderRadius: "8px", overflow: "hidden", backgroundColor: darkMode ? "#252526" : '' }}>
                  <AutoSizer title="mandioca">
                    {({ height, width }) => (
                      <Table
                        className={darkMode ? theme.darkCustom_table : theme.custom_table}
                        width={width}
                        height={height}
                        headerHeight={50}
                        rowHeight={40}
                        rowCount={Math.ceil(65536 / colsPerPage)}
                        rowGetter={rowGetter}
                      >
                        <Column
                          label="Address"
                          dataKey="address"
                          width={width * 0.25}
                          headerClassName={theme.header_column}
                          className={theme.data_column}
                        />
                        {Array.from({ length: colsPerPage }, (_, i) => (
                          <Column
                            key={`col${i + 1}`}
                            label={`Col ${i + 1}`}
                            dataKey={`col${i + 1}`}
                            width={width * 0.75 / colsPerPage}
                            headerClassName={theme.header_column}
                            className={theme.data_column}
                          />
                        ))}
                      </Table>
                    )}
                  </AutoSizer>
                </Paper>
              </Box>
            </div>
          </div>

          <div title="div Right Column" data-title="div Right Column" className={theme.rightColumn}>
            <Typography variant="h5" className={darkMode ? theme.whieText : theme.darkText}>Registers</Typography>

            <div title="div registersTable" data-title="div registersTable" className={theme.registersTable}>
              {Object.entries(registers).map(([key, value], index) => {
                return (
                  <div
                    key={key}
                    title="div"
                    data-title="div"
                    className={`${theme.registerRow} ${index % 2 === 0 ? darkMode ? theme.darkevenRow : theme.evenRow : darkMode ? theme.darkoddRow : theme.oddRow}`}
                  >
                    <Typography variant="h6" className={darkMode ? theme.whieText : theme.darkText}>
                      <strong>{key}</strong>
                    </Typography>

                    <Typography variant="body1" className={darkMode ? theme.whieText : theme.darkText}>0x{value?.toString(16).toUpperCase().padStart(4, '0')}</Typography>
                  </div>
                )
              })}
            </div>

            <div title="div registersButtons" data-title="div registersButtons" className={theme.registersButtons}>
              <Button variant="outlined" color="primary" onClickCapture={clearR0toR7}>
                Clear R0–R7
              </Button>

              <Button color="secondary" onClickCapture={clearAllRegisters}>
                Reset all registers
              </Button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment >
  )
}

export default Dashboard
