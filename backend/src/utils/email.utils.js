import nodemailer from "nodemailer";

// ─── Transporter Setup ────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ─── Base Email Template ─────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Database_Management System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f0f11; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 40px auto; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin-top: 6px; font-size: 14px; }
    .body { background: #1a1a2e; padding: 40px 32px; border-radius: 0 0 16px 16px; border: 1px solid rgba(99,102,241,0.2); border-top: none; }
    .greeting { font-size: 18px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px; }
    .text { color: #94a3b8; line-height: 1.7; font-size: 15px; margin-bottom: 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; margin: 24px 0; }
    .divider { border: none; border-top: 1px solid rgba(99,102,241,0.2); margin: 28px 0; }
    .link-box { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 8px; padding: 12px 16px; word-break: break-all; font-size: 13px; color: #818cf8; }
    .warning { font-size: 13px; color: #64748b; margin-top: 24px; }
    .footer { text-align: center; padding: 24px; color: #475569; font-size: 13px; }
    .badge { display: inline-block; background: rgba(99,102,241,0.15); color: #818cf8; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(99,102,241,0.3); margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🔐 Database_Management System</h1>
      <p>Secure Authentication Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Database_Management System. All rights reserved.</p>
      <p style="margin-top:6px">This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Forgot Password Email ────────────────────────────────────────────────────
export const forgotPasswordTemplate = ({ name, resetURL, expiresIn }) =>
  baseTemplate(`
  <span class="badge">Password Reset</span>
  <p class="greeting">Hey ${name} 👋</p>
  <p class="text">We received a request to reset the password for your Database_Management System account. If you made this request, click the button below.</p>
  <div style="text-align: center;">
    <a href="${resetURL}" class="btn">Reset My Password →</a>
  </div>
  <hr class="divider" />
  <p class="text" style="font-size:13px">Or copy and paste this link in your browser:</p>
  <div class="link-box">${resetURL}</div>
  <p class="warning">⏰ This link will expire in <strong>${expiresIn}</strong>. If you didn't request a password reset, please ignore this email — your password will not be changed.</p>
`);

// ─── Welcome Email ────────────────────────────────────────────────────────────
export const welcomeTemplate = ({ name }) =>
  baseTemplate(`
  <span class="badge">Welcome</span>
  <p class="greeting">Welcome aboard, ${name}! 🎉</p>
  <p class="text">Your Database_Management System account has been created successfully. You now have access to our platform.</p>
  <p class="text">Here's what you can do:</p>
  <ul style="color:#94a3b8; line-height:2; padding-left:20px; font-size:15px">
    <li>Update your profile and avatar</li>
    <li>Change your password anytime</li>
    <li>Manage your account settings</li>
  </ul>
  <p class="warning" style="margin-top:24px">If you didn't create this account, please contact our support immediately.</p>
`);

// ─── Password Changed Confirmation ────────────────────────────────────────────
export const passwordChangedTemplate = ({ name }) =>
  baseTemplate(`
  <span class="badge">Security Alert</span>
  <p class="greeting">Hey ${name} 👋</p>
  <p class="text">Your password has been successfully changed. You can now log in with your new password.</p>
  <p class="warning">⚠️ If you did NOT change your password, please contact our support team immediately and secure your account.</p>
`);

// ─── Send Email Helper ────────────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send error: ${error.message}`);
    throw new Error("Failed to send email. Please try again.");
  }
};
