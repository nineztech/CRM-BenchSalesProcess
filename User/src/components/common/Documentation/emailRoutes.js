import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Test Email Configuration (Works immediately)
let testTransporter = null;
let testAccount = null;

// Initialize test email transporter
async function initTestEmail() {
  try {
    testAccount = await nodemailer.createTestAccount();
    
    testTransporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('Test email account created:', testAccount.user);
    return true;
  } catch (error) {
    console.error('Error creating test email:', error);
    return false;
  }
}

// Initialize test email on server start
initTestEmail();

// Send email endpoint
router.post('/send-mail', async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email and subject are required'
      });
    }

    // Make sure transporter is ready
    if (!testTransporter) {
      await initTestEmail();
    }

    const mailOptions = {
      from: '"CRM System" <noreply@crm.com>',
      to: to,
      subject: subject,
      text: text || 'No content provided',
      html: `<p>${text || 'No content provided'}</p>`
    };

    const info = await testTransporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      previewUrl: previewUrl,
      testAccount: testAccount.user,
      note: 'This is a test email. Click the previewUrl to view it.'
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email: ' + error.message
    });
  }
});

// Check email status
router.get('/email-status', async (req, res) => {
  try {
    if (!testTransporter) {
      await initTestEmail();
    }
    
    await testTransporter.verify();
    
    res.status(200).json({
      success: true,
      message: 'Email service is ready',
      mode: 'Test (Ethereal Email)',
      testAccount: testAccount?.user || 'Not initialized'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email service error: ' + error.message
    });
  }
});

export default router;