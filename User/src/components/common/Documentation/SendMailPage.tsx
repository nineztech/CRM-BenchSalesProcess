// import React, { useState } from "react";

// const SendMailPage: React.FC = () => {
//   const [sent, setSent] = useState<boolean>(false);

//   const handleSendMail = () => {
//     setSent(true);
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-xl font-semibold mb-4">Send Mail Confirmation</h2>
//       <button
//         onClick={handleSendMail}
//         className="bg-green-600 text-white px-4 py-2 rounded"
//       >
//         {sent ? "Mail Sent ✅" : "Send Mail to Admin"}
//       </button>
//     </div>
//   );
// };

// export default SendMailPage;


// import express from 'express';
// import nodemailer from 'nodemailer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const router = express.Router();

// // Email configuration - UPDATE THESE WITH YOUR ACTUAL EMAIL CREDENTIALS
// const emailConfig = {
//   host: 'smtp.gmail.com', // For Gmail, change for other providers
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: 'your-email@gmail.com', // Your email
//     pass: 'your-app-password' // Your app password (NOT regular password)
//   }
// };

// // Create transporter
// const transporter = nodemailer.createTransporter(emailConfig);

// // Verify transporter connection
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('Email transporter error:', error);
//   } else {
//     console.log('Email server is ready to send messages');
//   }
// });

// // POST endpoint for sending email
// router.post('/send-mail', async (req, res) => {
//   try {
//     const { to, subject, text, html, pdfFile } = req.body;

//     // Validate required fields
//     if (!to || !subject) {
//       return res.status(400).json({
//         success: false,
//         message: 'Recipient email (to) and subject are required'
//       });
//     }

//     // Email options
//     const mailOptions = {
//       from: emailConfig.auth.user,
//       to: to,
//       subject: subject,
//       text: text || 'No text content provided',
//       html: html || `<p>${text || 'No content provided'}</p>`,
//       attachments: []
//     };

//     // Add PDF attachment if provided
//     if (pdfFile) {
//       const filePath = path.join(__dirname, '../uploads/resumes/', pdfFile);
      
//       if (fs.existsSync(filePath)) {
//         mailOptions.attachments.push({
//           filename: pdfFile,
//           path: filePath,
//           contentType: 'application/pdf'
//         });
//       } else {
//         console.warn(`File not found: ${filePath}`);
//       }
//     }

//     // Send email
//     const info = await transporter.sendMail(mailOptions);

//     console.log('Email sent successfully:', info.messageId);
    
//     res.status(200).json({
//       success: true,
//       message: 'Email sent successfully',
//       messageId: info.messageId,
//       previewUrl: nodemailer.getTestMessageUrl(info) // For testing with ethereal.email
//     });

//   } catch (error) {
//     console.error('Email sending error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send email: ' + error.message
//     });
//   }
// });

// // GET endpoint to check email status (optional)
// router.get('/email-status', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Email service is running',
//     configured: !!emailConfig.auth.user
//   });
// });

// export default router;


// import express from 'express';
// import nodemailer from 'nodemailer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const router = express.Router();

// // TEMPORARY TEST EMAIL SETUP (Works immediately - no waiting)
// let testTransporter = null;
// let testAccountInfo = null;

// // Function to create test email account
// async function createTestEmailSetup() {
//   try {
//     // Create a fake test email account
//     const testAccount = await nodemailer.createTestAccount();
    
//     testTransporter = nodemailer.createTransporter({
//       host: 'smtp.ethereal.email',
//       port: 587,
//       secure: false,
//       auth: {
//         user: testAccount.user,
//         pass: testAccount.pass
//       }
//     });
    
//     testAccountInfo = testAccount;
//     console.log('Test email account created:', testAccount.user);
    
//     return true;
//   } catch (error) {
//     console.error('Error creating test email:', error);
//     return false;
//   }
// }

// // Initialize test email
// createTestEmailSetup();

// // POST endpoint for sending email (TEST VERSION)
// router.post('/send-mail', async (req, res) => {
//   try {
//     const { to, subject, text, html, pdfFile } = req.body;

//     // Validate required fields
//     if (!to || !subject) {
//       return res.status(400).json({
//         success: false,
//         message: 'Recipient email (to) and subject are required'
//       });
//     }

//     // Make sure test transporter is ready
//     if (!testTransporter) {
//       await createTestEmailSetup();
//     }

//     // Email options
//     const mailOptions = {
//       from: '"CRM System" <noreply@crm-system.com>',
//       to: to,
//       subject: subject,
//       text: text || 'No text content provided',
//       html: html || `<p>${text || 'No content provided'}</p>`,
//       attachments: []
//     };

//     // Add PDF attachment if provided
//     if (pdfFile) {
//       const filePath = path.join(__dirname, '../uploads/resumes/', pdfFile);
      
//       if (fs.existsSync(filePath)) {
//         mailOptions.attachments.push({
//           filename: pdfFile,
//           path: filePath,
//           contentType: 'application/pdf'
//         });
//       } else {
//         console.warn(`File not found: ${filePath}`);
//       }
//     }

//     // Send email
//     const info = await testTransporter.sendMail(mailOptions);

//     // Get preview URL (you can open this in browser to see the sent email)
//     const previewUrl = nodemailer.getTestMessageUrl(info);
    
//     console.log('Test email sent. Preview URL:', previewUrl);
//     console.log('Test account credentials:', testAccountInfo);
    
//     res.status(200).json({
//       success: true,
//       message: 'Email sent successfully (TEST MODE)',
//       messageId: info.messageId,
//       previewUrl: previewUrl, // ← CLICK THIS LINK to view the sent email
//       testAccount: testAccountInfo.user,
//       note: 'This is a test email. Click previewUrl to view it in browser.'
//     });

//   } catch (error) {
//     console.error('Email sending error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send email: ' + error.message,
//       note: 'Using test email service due to Gmail restrictions'
//     });
//   }
// });

// // GET endpoint to check email status
// router.get('/email-status', async (req, res) => {
//   try {
//     if (!testTransporter) {
//       await createTestEmailSetup();
//     }
    
//     // Verify connection
//     await testTransporter.verify();
    
//     res.status(200).json({
//       success: true,
//       message: 'Test email service is running',
//       configured: true,
//       mode: 'TEST (Ethereal Email)',
//       testAccount: testAccountInfo ? testAccountInfo.user : 'Not initialized',
//       note: 'Using temporary test email service. Gmail is currently restricted.'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Email service error: ' + error.message,
//       configured: false,
//       mode: 'TEST'
//     });
//   }
// });

// // GET endpoint to get test account info
// router.get('/test-account-info', (req, res) => {
//   if (!testAccountInfo) {
//     return res.status(400).json({
//       success: false,
//       message: 'Test account not initialized yet'
//     });
//   }
  
//   res.status(200).json({
//     success: true,
//     testAccount: testAccountInfo.user,
//     testPassword: testAccountInfo.pass,
//     loginUrl: 'https://ethereal.email/login',
//     note: 'You can login to Ethereal Email to view sent messages'
//   });
// });

// export default router;



import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// TEMPORARY TEST EMAIL SETUP (Works immediately - no waiting)
let testTransporter = null;
let testAccountInfo = null;

// Function to create test email account
async function createTestEmailSetup() {
  try {
    // Create a fake test email account
    const testAccount = await nodemailer.createTestAccount();
    
    testTransporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    testAccountInfo = testAccount;
    console.log('Test email account created:', testAccount.user);
    
    return true;
  } catch (error) {
    console.error('Error creating test email:', error);
    return false;
  }
}

// Initialize test email
createTestEmailSetup();

// POST endpoint for sending email (TEST VERSION)
router.post('/send-mail', async (req, res) => {
  try {
    const { to, subject, text, html, pdfFile } = req.body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email (to) and subject are required'
      });
    }

    // Make sure test transporter is ready
    if (!testTransporter) {
      await createTestEmailSetup();
    }

    // Email options
    const mailOptions = {
      from: '"CRM System" <noreply@crm-system.com>',
      to: to,
      subject: subject,
      text: text || 'No text content provided',
      html: html || `<p>${text || 'No content provided'}</p>`,
      attachments: []
    };

    // Add PDF attachment if provided
    if (pdfFile) {
      const filePath = path.join(__dirname, '../uploads/resumes/', pdfFile);
      
      if (fs.existsSync(filePath)) {
        mailOptions.attachments.push({
          filename: pdfFile,
          path: filePath,
          contentType: 'application/pdf'
        });
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }

    // Send email
    const info = await testTransporter.sendMail(mailOptions);

    // Get preview URL (you can open this in browser to see the sent email)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    console.log('Test email sent. Preview URL:', previewUrl);
    console.log('Test account credentials:', testAccountInfo);
    
    res.status(200).json({
      success: true,
      message: 'Email sent successfully (TEST MODE)',
      messageId: info.messageId,
      previewUrl: previewUrl, // ← CLICK THIS LINK to view the sent email
      testAccount: testAccountInfo.user,
      note: 'This is a test email. Click previewUrl to view it in browser.'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email: ' + error.message,
      note: 'Using test email service due to Gmail restrictions'
    });
  }
});

// GET endpoint to check email status
router.get('/email-status', async (req, res) => {
  try {
    if (!testTransporter) {
      await createTestEmailSetup();
    }
    
    // Verify connection
    await testTransporter.verify();
    
    res.status(200).json({
      success: true,
      message: 'Test email service is running',
      configured: true,
      mode: 'TEST (Ethereal Email)',
      testAccount: testAccountInfo ? testAccountInfo.user : 'Not initialized',
      note: 'Using temporary test email service. Gmail is currently restricted.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email service error: ' + error.message,
      configured: false,
      mode: 'TEST'
    });
  }
});

// GET endpoint to get test account info
router.get('/test-account-info', (req, res) => {
  if (!testAccountInfo) {
    return res.status(400).json({
      success: false,
      message: 'Test account not initialized yet'
    });
  }
  
  res.status(200).json({
    success: true,
    testAccount: testAccountInfo.user,
    testPassword: testAccountInfo.pass,
    loginUrl: 'https://ethereal.email/login',
    note: 'You can login to Ethereal Email to view sent messages'
  });
});

export default router;