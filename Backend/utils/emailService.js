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
              .container { width: 100% !important; padding: 15px !important; }
              .content { padding: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #334155;">
          <div class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <h1 style="margin: 0; color: #0369a1; font-size: 24px; font-weight: 600;">New Lead Assignment</h1>
            </div>

            <!-- Content -->
            <div class="content" style="padding: 32px 40px;">
              <p style="color: #334155; font-size: 16px; margin: 0 0 24px 0;">Hello ${assignedUser.firstname || 'Team Member'},</p>
              <p style="color: #64748b; font-size: 15px; margin: 0 0 32px 0;">A new lead has been assigned to you. Here are the details:</p>

              <!-- Lead Info Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h2 style="color: #0369a1; font-size: 18px; margin: 0 0 20px 0;">${leadName}</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #334155; font-weight: 500; width: 120px;">Contact:</td>
                    <td style="padding: 12px 0; color: #64748b;">${contactNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #334155; font-weight: 500;">Email:</td>
                    <td style="padding: 12px 0; color: #64748b;">${emailAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #334155; font-weight: 500;">Technology:</td>
                    <td style="padding: 12px 0; color: #64748b;">${leadData.technology || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #334155; font-weight: 500;">Country:</td>
                    <td style="padding: 12px 0; color: #64748b;">${leadData.country || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #334155; font-weight: 500;">Visa Status:</td>
                    <td style="padding: 12px 0; color: #64748b;">${leadData.visaStatus || 'Not specified'}</td>
                  </tr>
                  ${leadData.linkedinProfile ? `
                  <tr>
                    <td style="padding: 12px 0; color: #334155; font-weight: 500;">LinkedIn:</td>
                    <td style="padding: 12px 0;">
                      <a href="${leadData.linkedinProfile}" style="color: #0369a1; text-decoration: none; font-weight: 500;">View Profile</a>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
              <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">CRM Bench Sales Process Team</p>
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

export const sendOtpEmail = async (userData) => {
  console.log('Attempting to send OTP email to:', userData.email);

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: userData.email,
    subject: 'Password Reset OTP - CRM Bench Sales Process',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; padding: 15px !important; }
              .content { padding: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #334155;">
          <div class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <h1 style="margin: 0; color: #0369a1; font-size: 24px; font-weight: 600;">Password Reset</h1>
            </div>

            <!-- Content -->
            <div class="content" style="padding: 32px 40px; text-align: center;">
              <p style="color: #334155; font-size: 16px; margin: 0;">Hello ${userData.firstname},</p>
              <p style="color: #64748b; font-size: 15px; margin: 24px 0;">You have requested to reset your password. Please use the verification code below:</p>
              
              <!-- OTP Display -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 32px 0;">
                <div style="font-family: monospace; font-size: 32px; letter-spacing: 8px; color: #0369a1; font-weight: 600;">
                  ${userData.otp}
                </div>
                <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0 0;">This code will expire in 2 minutes</p>
              </div>

              <!-- Security Notice -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                  If you didn't request this password reset, you can safely ignore this email. Your account security is important to us.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
              <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">CRM Bench Sales Process Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    console.log('Sending OTP email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

export const sendPackageDetailsEmail = async (userData, packages) => {
  console.log('Attempting to send package details email to:', userData.email);

  // Function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Generate HTML for package features
  const getFeaturesList = (features) => {
    return features.map(feature => `<li style="margin-bottom: 8px;">✓ ${feature}</li>`).join('');
  };

  // Generate package cards HTML
  const getPackageCards = (packages) => {
    return packages.map(pkg => `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; font-size: 20px; margin: 0 0 16px 0;">${pkg.planName}</h3>
        
        <div style="margin-bottom: 16px;">
          <p style="font-size: 24px; font-weight: bold; color: #334155; margin: 0;">
            ${formatCurrency(pkg.enrollmentCharge)}
            ${pkg.discountedPrice ? `
              <span style="text-decoration: line-through; font-size: 16px; color: #64748b; margin-left: 8px;">
                ${formatCurrency(pkg.initialPrice)}
              </span>
            ` : ''}
          </p>
          <p style="color: #64748b; margin: 8px 0 0 0;">at enrollment</p>
        </div>

        <div style="margin-bottom: 16px;">
          <p style="font-size: 18px; font-weight: bold; color: #334155; margin: 0;">
            ${formatCurrency(pkg.offerLetterCharge)}
          </p>
          <p style="color: #64748b; margin: 8px 0 0 0;">at offer letter</p>
        </div>

        <div style="margin-bottom: 24px;">
          <p style="font-size: 16px; color: #334155; margin: 0;">
            <strong>${pkg.firstYearSalaryPercentage}%</strong> of first-year salary
          </p>
        </div>

        ${pkg.features.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <h4 style="color: #334155; font-size: 16px; margin: 0 0 12px 0;">Features:</h4>
            <ul style="list-style-type: none; padding: 0; margin: 0;">
              ${getFeaturesList(pkg.features)}
            </ul>
          </div>
        ` : ''}

        ${pkg.discounts.length > 0 ? `
          <div style="background-color: #fee2e2; border-radius: 6px; padding: 12px; margin-top: 16px;">
            <p style="color: #ef4444; font-weight: 500; margin: 0;">
              Active Discount: Up to ${Math.max(...pkg.discounts.map(d => d.percentage))}% off
            </p>
          </div>
        ` : ''}
      </div>
    `).join('');
  };

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: userData.email,
    subject: 'Embark on a Success Journey with Ninez Tech',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; padding: 15px !important; }
              .content { padding: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #334155;">
          <div class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <h1 style="margin: 0; color: #0369a1; font-size: 24px; font-weight: 600;">Welcome to Ninez Tech</h1>
            </div>

            <!-- Content -->
            <div class="content" style="padding: 32px 40px;">
              <p style="color: #334155; font-size: 16px; margin: 0 0 24px 0;">Hello ${userData.firstName},</p>
              <p style="color: #64748b; font-size: 15px; margin: 0 0 32px 0;">Thank you for your valuable time. I've highlighted details about our company and services below to give you a better understanding of our online presence and commitment to supporting your job search.</p>

              <div style="margin-bottom: 32px;">
                <h2 style="color: #0369a1; font-size: 20px; margin: 0 0 16px 0;">Why Choose Ninez Tech?</h2>
                <p style="color: #64748b; line-height: 1.6;">Join the fastest-growing network for OPT/CPT/H1B/GC/USC job seekers and sponsors. We specialize in connecting international professionals, students, and US companies.</p>
              </div>

              <div style="margin-bottom: 32px;">
                <h2 style="color: #0369a1; font-size: 20px; margin: 0 0 16px 0;">Our Available Plans</h2>
                ${getPackageCards(packages)}
              </div>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 15px; margin: 0;">Let me know if you have any questions or would like to hop on a quick call to discuss which plan best aligns with your goals.</p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">Looking forward to helping you take the next big step in your career!</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    console.log('Sending package details email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Package details email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending package details email:', error);
    return false;
  }
}; 