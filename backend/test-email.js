require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    await transporter.verify();

    console.log('SMTP connection successful!');

    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.SMTP_USER,
        subject: 'Ecommerce Email Test',
        text: 'Congratulations! Your Ecommerce email configuration is working.',
    });

    console.log('Email sent successfully:', info.messageId);
}

testEmail().catch((error) => {
    console.error('Email test failed:', error.message);
    process.exitCode = 1;
});