const nodemailer = require("nodemailer");

module.exports = async () => {
    let testAccount;
    if (process.env.NODE_ENV !== 'production')
        testAccount = await nodemailer.createTestAccount();

    return {
        host: process.env.HOST || "smtp.ethereal.email",
        port: process.env.PORT || 587,
        secure: false,
        auth: {
            user: process.env.AUTH_USER || testAccount.user,
            pass: process.env.AUTH_PASS || testAccount.pass
        },
        subject: process.env.MAIL_SUBJECT || 'Notification Mail From BlueBoard',
        language: process.env.MAIL_LANGUAGE || 'hebrew',
        appUrl: process.env.APP_URL || 'http://localhost:1337'
    }
}