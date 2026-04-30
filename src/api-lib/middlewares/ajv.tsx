import Ajv from 'ajv'
import addFormats from 'ajv-formats'

export function validateBody(schema) {
  const ajv = new Ajv()
  addFormats(ajv)
  const validate = ajv.compile(schema)
  return (req, res, next) => {
    // TODO: Fix this
    const valid = validate(req.body)
    if (valid) {
      return next()
    } else {
      const error = validate.errors[0]
      return res.status(400).json({
        error: {
          message: `"${error.instancePath.substring(1)}" ${error.message}`,
        },
      })
    }
  }
}
