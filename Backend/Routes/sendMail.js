const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const router = express.Router();

router.post("/send-mail", async (req, res) => {
  const { to, subject, text, pdfFile } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // or SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      attachments: [
        {
          filename: path.basename(pdfFile),
          path: path.join(__dirname, "../uploads", pdfFile),
        },
      ],
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
