import express from 'express';
import { sendPackageDetailsEmail } from '../utils/emailService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get email template preview
router.get('/template-preview', auth, async (req, res) => {
  try {
    const { userData, packages } = req.query;
    
    // Parse the JSON strings if they exist
    const parsedUserData = userData ? JSON.parse(userData) : { 
      firstName: 'Preview', 
      lastName: 'User', 
      email: 'preview@example.com' 
    };
    const parsedPackages = packages ? JSON.parse(packages) : [];

    // Generate the email template HTML
    const templateHtml = await sendPackageDetailsEmail(
      parsedUserData,
      parsedPackages,
      { previewOnly: true } // This flag will make the function return the HTML without sending
    );

    res.json({
      success: true,
      template: templateHtml
    });
  } catch (error) {
    console.error('Error getting template preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get template preview'
    });
  }
});


// Send email
router.post('/send', auth, async (req, res) => {
  try {
    const { userData, packages, emailOptions } = req.body;
    const success = await sendPackageDetailsEmail(userData, packages, emailOptions);
    
    if (success) {
      res.json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

export default router; 