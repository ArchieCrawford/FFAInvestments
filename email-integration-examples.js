// Example email service integration for production

// 1. OPTION A: Using EmailJS (Client-side, easy setup)
import emailjs from '@emailjs/browser';

const sendInviteEmail = async (memberEmail, inviteLink, memberName) => {
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
// You'd need a backend server for this
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: 'your-ffa-email@gmail.com',
    pass: 'your-app-password' // Use App Password, not regular password
  }
});

const sendInviteEmail = async (memberEmail, inviteLink, memberName) => {
  const mailOptions = {
    from: '"FFA Investment Club" <your-ffa-email@gmail.com>',
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

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 3. OPTION C: Using SendGrid (Professional service)
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('your-sendgrid-api-key');

const sendInviteEmail = async (memberEmail, inviteLink, memberName) => {
  const msg = {
    to: memberEmail,
    from: 'noreply@ffainvestments.com', // Your verified sender
    subject: 'FFA Investment Club - Account Setup',
    templateId: 'your-sendgrid-template-id', // Create template in SendGrid
    dynamicTemplateData: {
      member_name: memberName,
      invite_link: inviteLink,
      club_name: 'FFA Investment Club'
    }
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};