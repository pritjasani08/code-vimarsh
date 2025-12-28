const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter using SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports (587 uses TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify email configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Email service error:', error.message);
    console.log('Please check your SMTP configuration in .env file');
  } else {
    console.log('Email service is ready to send messages');
  }
});

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const fromAddress = process.env.OTP_FROM || process.env.SMTP_USER || 'Code Vimarsh <noreply@codevimarsh.in>';
    
    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: 'Code Vimarsh - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">Code Vimarsh</h2>
            <h3 style="color: #333; margin-bottom: 15px;">Email Verification</h3>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Thank you for signing up! Please verify your email address by entering the OTP below:
            </p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</div>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Code Vimarsh. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send contact form email to frutrigo786@gmail.com
const sendContactEmail = async ({ fromName, fromEmail, subject, message }) => {
  try {
    const fromAddress = process.env.SMTP_USER || 'Code Vimarsh <noreply@codevimarsh.in>';
    const contactEmail = process.env.CONTACT_EMAIL || 'frutrigo786@gmail.com';
    
    const mailOptions = {
      from: fromAddress,
      to: contactEmail,
      replyTo: fromEmail, // Allow replying directly to the sender
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #667eea; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <div style="margin-bottom: 20px;">
              <p style="color: #666; margin: 10px 0;">
                <strong style="color: #333;">From:</strong> ${fromName}
              </p>
              <p style="color: #666; margin: 10px 0;">
                <strong style="color: #333;">Email:</strong> 
                <a href="mailto:${fromEmail}" style="color: #667eea; text-decoration: none;">${fromEmail}</a>
              </p>
              <p style="color: #666; margin: 10px 0;">
                <strong style="color: #333;">Subject:</strong> ${subject}
              </p>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Message:</h3>
              <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent from the Code Vimarsh contact form.
                <br>
                You can reply directly to this email to respond to ${fromName}.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

From: ${fromName}
Email: ${fromEmail}
Subject: ${subject}

Message:
${message}

---
This email was sent from the Code Vimarsh contact form.
You can reply directly to this email to respond to ${fromName}.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent successfully to:', contactEmail);
    console.log('Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendContactEmail,
  transporter
};
