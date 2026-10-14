const nodemailer = require('nodemailer');

let transporter = null;

const initMailer = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[Mailer] SMTP transport configured.');
  } else {
    console.warn('[Mailer] SMTP not fully configured. Emails will be logged to console.');
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.SMTP_FROM || 'Warranty Tracker <no-reply@example.com>';

  if (transporter) {
    try {
      const info = await transporter.sendMail({ from, to, subject, text, html });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[Mailer Error] Failed to send email via SMTP:', err.message);
      console.log(`[Simulated Email to ${to}] Subject: ${subject}\nBody: ${text}`);
      return { success: false, error: err.message };
    }
  } else {
    console.log('----------------------------------------------------');
    console.log(`[SIMULATED EMAIL DISPATCH]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log('----------------------------------------------------');
    return { success: true, simulated: true };
  }
};

module.exports = { initMailer, sendEmail };
