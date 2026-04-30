import React from 'react'

export const useFileUpload = (onFileRead, acceptedFileTypes = ['.txt'], validateContent) => {
  const [error, seterror] = React.useState<string>(null)

  const [fileContent, setfileContent] = React.useState<string>('')

  const [fileName, setfileName] = React.useState<string | null>('')

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const fileExtension = file.name.split('.').pop()
      if (!acceptedFileTypes.includes(`.${fileExtension}`)) {
        seterror('File type not supported')

        return
      }

      setfileName(file.name)

      seterror(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result as string

        if (validateContent && !validateContent(content)) {
          seterror('File content is not valid')
          return
        }

        setfileContent(content)
        if (typeof onFileRead === 'function') {
          onFileRead(content)
        } else {
          console.error('onFileRead is not a valid function')
        }
      }
      reader.readAsText(file)
    }
  }

  return {
    fileName,
    fileContent,
    error,
    handleFileChange,
  }
}
