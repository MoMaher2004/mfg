const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')
const joi = require('joi')
const { sendEmail } = require('../utils/sendEmail')

const createToken = (id, email, authType, name) => {
  return jwt.sign({ id, email, authType, name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  })
}

const invalidateToken = (res) => {
  res.clearCookie('token', {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  })
  return true
}

const logout = (req, res) => {
  try {
    invalidateToken(res)
    return res.status(200).json({ message: 'Logged out successfully', redirect: 'homePage' })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const verifyJWT = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err)
      resolve(decoded)
    })
  })
}

const verifyToken = async (req, res, next) => {
  try {
    if (!req.headers['authorization']) {
      return res.status(401).json({
        error: 'No token provided, Please login',
        redirect: 'loginPage',
      })
    }
    const token = req.headers['authorization'].split(' ')[1]
    if (!token) {
      return res.status(401).json({
        error: 'No token provided, Please login',
        redirect: 'loginPage',
      })
    }
    let decoded
    try {
      decoded = await verifyJWT(token, process.env.JWT_SECRET)
    } catch (error) {
      return res.status(401).json({
        error: 'Failed to authenticate token, Please login',
        redirect: 'loginPage',
      })
    }
    const tokenIssuedAt = new Date(decoded.iat * 1000)
    const checkUserAuth = await userModel.checkUserAuth(decoded.id)

    if (!checkUserAuth || checkUserAuth.is_deleted) {
      return res.status(404).json({
        error: 'User not found, Please login',
        redirect: 'loginPage',
      })
    }

    // if (new Date(checkUserAuth.password_last_updated_at) > tokenIssuedAt) {
    //   invalidateToken(res)
    //   return res.status(401).json({ error: 'Password changed, please login again' })
    // }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      is_admin: checkUserAuth.is_admin,
      authType: decoded.authType,
    }
    next()
  } catch (error) {
    invalidateToken(res)
    return res.status(401).json({
      error: 'Token is not valid, Please login again',
      redirect: 'loginPage',
    })
  }
}

const saveCookies = (res, token) => {
  try {
    res.cookie('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: process.env.COOKIE_EXPIRES_IN
        ? Number(process.env.COOKIE_EXPIRES_IN) * 1000
        : 8 * 60 * 60 * 1000,
    })
  } catch (error) {
    console.error('save cookies error:', error)
  }
}

const adminOnly = async (req, res, next) => {
  try {
    if (!req.user.is_admin || req.user.is_admin == false) {
      return res.status(403).json({ error: 'Access denied' })
    }
    next()
  } catch (error) {
    console.error('check user role error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const login = async (req, res, fromFunction = false) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const result = await userModel.login(email, password)

    if (result == null) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
      result.token = createToken(result.id, result.email, 'password', result.name)
      saveCookies(res, result.token)
      if (fromFunction) {
        return true
      }
      return res.status(200).json({ success: 'Login is successful', redirect: 'homePage' })
  } catch (error) {
    console.error('login error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const changePassword = async (req, res) => {
  try {
    const { email } = req.user
    const { old_password, new_password } = req.body

    if (!old_password) {
      return res.status(400).json({ error: 'Old password is required' })
    }

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    if (old_password === new_password) {
      return res.status(400).json({ error: 'New password must be different' })
    }
    const result = await userModel.changePassword(email, old_password, new_password)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('change password error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const resetPassword = async (req, res) => {
  try {
    const { email, authType } = req.user
    const { new_password } = req.body

    if (authType != 'email') {
      throw new Error('Invalid authType')
    }

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    const result = await userModel.changePassword(email, '', new_password, 'email')
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('resetPassword error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.body
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Valid user ID is required' })
    }
    const result = await userModel.deactivateUser(id)

    return res.status(200).json(result.success)
  } catch (error) {
    console.error('deactivate user error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const updateResetPasswordToken = async (email) => {
  try {
    const result = await userModel.updateResetPasswordToken(email)
    if (!result.success) {
      throw new Error('unknown error')
    }
    return result
  } catch (error) {
    console.error('updateResetPasswordToken:', error)
    throw new Error('unknown error')
  }
}

const sendResetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body
    const result = await updateResetPasswordToken(email)
    if (result.error) {
      return res.status(400).json(result)
    }
    const from = 'support'
    const subject = 'Reset Password'
    const message = `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f9f9f9;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9; padding:20px 0;">
      <tr>
        <td align="center">
          <table width="400" cellpadding="20" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" style="padding-bottom:10px;">
                <img src="${process.env.URL}/assets/logo-mqR8tA3L.png" alt="New Capital Logo" width="150" height="50" style="display:block;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:10px;">
                Reset Your Password
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:14px; color:#555555; line-height:1.6;">
                We received a request to reset your password.  
                Click the button below to create a new one.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 0;">
                <a href="${process.env.URL}/resetPassword?token=${encodeURIComponent(result.resetPasswordToken)}&email=${encodeURIComponent(email)}" 
                   style="background-color:#e53935; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:4px; font-size:14px; display:inline-block;">
                   Reset Password
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:12px; color:#999999; padding-top:10px;">
                If the button doesn’t work, copy and paste this link into your browser:<br>
                <a href="${process.env.URL}/resetPassword?token=${encodeURIComponent(result.resetPasswordToken)}&email=${encodeURIComponent(email)}" style="color:#e53935; word-break:break-all;">
                  ${process.env.URL}/resetPassword?token=${encodeURIComponent(result.resetPasswordToken)}&email=${encodeURIComponent(email)}
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:11px; color:#aaaaaa; padding-top:20px;">
                If you did not request a password reset, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
    let sendEmailRes
    try {
      sendEmailRes = await sendEmail(email, from, subject, message)
    } catch (error) {
      console.error('send email error:', error)
    }
    if (sendEmailRes.error) {
      return res.status(400).json({ error: sendEmailRes.error })
    }
    return res.status(200).json({ success: 'email was sent successfully' })
  } catch (error) {
    console.error('resendResetPasswordToken:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const addUser = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().trim().min(2).max(255).required(),
      email: joi.string().trim().email().min(2).max(255).required(),
      password: joi.string().trim().min(8).max(64).required()
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const addUserRes = await userModel.addUser(value.name, value.email, value.password)

    if (addUserRes.error) {
      return res.status(400).json({ error: addUserRes.error })
    }
    return res.status(201).json({
      success: 'User was added successfully',
    })
  } catch (error) {
    console.error('add user error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const getUsersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const is_deleted = req.query.is_deleted === 'true'
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' })
    }
    if (limit > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100' })
    }
    const users = await userModel.getUsersList(page, limit, is_deleted)

    return res.status(200).json(users)
  } catch (error) {
    console.error('get users list error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const accountInfo = async (req, res) => {
  try {
    const { id } = req.user
    const result = await userModel.accountInfo(id)

    return res.status(200).json(result)
  } catch (error) {
    console.error('accountInfo error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await userModel.getUserById(id)

    return res.status(200).json(result)
  } catch (error) {
    console.error('getUserById error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.query
    const result = await userModel.getUserByEmail(email)

    return res.status(200).json(result)
  } catch (error) {
    console.error('getUserByEmail error:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const checkPasswordToken = async (req, res) => {
  try {
    const { email, token } = req.query
    if (!email || !token) {
      return res.status(400).json({ error: 'URL is not valid' })
    }
    const result = await userModel.checkPasswordToken(email, token)

    if (result.error) {
      return res.status(400).json({ error: 'URL is not valid' })
    }

    if (result == null) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    result.token = createToken(result.id, result.email, 'email', result.name)
    saveCookies(res, result.token)

    return res.status(200).json({
      success: 'Authentication is successful',
      redirect: 'changePasswordPage',
    })
  } catch (error) {
    console.error('checkPasswordToken:', error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

module.exports = {
  login,
  verifyToken,
  verifyJWT,
  adminOnly,
  changePassword,
  deactivateUser,
  addUser,
  getUsersList,
  logout,
  accountInfo,
  getUserById,
  getUserByEmail,
  sendResetPasswordToken,
  checkPasswordToken,
  resetPassword,
}
