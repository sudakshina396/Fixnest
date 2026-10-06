const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  connectionTimeout: 7000,
  greetingTimeout: 7000,
  socketTimeout: 10000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  // Development mode fallback
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Cannot send OTP email: SMTP is not configured.');
      return false;
    }
    console.log('=================================');
    console.log('FIXNEST DEVELOPMENT OTP');
    console.log('=================================');
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log('Expires: 5 minutes');
    console.log('=================================');
    return 'console';
  }

  const mailOptions = {
    from: `"Fixnest Team" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Fixnest verification code',
    text: `Hi,\n\nYour Fixnest verification code is:\n\n${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, you can safely ignore this email.\n\nThanks,\nFixnest Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return 'email';
  } catch (error) {
    console.error('Error sending email:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email delivery failed in development; using the local OTP fallback.');
      console.log('=================================');
      console.log('FIXNEST DEVELOPMENT OTP');
      console.log('=================================');
      console.log(`Email: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log('Expires: 5 minutes');
      console.log('=================================');
      return 'console';
    }
    return false;
  }
};

const sendNotificationEmail = async (email, name, subject, message) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return false;
  try {
    await transporter.sendMail({
      from: `\"Fixnest\" <${process.env.SMTP_USER}>`, to: email,
      subject: `Fixnest: ${subject}`,
      text: `Hi${name ? ` ${name}` : ''},\n\n${message}\n\nSign in to Fixnest to view your booking details.`,
    });
    return true;
  } catch (error) {
    console.error('Booking notification email failed:', error.message);
    return false;
  }
};

module.exports = { sendOtpEmail, sendNotificationEmail };
