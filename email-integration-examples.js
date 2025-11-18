// Example email service integration for production

// 1. OPTION A: Using EmailJS (Client-side, easy setup)
import emailjs from '@emailjs/browser';

export const sendInviteEmailWithEmailJS = async (memberEmail, inviteLink, memberName) => {
  const templateParams = {
    to_email: memberEmail,
    to_name: memberName,
    invite_link: inviteLink,
    club_name: 'FFA Investment Club',
    from_name: 'FFA Investment Admin'
  };

  try {
    await emailjs.send(
      'your_service_id', // Get from EmailJS dashboard
      'your_template_id', // Create email template
      templateParams,
      'your_public_key' // Get from EmailJS dashboard
    );
    return { success: true };
  } catch (error) {
    console.error('Email failed:', error);
    return { success: false, error: error.message };
  }
};

// 2. OPTION B: Using Nodemailer (Server-side, more control)
// Note: This is a SERVER-SIDE example only. Do not run in the browser bundle.
export const sendInviteEmailWithNodemailer = async (memberEmail, inviteLink, memberName) => {
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.FFA_EMAIL_USER || 'your-ffa-email@gmail.com',
        pass: process.env.FFA_EMAIL_PASS || 'your-app-password'
      }
    });

    const mailOptions = {
      from: '"FFA Investment Club" <' + (process.env.FFA_EMAIL_USER || 'your-ffa-email@gmail.com') + '>',
      to: memberEmail,
      subject: 'Welcome to FFA Investment Club - Set Up Your Account',
      html: `
        <h2>Welcome to FFA Investment Club!</h2>
        <p>Hi ${memberName},</p>
        <p>You've been invited to join our investment club. Click the link below to set up your account:</p>
        <p><a href="${inviteLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Up My Account</a></p>
        <p>This link will expire in 7 days.</p>
        <p>Best regards,<br>FFA Investment Club Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 3. OPTION C: Using SendGrid (Professional service)
// 3. OPTION C: Using SendGrid (Professional service)
// SERVER-SIDE example. Uses dynamic import to avoid bundling in the browser.
export const sendInviteEmailWithSendGrid = async (memberEmail, inviteLink, memberName) => {
  try {
    const { default: sgMail } = await import('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key');

    const msg = {
      to: memberEmail,
      from: process.env.SENDGRID_FROM || 'noreply@ffainvestments.com',
      subject: 'FFA Investment Club - Account Setup',
      // You can use templates or plain html
      html: `Hello ${memberName}, please set up your account: <a href="${inviteLink}">Set up account</a>`
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};