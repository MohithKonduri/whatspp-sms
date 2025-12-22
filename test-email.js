const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

async function testEmail() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    console.log('Testing with:', {
        user: gmailUser,
        passwordSet: !!gmailPassword
    });

    if (!gmailUser || !gmailPassword) {
        console.error('Missing credentials in .env.local');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: gmailUser,
            pass: gmailPassword,
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified successfully!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"Test" <${gmailUser}>`,
            to: gmailUser,
            subject: 'SMTP Test',
            text: 'If you see this, email is working.',
        });
        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error);
    }
}

testEmail();
