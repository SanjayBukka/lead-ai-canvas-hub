
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const Tesseract = require('tesseract.js');
const { exec } = require('child_process');
const util = require('util');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// CSV file handling
const CSV_FILE = 'leads.csv';
const CSV_HEADERS = 'id,name,email,phone,status,source,createdAt\n';

async function initializeCSV() {
  try {
    await fs.access(CSV_FILE);
  } catch (error) {
    await fs.writeFile(CSV_FILE, CSV_HEADERS);
  }
}

async function readLeadsFromCSV() {
  try {
    const data = await fs.readFile(CSV_FILE, 'utf8');
    const lines = data.trim().split('\n');
    
    if (lines.length <= 1) return [];
    
    const headers = lines[0].split(',');
    const leads = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const lead = {};
      headers.forEach((header, index) => {
        lead[header] = values[index] || '';
      });
      leads.push(lead);
    }
    
    return leads;
  } catch (error) {
    console.error('Error reading CSV:', error);
    return [];
  }
}

async function writeLeadsToCSV(leads) {
  try {
    let csvContent = CSV_HEADERS;
    
    leads.forEach(lead => {
      csvContent += `${lead.id},${lead.name},${lead.email},${lead.phone},${lead.status},${lead.source},${lead.createdAt}\n`;
    });
    
    await fs.writeFile(CSV_FILE, csvContent);
  } catch (error) {
    console.error('Error writing CSV:', error);
    throw error;
  }
}

// Gmail SMTP Configuration
// Replace with your Gmail credentials
const gmailConfig = {
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your Gmail
    pass: 'your-app-password' // Replace with your Gmail App Password
  }
};

const transporter = nodemailer.createTransporter(gmailConfig);

// Text extraction from PDF using poppler
async function extractTextFromPDF(filePath) {
  const execAsync = util.promisify(exec);
  try {
    // Using pdftotext from poppler-utils
    const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
    return stdout;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Text extraction from images using Tesseract
async function extractTextFromImage(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    return text;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Extract lead information from text using simple regex patterns
function extractLeadInfo(text) {
  const leads = [];
  const lines = text.split('\n');
  
  // Simple patterns for email and phone
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const nameRegex = /^[A-Z][a-z]+\s+[A-Z][a-z]+/gm;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  const names = text.match(nameRegex) || [];
  
  // Try to match names with emails/phones
  const maxLeads = Math.max(emails.length, names.length);
  
  for (let i = 0; i < maxLeads; i++) {
    const lead = {
      name: names[i] || `Lead ${i + 1}`,
      email: emails[i] || '',
      phone: phones[i] || ''
    };
    
    if (lead.email) {
      leads.push(lead);
    }
  }
  
  return leads;
}

// Routes

// Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await readLeadsFromCSV();
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Add new lead
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, status, source } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const newLead = {
      id: uuidv4(),
      name,
      email,
      phone: phone || '',
      status: status || 'New',
      source: source || 'Manual',
      createdAt: new Date().toISOString()
    };
    
    const leads = await readLeadsFromCSV();
    leads.push(newLead);
    await writeLeadsToCSV(leads);
    
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error adding lead:', error);
    res.status(500).json({ error: 'Failed to add lead' });
  }
});

// Update lead
app.put('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const leads = await readLeadsFromCSV();
    const leadIndex = leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    leads[leadIndex] = { ...leads[leadIndex], ...updates };
    await writeLeadsToCSV(leads);
    
    res.json(leads[leadIndex]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const leads = await readLeadsFromCSV();
    const filteredLeads = leads.filter(lead => lead.id !== id);
    
    if (leads.length === filteredLeads.length) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    await writeLeadsToCSV(filteredLeads);
    
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Send email to lead
app.post('/api/leads/:id/email', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;
    
    const leads = await readLeadsFromCSV();
    const lead = leads.find(l => l.id === id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Gmail SMTP configuration
    const mailOptions = {
      from: gmailConfig.auth.user,
      to: lead.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${lead.name},</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            Your Lead Management Team
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    // Update lead status to Contacted
    const leadIndex = leads.findIndex(l => l.id === id);
    if (leadIndex !== -1) {
      leads[leadIndex].status = 'Contacted';
      await writeLeadsToCSV(leads);
    }
    
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// File upload and processing
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    
    let extractedText = '';
    
    // Process based on file type
    if (fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else if (fileType.startsWith('image/')) {
      extractedText = await extractTextFromImage(filePath);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    
    // Extract lead information
    const extractedLeads = extractLeadInfo(extractedText);
    
    // Clean up uploaded file
    await fs.unlink(filePath);
    
    res.json({
      leads: extractedLeads,
      extractedText: extractedText.substring(0, 500) + '...' // First 500 chars for debugging
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Gemini AI Integration endpoint (placeholder)
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { leadId, query } = req.body;
    
    // TODO: Integrate with Gemini API here
    // const geminiResponse = await callGeminiAPI(leadId, query);
    
    // Placeholder response
    const response = {
      analysis: 'AI analysis placeholder - integrate Gemini API here',
      suggestions: [
        'Send follow-up email within 24 hours',
        'Schedule a call to discuss their specific needs',
        'Send relevant case studies or product information'
      ],
      leadScore: Math.floor(Math.random() * 100),
      recommendedActions: [
        'immediate_follow_up',
        'send_resources',
        'schedule_call'
      ]
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({ error: 'Failed to analyze lead' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Lead Management API is running'
  });
});

// Initialize server
async function startServer() {
  try {
    await ensureDirectoryExists('uploads');
    await initializeCSV();
    
    app.listen(PORT, () => {
      console.log(`🚀 Lead Management API running on port ${PORT}`);
      console.log(`📊 CSV file: ${CSV_FILE}`);
      console.log(`📧 Gmail SMTP: ${gmailConfig.auth.user}`);
      console.log(`🤖 AI Integration: Ready for Gemini API`);
      console.log(`\n🔗 API Endpoints:`);
      console.log(`   GET    /api/leads`);
      console.log(`   POST   /api/leads`);
      console.log(`   PUT    /api/leads/:id`);
      console.log(`   DELETE /api/leads/:id`);
      console.log(`   POST   /api/leads/:id/email`);
      console.log(`   POST   /api/upload`);
      console.log(`   POST   /api/ai/analyze`);
      console.log(`   GET    /api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
