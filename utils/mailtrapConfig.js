const nodemailer = require('nodemailer');

// Service to send email using Nodemailer
const emailService = async (data) => {
  // 1) Create a transporter using SMTP settings (from environment variables)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // SMTP server host
    port: process.env.EMAIL_PORT, // Port number
    secure: false, // Use false for ports other than 465 (for security purposes)
    auth: {
      user: process.env.EMAIL_USERNAME, // SMTP username
      pass: process.env.EMAIL_PASSWORD, // SMTP password
    },
  });

  // 2) Set up the email options (sender, receiver, subject, and body)
  const options = {
    from: 'Support <support@example.com>',
    to: data.email,
    subject: data.subject,
    html: `
    <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px;">
          <h2 style="text-align: center; color: #333;">Reset Your Password</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Hi <strong>${data.userName}</strong>,
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            We received a request to reset your password. Click the button below to proceed:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #555; font-size: 14px; line-height: 1.5;">
            If the button doesn't work, copy and paste the following link into your browser:<br />
            <a href="${data.resetUrl}" style="color: #007bff; word-break: break-word;">${data.resetUrl}</a>
          </p>
          <p style="color: #777; font-size: 14px; text-align: center; margin-top: 20px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
          <footer style="color: #888; font-size: 14px; text-align: center; margin-top: 40px;">
            <p>&copy; 2025 RentEase. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
    `,
  };

  // 3) Send the email using the transporter
  await transporter.sendMail(options);
};

module.exports = emailService;
