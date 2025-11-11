const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')

const { exportDatabase } = require('../controllers/exportController')

const router = express.Router()

router.get('/', verifyToken, adminOnly, exportDatabase)

module.exports = router