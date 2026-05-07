const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const { generateText } = require('../config/ai');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/lab-reports');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDF files are allowed'));
  }
}).single('file');

/**
 * Upload lab report
 */
exports.uploadLabReport = (req, res, next) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      const { patientId, appointmentId, testType } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Report file is required'
        });
      }

      const labReport = await LabReport.create({
        patientId,
        appointmentId: appointmentId || undefined,
        uploadedBy: req.user._id,
        testType: testType || 'General Lab Test',
        filePath: `/uploads/lab-reports/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.json({
        success: true,
        data: labReport,
      });
    } catch (error) {
      next(error);
    }
  });
};

/**
 * Add manual test results
 */
exports.addTestResults = async (req, res) => {
  const { id } = req.params;
  const { testResults } = req.body;
  
  const labReport = await LabReport.findById(id);
  if (!labReport) {
    throw new ApiError(404, 'Lab report not found');
  }

  labReport.testResults = testResults;
  await labReport.save();

  res.json({
    success: true,
    data: labReport,
  });
};

/**
 * AI analyze lab report
 */
exports.analyzeLabReport = async (req, res) => {
  const { id } = req.params;
  
  const labReport = await LabReport.findById(id).populate('patientId');
  if (!labReport) {
    throw new ApiError(404, 'Lab report not found');
  }

  if (!labReport.testResults || labReport.testResults.length === 0) {
    throw new ApiError(400, 'No test results to analyze');
  }

  try {
    const prompt = `Analyze the following lab test results and provide a clinical summary:

Patient Age: ${labReport.patientId.dateOfBirth ? Math.floor((Date.now() - new Date(labReport.patientId.dateOfBirth)) / 31557600000) : 'Unknown'}
Gender: ${labReport.patientId.gender || 'Unknown'}
Report Type: ${labReport.reportType}

Test Results:
${labReport.testResults.map(t => `${t.testName}: ${t.value} ${t.unit || ''} (Reference: ${t.referenceRange || 'N/A'}) ${t.flag !== 'normal' ? `[${t.flag.toUpperCase()}]` : ''}`).join('\n')}

Provide:
1. A brief summary (2-3 sentences)
2. List of abnormal findings with clinical significance
3. Recommendations for the doctor

Format as JSON:
{
  "summary": "Brief overview",
  "abnormalFindings": ["Finding 1", "Finding 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const messages = [
      { role: 'system', content: 'You are a clinical pathologist assistant. Analyze lab results and provide actionable insights for doctors.' },
      { role: 'user', content: prompt }
    ];

    const response = await generateText(messages, { temperature: 0.3, maxTokens: 500 });
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      summary: 'Analysis completed',
      abnormalFindings: [],
      recommendations: []
    };

    labReport.aiAnalysis = {
      ...analysis,
      analyzedAt: new Date(),
    };
    await labReport.save();

    res.json({
      success: true,
      data: labReport,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new ApiError(500, 'Failed to analyze lab report');
  }
};

/**
 * Get patient lab reports
 */
exports.getPatientLabReports = async (req, res) => {
  const { patientId } = req.params;
  
  const reports = await LabReport.find({ patientId })
    .populate('uploadedBy', 'firstName lastName')
    .populate('reviewedBy', 'firstName lastName')
    .sort({ reportDate: -1 });

  res.json({
    success: true,
    data: reports,
  });
};

/**
 * Get single lab report
 */
exports.getLabReport = async (req, res) => {
  const { id } = req.params;
  
  const report = await LabReport.findById(id)
    .populate('patientId')
    .populate('uploadedBy', 'firstName lastName')
    .populate('reviewedBy', 'firstName lastName');

  if (!report) {
    throw new ApiError(404, 'Lab report not found');
  }

  res.json({
    success: true,
    data: report,
  });
};

/**
 * Mark report as reviewed
 */
exports.markAsReviewed = async (req, res) => {
  const { id } = req.params;
  
  const report = await LabReport.findById(id);
  if (!report) {
    throw new ApiError(404, 'Lab report not found');
  }

  report.isReviewed = true;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();
  await report.save();

  res.json({
    success: true,
    data: report,
  });
};
