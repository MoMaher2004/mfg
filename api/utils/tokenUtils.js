const crypto = require('crypto')
const bcrypt = require('bcrypt')

const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex')
}

const hashToken = async token => {
  const saltRounds = 10
  return await bcrypt.hash(token, saltRounds)
}

const compareToken = async (plainToken, hashedToken) => {
  return await bcrypt.compare(plainToken, hashedToken)
}

module.exports = { generateToken, hashToken, compareToken }