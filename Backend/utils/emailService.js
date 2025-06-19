import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Only for development
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendWelcomeEmail = async (userData) => {
  console.log('Attempting to send welcome email to:', userData.email);
  console.log('Using email configuration:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE,
    user: process.env.EMAIL_USER
  });

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: userData.email,
    subject: 'Welcome to CRM Bench Sales Process',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to CRM Bench Sales Process!</h2>
        <p>Hello ${userData.firstname},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Username:</strong> ${userData.username}</p>
          <p><strong>Password:</strong> ${userData.password}</p>
        </div>
        <p>Please login and change your password for security reasons.</p>
        <p>Best regards,<br>CRM Bench Sales Process Team</p>
      </div>
    `
  };

  try {
    console.log('Sending welcome email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendLeadAssignmentEmail = async (leadData, assignedUser) => {
  console.log('Attempting to send lead assignment email to:', assignedUser.email);
  console.log('Lead data:', {
    name: leadData.name,
    email: leadData.email,
    technology: leadData.technology
  });

  const leadName = leadData.firstName + leadData.lastName || 'New Lead';
  const contactNumber = leadData.primaryContact || leadData.contact || 'Not provided';
  const emailAddress = leadData.email || leadData.primaryEmail || 'Not provided';

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: assignedUser.email,
    subject: `New Lead Assignment: ${leadName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                padding: 10px !important;
              }
              .lead-card {
                padding: 15px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4;">
          <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a237e 0%, #283593 100%); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 500;">New Lead Assignment</h1>
            </div>

            <!-- Greeting -->
            <div style="padding: 25px; background-color: #ffffff;">
              <p style="color: #333333; font-size: 16px; margin: 0; font-weight: 500;">Hello ${assignedUser.firstname || 'Team Member'},</p>
              <p style="color: #666666; font-size: 15px; margin-top: 10px;">A new lead has been assigned to you. Please review the details below:</p>
            </div>

            <!-- Lead Details Card -->
            <div class="lead-card" style="background-color: #ffffff; border-radius: 8px; padding: 25px; margin: 0 20px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%); padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 500;">${leadName}</h2>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7;">
                    <strong style="color: #333333; font-weight: 500;">Contact:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; color: #666666;">
                    ${contactNumber}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7;">
                    <strong style="color: #333333; font-weight: 500;">Email:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; color: #666666;">
                    ${emailAddress}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7;">
                    <strong style="color: #333333; font-weight: 500;">Technology:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; color: #666666;">
                    ${leadData.technology || 'Not specified'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7;">
                    <strong style="color: #333333; font-weight: 500;">Country:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; color: #666666;">
                    ${leadData.country || 'Not specified'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7;">
                    <strong style="color: #333333; font-weight: 500;">Visa Status:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eef2f7; color: #666666;">
                    ${leadData.visaStatus || 'Not specified'}
                  </td>
                </tr>
                ${leadData.linkedinProfile ? `
                <tr>
                  <td style="padding: 12px 0;">
                    <strong style="color: #333333; font-weight: 500;">LinkedIn:</strong>
                  </td>
                  <td style="padding: 12px 0;">
                    <a href="${leadData.linkedinProfile}" style="color: #1976d2; text-decoration: none; font-weight: 500;">View Profile</a>
                  </td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #666666; font-size: 14px; border-top: 1px solid #eef2f7;">
              <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
              <p style="margin: 5px 0 0 0; color: #333333;">CRM Bench Sales Process Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    console.log('Sending lead assignment email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Lead assignment email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending lead assignment email:', error);
    return false;
  }
}; 