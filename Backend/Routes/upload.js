// import express from "express";
// import multer from "multer";
// import cors from "cors";
// import path from "path";
// import fs from "fs";

// const app = express();

// // Enable CORS for your frontend
// app.use(cors({
//   origin: "http://localhost:4000/documentation", // or your frontend port
//   credentials: true
// }));

// app.use(express.json());

// // Ensure uploads directory exists
// const uploadsDir = "uploads";
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // folder where PDFs will be stored
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ 
//   storage,
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === "application/pdf") {
//       cb(null, true);
//     } else {
//       cb(new Error("Only PDF files are allowed!"), false);
//     }
//   },
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   }
// });

// // Upload PDF endpoint
// app.post("/upload-pdf", upload.single("pdf"), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false,
//         message: "No file uploaded" 
//       });
//     }
    
//     res.json({
//       success: true,
//       message: "File uploaded successfully",
//       filename: req.file.filename,
//       originalname: req.file.originalname,
//       size: req.file.size
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ 
//       success: false,
//       message: "Upload failed",
//       error: error.message 
//     });
//   }
// });

// // Send mail endpoint (you'll need to implement this with nodemailer)
// app.post("/send-mail", async (req, res) => {
//   try {
//     const { to, subject, text, pdfFile } = req.body;
    
//     // TODO: Implement email sending with nodemailer
//     // For now, just simulate success
//     console.log("Email would be sent to:", to);
//     console.log("PDF file:", pdfFile);
    
//     res.json({
//       success: true,
//       message: "Email sent successfully"
//     });
//   } catch (error) {
//     console.error("Email error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Email sending failed",
//       error: error.message
//     });
//   }
// });

// // Serve uploaded files
// app.use('/uploads', express.static('uploads'));

// // Error handling middleware
// app.use((error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File too large. Maximum size is 10MB.'
//       });
//     }
//   }
  
//   res.status(500).json({
//     success: false,
//     message: 'Something went wrong!',
//     error: error.message
//   });
// });

// const PORT = process.env.PORT || 5006;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const router = express.Router();

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = 'uploads/resumes/';
    
//     // Create directory if it doesn't exist
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
    
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     // Generate a unique filename with timestamp
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // File filter for PDFs only
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/pdf') {
//     cb(null, true);
//   } else {
//     cb(new Error('Only PDF files are allowed'), false);
//   }
// };

// const upload = multer({ 
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   }
// });

// // POST endpoint for uploading PDF
// router.post('/upload-pdf', upload.single('pdf'), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'No file uploaded'
//       });
//     }

//     // Success response
//     res.status(200).json({
//       success: true,
//       message: 'File uploaded successfully',
//       filename: req.file.filename,
//       path: req.file.path,
//       originalName: req.file.originalname
//     });
//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error uploading file'
//     });
//   }
// });

// // GET endpoint to serve uploaded PDFs
// router.get('/pdf/:filename', (req, res) => {
//   try {
//     const filename = req.params.filename;
//     const filePath = path.join(__dirname, '../uploads/resumes/', filename);
    
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({
//         success: false,
//         message: 'File not found'
//       });
//     }
    
//     res.sendFile(filePath);
//   } catch (error) {
//     console.error('File retrieval error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error retrieving file'
//     });
//   }
// });

// // DELETE endpoint to remove uploaded PDFs
// router.delete('/pdf/:filename', (req, res) => {
//   try {
//     const filename = req.params.filename;
//     const filePath = path.join(__dirname, '../uploads/resumes/', filename);
    
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({
//         success: false,
//         message: 'File not found'
//       });
//     }
    
//     fs.unlinkSync(filePath);
    
//     res.status(200).json({
//       success: true,
//       message: 'File deleted successfully'
//     });
//   } catch (error) {
//     console.error('File deletion error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting file'
//     });
//   }
// });

// export default router;



import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/resumes/';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for PDFs only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Increase file size limit to 20MB (20 * 1024 * 1024)
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit (increased from 10MB)
    files: 1, // Limit to 1 file
    fields: 10 // Limit number of non-file fields
  }
});

// POST endpoint for uploading PDF
router.post('/upload-pdf', (req, res, next) => {
  // Use multer upload handler
  upload.single('pdf')(req, res, function (err) {
    if (err) {
      console.error('Upload error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 20MB.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Only one file allowed.'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field. Please use "pdf" as field name.'
          });
        }
      }
      
      if (err.message === 'Only PDF files are allowed') {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error uploading file: ' + err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: req.file.path,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

// GET endpoint to check upload configuration
router.get('/upload-config', (req, res) => {
  res.status(200).json({
    success: true,
    config: {
      maxFileSize: '20MB',
      allowedTypes: ['application/pdf'],
      fieldName: 'pdf'
    }
  });
});

// GET endpoint to serve uploaded PDFs
router.get('/pdf/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/resumes/', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving file'
    });
  }
});

// DELETE endpoint to remove uploaded PDFs
router.delete('/pdf/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/resumes/', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
});

export default router;