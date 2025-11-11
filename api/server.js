const os = require('os')
const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.resolve(__dirname, 'config.env') })
const express = require('express')
const userRoute = require('./routes/userRoute')
const productRoute = require('./routes/productRoute')
const couponRoute = require('./routes/couponRoute')
const categoryRoute = require('./routes/categoryRoute')
const subCategoryRoute = require('./routes/subCategoryRoute')
const orderRoute = require('./routes/orderRoute')
const exportRoutes = require('./routes/exportRoute')
const cors = require('cors')
const fs = require('fs')
// const helmet = require('helmet')
// const rateLimit = require('express-rate-limit')
// const xss = require('xss-clean')
// const hpp = require('hpp')

const logFile = path.join(__dirname, 'error.log')

const originalError = console.error

console.error = function (...args) {
  const message = args
    .map((a) => (typeof a === 'object' ? JSON.stringify(a) : a))
    .join(' ')

  const logMessage = `[${new Date().toISOString()}] ${message}\n`

  fs.appendFileSync(logFile, logMessage)

  originalError.apply(console, args)
}

const app = express()
app.disable('x-powered-by')
// app.use(helmet())
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100
// })
// app.use(limiter)
// app.use(xss())
// app.use(hpp())

const uploadDir = path.join(__dirname, '../media')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}
if (!fs.existsSync(path.join(uploadDir, 'reviews'))) {
  fs.mkdirSync(path.join(uploadDir, 'reviews'))
}
if (!fs.existsSync(path.join(uploadDir, 'slides'))) {
  fs.mkdirSync(path.join(uploadDir, 'slides'))
}
if (!fs.existsSync(path.join(uploadDir, 'products'))) {
  fs.mkdirSync(path.join(uploadDir, 'products'))
}
if (!fs.existsSync(path.join(uploadDir, 'categories'))) {
  fs.mkdirSync(path.join(uploadDir, 'categories'))
}
if (!fs.existsSync(path.join(uploadDir, 'subCategories'))) {
  fs.mkdirSync(path.join(uploadDir, 'subCategories'))
}

// app.use(
//   cors({
//     origin: [
//       `http${process.env.ISHTTPS ? 's' : ''}://newcapital-metals.ae`,
//       `http${process.env.ISHTTPS ? 's' : ''}://www.newcapital-metals.ae/`,
//     ],
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//   })
// )

app.use(express.json())
app.use('../media', express.static('media'))
app.use(express.urlencoded({ extended: true }))

app.use('/api/user', userRoute)
app.use('/api/category', categoryRoute)
app.use('/api/subCategory', subCategoryRoute)
app.use('/api/product', productRoute)
app.use('/api/order', orderRoute)
app.use('/api/coupon', couponRoute)
app.use('/api/exportDb', exportRoutes)
app.use('/health', (req, res) => {
  return res.status(200).json({ msg: 'hi! server is working' })
})

const port = process.env.PORT || 3000

const interfaces = os.networkInterfaces()
var address
for (const name in interfaces) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      address = iface.address
      break
    }
  }
}
app.listen(port, '127.0.0.1', () => {
  console.log(`server started at: http://${address}:${port}`)
})
