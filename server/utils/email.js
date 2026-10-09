const nodemailer = require('nodemailer');

const sendWithResend = async ({ to, subject, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and RESEND_FROM_EMAIL must both be configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Resend API ${response.status}: ${result.message || result.name || 'email request failed'}`);
  }
  return true;
};

const sendEmail = async ({ to, subject, text }) => {
  // Prefer HTTPS email delivery so this works on Render's free plan, which
  // blocks outbound SMTP ports. SMTP remains available on hosts that permit it.
  if (process.env.RESEND_API_KEY || process.env.RESEND_FROM_EMAIL) {
    return sendWithResend({ to, subject, text });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Configure Resend or SMTP email credentials.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 10000,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: `"Fixnest Team" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
  return true;
};

const sendNotificationEmail = async (email, name, subject, message) => {
  try {
    return await sendEmail({
      to: email,
      subject: `Fixnest: ${subject}`,
      text: `Hi${name ? ` ${name}` : ''},\n\n${message}\n\nSign in to Fixnest to view your booking details.`,
    });
  } catch (error) {
    console.error('Booking notification email failed:', error.message);
    return false;
  }
};

module.exports = { sendNotificationEmail };
