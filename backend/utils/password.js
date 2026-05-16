const bcrypt = require('bcryptjs')

const BCRYPT_ROUNDS = 10

function isHashed(password) {
  return typeof password === 'string' && password.startsWith('$2')
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

async function verifyPassword(plain, stored) {
  if (!stored) return false
  if (isHashed(stored)) {
    return bcrypt.compare(plain, stored)
  }
  return plain === stored
}

module.exports = { hashPassword, verifyPassword, isHashed, BCRYPT_ROUNDS }
