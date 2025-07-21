import multer from 'multer';
import path from 'path';

// Configure storage for resumes
const resumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Ensure forward slashes and proper path
    const filename = 'resume-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

// Validate file type for resumes
const resumeFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

export const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}); 