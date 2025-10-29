const nodemailer = require('nodemailer')

async function sendEmail(to, from, subject, message) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    })

    const mailOptions = {
      from,
      to,
      subject,
      html: message
    }

    let info = await transporter.sendMail(mailOptions)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

module.exports = {sendEmail}
