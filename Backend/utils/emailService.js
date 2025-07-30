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
transporter.verify(function (error, success) {
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

export const sendClientWelcomeEmail = async (clientData) => {
  console.log('Attempting to send welcome email to client:', clientData.primaryEmail);

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: clientData.primaryEmail,
    subject: 'Welcome to Your Client Portal - CRM Bench Sales Process',
    attachments: [{
      filename: 'Logo.webp',
      path: './assets/Logo.webp',
      cid: 'companyLogo'
    }],
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
          <div class="container" style="max-width: 800px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="padding: 32px 40px; text-align: left; border-bottom: 1px solid #e2e8f0;); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">Welcome to Your Client Portal</h1>
              <p style="margin: 10px 0 0; color: #e0f2fe; font-size: 16px;">Your journey with us begins here</p>
            </div>

            <!-- Content -->
            <div class="content" style="padding: 40px;">
              <p style="color: #334155; font-size: 18px; margin: 0 0 24px 0; font-weight: 500;">Dear ${clientData.firstName} ${clientData.lastName},</p>
              
              <p style="color: #64748b; font-size: 16px; margin: 0 0 32px 0; line-height: 1.6;">
                Welcome to the CRM Bench Sales Process client portal! We're excited to have you on board. Your account has been created successfully, and you can now access our platform using the credentials below.
              </p>

              <!-- Credentials Box -->
              <div style="background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <h3 style="margin: 0 0 20px 0; color: #0369a1; font-size: 18px; font-weight: 600;">Your Login Credentials</h3>
                <div style="display: grid; gap: 16px;">
                  <div>
                    <label style="display: block; color: #475569; font-size: 14px; margin-bottom: 4px;">Username</label>
                    <div style="background: #ffffff; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 16px; color: #334155;">
                      ${clientData.username}
                    </div>
                  </div>
                  <div>
                    <label style="display: block; color: #475569; font-size: 14px; margin-bottom: 4px;">Password</label>
                    <div style="background: #ffffff; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 16px; color: #334155;">
                      ${clientData.password}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Security Notice -->
              <div style=" border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style=" font-size: 16px; font-weight: 600;">🔒 Security Recommendation</span>
                </div>
                <p style=" font-size: 14px; margin: 0; line-height: 1.5;">
                  For your security, we strongly recommend changing your password after your first login. This helps ensure the privacy and security of your account.
                </p>
              </div>

              <div style="margin-top: 32px;">
                <p style="color: #334155; font-size: 16px; margin: 0 0 8px 0;">Best regards,</p>
                <p style="color: #334155; font-size: 16px; margin: 0;">CRM Bench Sales Process Team</p>
              </div>
            </div>

            ${getEmailHeader(clientData)}

            <!-- Footer -->
            <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 0 0 12px 12px;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
              <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">CRM Bench Sales Process</p>
              <p style="color: #666; margin: 8px 0 0 0; text-align: center;">"Empowering Career, Enriching Future"</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    console.log('Sending client welcome email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Client welcome email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending client welcome email:', error);
    return false;
  }
};

const getEmailHeader = (userData) => {
  // Handle both property name formats and add null checks
  const firstName = (userData?.firstname || userData?.firstName || '').toUpperCase();
  const lastName = (userData?.lastname || userData?.lastName || '').toUpperCase();
  const designation = userData?.designation || '';
  const phoneNumber = userData?.phoneNumber || '';
  const usphonenumber = userData?.usphonenumber || '';
  const linkedin = userData?.linkedin || '';

  // Only include LinkedIn section if URL exists
  const linkedInSection = linkedin ? `
    <p style="margin: 0 0 5px 0;">
      <strong>LinkedIn:</strong> <a href="${linkedin}" style="color: #0066cc; text-decoration: none;">${firstName} ${lastName}</a>
    </p>
  ` : '';

  // Format phone numbers section
  const phoneNumbers = [];
  if (usphonenumber) phoneNumbers.push(`+${usphonenumber}`);
  if (phoneNumber) phoneNumbers.push(`+${phoneNumber}`);
  const phoneSection = phoneNumbers.length > 0 ? `
    <p style="margin: 0 0 5px 0; color: #0066cc;">
      <strong>C:</strong> ${phoneNumbers.join(', ')}
    </p>
  ` : '';

  return `
  <div style="padding: 20px 0; margin-bottom: 20px; text-align: left;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td width="150" style="vertical-align: top; padding-right: 10px;">
          <img src="cid:companyLogo" alt="Ninez Tech Logo" style="width: 150px; margin-left: 2px"; height: auto;"/>
        </td>

        <!-- Vertical line separator -->
        <td width="1" style="background-color: #3944BC; width: 1px;"></td><br/>
        <td width="1" style="background-color: #3944BC; width: 1px;"></td>

        <td style="vertical-align: top; padding-left: 20px; text-align: left;">
          <h2 style="margin: 0 0 10px 0; color: #e65c00; font-size: 24px; text-align: left;">${firstName} ${lastName}</h2>
          <p style="margin: 0 0 5px 0; font-size: 16px; text-align: left;">${designation}</p>
          ${phoneSection}
          <p style="margin: 0 0 5px 0; text-align: left;">
            <strong>W:</strong> <a href="http://www.nineztech.com" style="color: #0066cc; text-decoration: none;">NinezTech</a>
          </p>
          ${linkedInSection}
          <p style="margin: 0; color: #666; text-align: left;">
            <strong>A:</strong> Sharidan, WY -USA| Ahmedabad, Vadodara, IN
          </p>
        </td>
        <td>
        
        </td>
      </tr>
    </table>
  </div>
`;
};

export const sendPackageDetailsEmail = async (userData, packages, options = {}) => {
  console.log('Attempting to send package details email to:', options.to || userData.email);

  // Get user data from options or use default userData
  const userDataForHeader = options.userData || userData;

  // Create a custom transporter for this specific email
  const customTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Function to convert markdown-style formatting to HTML
  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

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
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: bold; color: #333333; margin: 0 0 16px 0;">🔹 ${pkg.planName}</h3>
        
        <ul style="list-style-type: none; padding: 0; margin: 0;">
          <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
            • <b>${formatCurrency(pkg.enrollmentCharge)}</b> at enrollment
            ${pkg.discountedPrice ? `
              <span style="text-decoration: line-through; color: #666666; margin-left: 8px;">
                <b>${formatCurrency(pkg.initialPrice)}</b>
              </span>
            ` : ''}
          </li>

          <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
            • <b>${formatCurrency(pkg.offerLetterCharge)}</b> at offer letter
          </li>

          <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
            • ${pkg.firstYearSalaryPercentage ? `<b>${pkg.firstYearSalaryPercentage}%</b> of first-year salary (from first 4 paychecks)` : 
               pkg.firstYearFixedPrice ? `<b>${formatCurrency(pkg.firstYearFixedPrice)}</b> from first-year salary (from first 4 paychecks)` : ''}
          </li>

          ${pkg.features.map(feature => `
            <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
              • ${feature}
            </li>
          `).join('')}
        </ul>

        ${pkg.discounts && pkg.discounts.length > 0 ? `
          <p style="color: #666666; margin: 16px 0 0 20px;">
            Active Discount: Up to <b>${Math.max(...pkg.discounts.map(d => d.percentage))}% off</b>
          </p>
        ` : ''}
      </div>
    `).join('');
  };

  const emailHtml = `
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
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; line-height: 1.6; text-align: left;">
        <div class="container" style="max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          ${options.customBody ? formatText(options.customBody) : `
            <div style="padding: 5PX 0; text-align: left;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; text-align: left;">Hello ${userData.firstName},</p>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 15px; text-align: left;">Thank you for your valuable time. I've highlighted details about our company and services below to give you a better understanding of our online presence and commitment to supporting your job search.</p>
             
              <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; text-align: left;"><strong>Please visit our online presence and plans:</strong><br/>
              <a href="https://taplink.cc/nineztech" style="color: #0066cc; text-decoration: none;">Nineztech | Online Presence</a><br/>
              <span style="font-size: 13px;">Please find discounted pricing below in this email</span><br/></p><br/>

              <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; text-align: left;"><strong>Why Choose Ninez Tech?</strong></p>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 15px; text-align: left;">Join the fastest-growing network for OPT/CPT/H1B/GC/USC job seekers and sponsors. We specialize in connecting international professionals, students, and US companies.</p>
              
              <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; text-align: left;"><strong>Program Highlights:</strong></p><br/>
              <ul style="list-style-type: none; padding: 0; margin: 0 0 20px 20px; text-align: left;">
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Our recruiter will work full-time for you according to your time zone, coordinating with you to meet your expectations and requirements.</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Search for positions to submit your resume.</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Source passive positions suitable for your resume.</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Carefully scan each position and select the most suitable ones that match your resume.</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Our recruiters have formal training in various technical skills and can handle preliminary technical interviews with technical recruiters.</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• The recruiter will coordinate with the client's technical recruiter for various discussions.</li>
              </ul>

              <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; text-align: left;"><strong>Topics Covered in Our Placement Program:</strong></p><br/>
              <ul style="list-style-type: none; padding: 0; margin: 0 0 20px 20px; text-align: left;">
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Skill & Technology Guidance</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Resume Writing (ATS optimized)</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Resume Marketing (through a dedicated technical recruiter)</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Placement</li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative; text-align: left;">• Compliance</li>
              </ul>

              ${getPackageCards(packages)}
                
              <div style="margin-top: 30px; text-align: left;">
                <p style="color: #333333; font-size: 15px; margin: 0 0 20px 0; text-align: left;">Let me know if you have any questions or would like to hop on a quick call to discuss which plan best aligns with your goals.</p>
                <p style="color: #333333; font-size: 15px; margin: 0; text-align: left;">Looking forward to helping you take the next big step in your career!</p>
              </div><br/><br/>  --
              <div style="margin-top: 20px; padding-top: 20px; text-align: left;">
                <b><p style="color: #333333; margin: 0; text-align: left;">Thanks and Regards,</p></b>
              </div>
            </div>
          `}
          
          ${!options.skipHeader ? getEmailHeader(userDataForHeader) : ''}
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ccc;">
            <p style="color: #666; margin: 0; text-align: left;">"Empowering Career, Enriching Future"</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // If preview mode is enabled, return the HTML without sending
  if (options.previewOnly) {
    return emailHtml;
  }

  const mailOptions = {
    from: options.from || `"${userDataForHeader.firstname} ${userDataForHeader.lastname}" <${process.env.EMAIL_USER}>`,
    to: options.to || userData.email,
    cc: options.cc || [],
    subject: options.subject || 'Embark on a Success Journey with Ninez Tech',
    attachments: [{
      filename: 'Logo.webp',
      path: '../User/src/assets/Logo.webp',
      cid: 'companyLogo'
    }],
    html: emailHtml,
    replyTo: userDataForHeader.email || process.env.EMAIL_USER
  };

  try {
    console.log('Sending package details email...');
    const info = await customTransporter.sendMail(mailOptions);
    console.log('Package details email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending package details email:', error);
    return false;
  }
}; 