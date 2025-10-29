const express = require('express')
const {
  login,
  verifyToken,
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
} = require('../controllers/userController')

const router = express.Router()

router.post('/login', (req, res) => login(req, res, false))
router.patch('/changePassword', verifyToken, changePassword)
router.patch('/resetPassword', verifyToken, resetPassword)
router.patch(
  '/deactivate',
  verifyToken,
  (req, res, next) => adminOnly(req, res, next),
  deactivateUser,
)
router.post('/add', verifyToken, (req, res, next) => adminOnly(req, res, next), addUser)
router.get('/list', verifyToken, (req, res, next) => adminOnly(req, res, next), getUsersList)

router.get('/logout', verifyToken, logout)

router.get('/accountInfo', verifyToken, accountInfo)
router.get(
  '/getUserById/:id',
  verifyToken,
  (req, res, next) => adminOnly(req, res, next),
  getUserById,
)
router.get(
  '/getUserByEmail',
  verifyToken,
  (req, res, next) => adminOnly(req, res, next),
  getUserByEmail,
)

router.patch('/sendResetPasswordToken', sendResetPasswordToken)
router.get('/checkPasswordToken', checkPasswordToken)
module.exports = router
