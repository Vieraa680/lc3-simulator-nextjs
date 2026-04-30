const next = require('next')

const dev = process.env.NODE_ENV === 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const bb = async (req, res, next) => {
  try {
    await app.prepare()
    await handle(req, res)
  } catch (err) {
    next(err)
  }
}

module.exports = bb
