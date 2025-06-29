import express from 'express';
import { sendPackageDetailsEmail } from '../utils/emailService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/send', auth, async (req, res) => {
  try {
    const { to, cc, from, subject, body, leadId, packages, userData } = req.body;

    // Send email using the sendPackageDetailsEmail function
    const emailSent = await sendPackageDetailsEmail(userData, packages, {
      from: from,
      to: to,
      cc: cc,
      subject: subject,
      customBody: body
    });

    if (emailSent) {
      res.json({
        success: true,
        message: 'Email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Error in /email/send:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 