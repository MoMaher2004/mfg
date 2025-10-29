const conn = require('../config/db')
const {
  compareToken,
  generateToken,
  hashToken,
} = require('../utils/tokenUtils')
const bcrypt = require('bcrypt')

const login = async (email, password) => {
  try {
    const { rows } = await conn.query(
      'SELECT * FROM users WHERE email = $1 AND is_deleted = false',
      [email]
    )

    if (rows.length === 0) {
      return null
    }
    const passwordComparisonRes = await bcrypt.compare(
      password,
      rows[0].password
    )
    if (!passwordComparisonRes) {
      return null
    }
    const user = {
      ...rows[0],
      password: undefined,
      password_reset_token_expires_at: undefined,
      password_reset_token: undefined,
      password_last_updated_at: undefined,
      is_deleted: undefined,
      emailConfirmationToken: undefined,
    }
    return user
  } catch (error) {
    console.error('Error during login:', error)
    throw new Error('Something went wrong')
  }
}

const checkPasswordToken = async (email, password_reset_token) => {
  try {
    const { rows } = await conn.query(
      'SELECT * FROM users WHERE email = $1 AND is_deleted = false AND password_reset_token_expires_at > NOW()',
      [email]
    )

    if (rows.length === 0) {
      return { error: 'Token is not valid or expired, Try again' }
    }
    const passwordTokenComparisonRes = await bcrypt.compare(
      password_reset_token,
      rows[0].password_reset_token
    )
    if (!passwordTokenComparisonRes) {
      return { error: 'Token is not valid or expired, Try again' }
    }

    await conn.query(
      'UPDATE users SET password_reset_token_expires_at = NULL, password_reset_token = NULL WHERE id = $1',
      [rows[0].id]
    )

    const user = {
      ...rows[0],
      password: undefined,
      password_reset_token_expires_at: undefined,
      password_reset_token: undefined,
      password_last_updated_at: undefined,
      is_deleted: undefined,
      emailConfirmationToken: undefined,
    }
    return user
  } catch (error) {
    console.error('Error during checkPasswordToken:', error)
    throw new Error('Something went wrong')
  }
}

const changePassword = async (
  email,
  oldPassword,
  newPassword,
  authType = 'password'
) => {
  try {
    if (authType !== 'email') {
      const loginRes = await login(email, oldPassword)
      if (!loginRes) {
        return { error: 'Old password is incorrect' }
      }
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const { rowCount } = await conn.query(
      'UPDATE users SET password = $1, password_last_updated_at = NOW() WHERE email = $2 AND is_deleted = false',
      [hashedPassword, email]
    )
    if (rowCount === 0) {
      throw new Error('Failed to change password')
    }
    return { success: 'Password changed successfully' }
  } catch (error) {
    console.error('Error during changing password:', error)
    throw new Error('Something went wrong')
  }
}

const checkUserAuth = async (id) => {
  try {
    const { rows } = await conn.query(
      'SELECT password_last_updated_at, is_deleted, email, is_admin, name FROM users WHERE id = $1',
      [id]
    )
    return rows[0] || null
  } catch (error) {
    console.error('Error during checking password change:', error)
    throw new Error('Something went wrong')
  }
}

const getUserById = async (id) => {
  try {
    const { rows } = await conn.query('SELECT * FROM users WHERE id = $1', [id])
    if (rows.length === 0) {
      return null
    }
    const user = {
      ...rows[0],
      password: undefined,
      password_reset_token: undefined,
      emailConfirmationToken: undefined,
    }
    return user
  } catch (error) {
    console.error('Error during getting user by id:', error)
    throw new Error('Something went wrong')
  }
}

const getUserByEmail = async (email) => {
  try {
    const { rows } = await conn.query('SELECT * FROM users WHERE email = $1', [
      email,
    ])
    if (rows.length === 0) {
      return null
    }
    const user = {
      ...rows[0],
      password: undefined,
      password_reset_token: undefined,
      emailConfirmationToken: undefined,
    }
    return user
  } catch (error) {
    console.error('Error getUserByEmail:', error)
    throw new Error('Something went wrong')
  }
}

const deactivateUser = async (id) => {
  try {
    const { rowCount } = await conn.query(
      'UPDATE users SET is_deleted = true WHERE id = $1',
      [id]
    )
    if (rowCount === 0) {
      throw new Error('Failed to deactivate user')
    }
    return { success: 'User deactivated successfully' }
  } catch (error) {
    console.error('Error during deactivating user:', error)
    throw new Error('Something went wrong')
  }
}

const updateResetPasswordToken = async (email) => {
  try {
    const resetPasswordToken = generateToken()
    const hashedResetPasswordToken = await hashToken(resetPasswordToken)
    const { rowCount } = await conn.query(
      "UPDATE users SET password_reset_token = $1, password_reset_token_expires_at = NOW() + INTERVAL '30 minutes' WHERE email = $2 AND is_deleted = false",
      [hashedResetPasswordToken, email]
    )
    if (rowCount === 0) {
      throw new Error('Failed to update Reset Password Token')
    }
    return {
      success: 'Password reset token updated successfully',
      resetPasswordToken,
    }
  } catch (error) {
    console.error('Error during updateResetPasswordToken:', error)
    throw new Error('Something went wrong')
  }
}

const addUser = async (name, email, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    const { rows } = await conn.query(
      'SELECT * FROM users WHERE email = $1 AND is_deleted = false',
      [email]
    )
    if (rows.length > 0) {
      return { error: 'Email already exists' }
    }
    const { rows: inserted } = await conn.query(
      'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, false) RETURNING id',
      [name, email, hashedPassword]
    )
    return {
      success: 'User added successfully',
      id: inserted[0].id,
    }
  } catch (error) {
    console.error('Error during adding user:', error)
    throw new Error('Something went wrong')
  }
}

const getUsersList = async (page = 1, limit = 20, is_deleted = 0) => {
  try {
    const offset = (page - 1) * limit
    const { rows } = await conn.query(
      'SELECT id, name, email FROM users WHERE is_deleted = $1 LIMIT $2 OFFSET $3',
      [is_deleted ? true : false, limit, offset]
    )
    const { rows: countRows } = await conn.query(
      'SELECT COUNT(*) AS length FROM users WHERE is_deleted = $1',
      [is_deleted ? true : false]
    )
    return { data: rows, length: parseInt(countRows[0].length, 10) }
  } catch (error) {
    console.error('Error during getting user list:', error)
    throw new Error('Something went wrong')
  }
}

const accountInfo = async (id) => {
  try {
    const { rows } = await conn.query(
      'SELECT * FROM users WHERE id = $1 AND is_deleted = false',
      [id]
    )
    if (rows.length === 0) {
      return null
    }
    const user = {
      ...rows[0],
      password: undefined,
      password_reset_token_expires_at: undefined,
      password_reset_token: undefined,
      password_last_updated_at: undefined,
      is_deleted: undefined,
      emailConfirmationToken: undefined,
    }
    return user
  } catch (error) {
    console.error('Error during accountInfo:', error)
    throw new Error('Something went wrong')
  }
}

module.exports = {
  login,
  changePassword,
  checkUserAuth,
  getUserById,
  deactivateUser,
  addUser,
  getUsersList,
  accountInfo,
  getUserByEmail,
  updateResetPasswordToken,
  checkPasswordToken,
}
