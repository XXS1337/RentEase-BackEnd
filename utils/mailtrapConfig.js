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
    from: 'Support <support@example.com>', // Sender's email address
    to: data.email, // Receiver's email address
    subject: data.subject, // Subject of the email
    html: `
    <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px;">
          <h2 style="text-align: center; color: #333;">Welcome to Our Service!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Dear <strong>${data.userName}</strong>,
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Thank you for signing up for our service. We're thrilled to have you on board! To get started, please click the link below to confirm your email address.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5; word-wrap: break-word; overflow-wrap: break-word;">
           <strong>Confirmation Link:</strong> ${data.message}
          </p>
          <p style="color: #777; font-size: 14px; text-align: center; margin-top: 20px;">
            If you did not sign up for this service, please ignore this email.
          </p>
          <footer style="color: #888; font-size: 14px; text-align: center; margin-top: 40px;">
            <p>&copy; 2025 RentEase. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
    `, // Body of the email (HTML)
  };

  // 3) Send the email using the transporter
  await transporter.sendMail(options);
};

module.exports = emailService;
