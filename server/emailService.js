const nodemailer = require('nodemailer');

/**
 * Checks if real SMTP credentials are configured in .env
 */
function isSmtpConfigured() {
  const email = process.env.SMTP_EMAIL || '';
  const pass  = process.env.SMTP_PASSWORD || '';
  return (
    email.length > 0 &&
    email !== 'your_gmail@gmail.com' &&
    pass.length > 0 &&
    pass !== 'your_gmail_app_password_here'
  );
}

/**
 * Creates a Gmail transporter using real SMTP credentials from .env
 */
function createGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD, // Gmail App Password (not your normal Gmail password)
    },
  });
}

/**
 * Creates an Ethereal (fake/test) transporter on-the-fly.
 * Ethereal is a free fake SMTP service by the Nodemailer team.
 * Emails are NOT delivered to real inboxes — instead you get a
 * preview URL in the console to view the email in your browser.
 */
async function createEtherealTransporter() {
  // Generate a disposable test account at ethereal.email
  const testAccount = await nodemailer.createTestAccount();
  console.log('\n┌─────────────────────────────────────────────────────┐');
  console.log('│  📧  ETHEREAL TEST EMAIL ACCOUNT CREATED             │');
  console.log('│  User:', testAccount.user.padEnd(43), '│');
  console.log('│  Pass:', testAccount.pass.padEnd(43), '│');
  console.log('│  Inbox: https://ethereal.email/messages              │');
  console.log('└─────────────────────────────────────────────────────┘\n');

  return nodemailer.createTransport({
    host:   'smtp.ethereal.email',
    port:   587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

/**
 * Sends a branded OTP verification email to the specified address.
 *
 * If real SMTP is configured in .env → sends via Gmail.
 * Otherwise              → sends via Ethereal fake SMTP (for testing).
 *   A preview URL is printed in the console so you can view the email.
 *
 * @param {string} toEmail  - Recipient email address
 * @param {string} otp      - 6-digit OTP code
 * @param {string} userName - Recipient's name (optional)
 */
async function sendOtpEmail(toEmail, otp, userName = 'User') {
  const usingReal = isSmtpConfigured();
  const transporter = usingReal
    ? createGmailTransporter()
    : await createEtherealTransporter();

  const fromName  = process.env.SMTP_FROM_NAME || 'StockSense';
  const fromEmail = usingReal
    ? process.env.SMTP_EMAIL
    : 'stocksense@ethereal.example';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0e1a; margin: 0; padding: 0; }
        .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #111827; border-radius: 16px; border: 1px solid rgba(99,102,241,0.2); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e1b4b 0%, #0a0e1a 100%); padding: 32px 36px; border-bottom: 1px solid rgba(99,102,241,0.2); text-align: center; }
        .logo-text { font-size: 26px; font-weight: 700; color: #a78bfa; letter-spacing: -0.5px; }
        .logo-text span { font-weight: 300; color: #94a3b8; }
        .body { padding: 36px; }
        .greeting { color: #f1f5f9; font-size: 18px; margin-bottom: 12px; }
        .description { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
        .otp-box { background: rgba(99,102,241,0.1); border: 2px dashed rgba(99,102,241,0.4); border-radius: 12px; text-align: center; padding: 24px; margin-bottom: 28px; }
        .otp-label { color: #94a3b8; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
        .otp-code { font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #a78bfa; font-family: 'Courier New', monospace; }
        .otp-expiry { color: #64748b; font-size: 12px; margin-top: 10px; }
        .warning { color: #f59e0b; font-size: 13px; background: rgba(245,158,11,0.08); border-radius: 8px; padding: 12px 16px; }
        .footer { background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); padding: 20px 36px; text-align: center; color: #475569; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <div class="logo-text">Stock<span>Sense</span></div>
            <div style="color:#64748b;font-size:12px;margin-top:6px;">Smart Inventory Management</div>
          </div>
          <div class="body">
            <div class="greeting">Hello, ${userName}! 👋</div>
            <div class="description">
              You're registering for <strong style="color:#a78bfa;">StockSense</strong>.
              Use the OTP below to verify your email address and complete your registration.
            </div>
            <div class="otp-box">
              <div class="otp-label">Your One-Time Password</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">⏱️ Valid for 10 minutes</div>
            </div>
            <div class="warning">
              🔐 Never share this OTP with anyone. StockSense will never ask for your OTP via phone or chat.
            </div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} StockSense · Smart Inventory System<br>
            This is an automated email. Please do not reply.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from:    `"${fromName}" <${fromEmail}>`,
    to:      toEmail,
    subject: `${otp} — Your StockSense Verification Code`,
    html,
    text: `Your StockSense OTP is: ${otp}\nThis code expires in 10 minutes. Do not share it with anyone.`,
  };

  const info = await transporter.sendMail(mailOptions);

  if (!usingReal) {
    // Print the Ethereal preview URL — open this link to see the email!
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  🧪  TEST OTP EMAIL SENT (Ethereal - not real)        ║');
    console.log('║                                                       ║');
    console.log(`║  OTP Code  : ${otp}                                   ║`);
    console.log(`║  Sent to   : ${toEmail.substring(0, 40).padEnd(40)}  ║`);
    console.log('║                                                       ║');
    console.log('║  👉 Open this URL to VIEW the email in your browser:  ║');
    console.log(`║  ${(previewUrl || 'N/A').substring(0, 53).padEnd(53)} ║`);
    console.log('╚═══════════════════════════════════════════════════════╝\n');
  } else {
    console.log(`[Email] OTP sent to ${toEmail} — Message ID: ${info.messageId}`);
  }

  return { info, previewUrl: !usingReal ? nodemailer.getTestMessageUrl(info) : null };
}

module.exports = { sendOtpEmail, isSmtpConfigured };
