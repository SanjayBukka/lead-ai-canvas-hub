
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
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Configure multer for file uploads with better error handling
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await ensureDirectoryExists('uploads/');
      cb(null, 'uploads/');
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  }
});

// Create uploads directory if it doesn't exist
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
    console.log(`Directory ${dirPath} exists`);
  } catch (error) {
    console.log(`Creating directory ${dirPath}`);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// CSV file handling with better error management
const CSV_FILE = 'leads.csv';
const CSV_HEADERS = 'id,name,email,phone,status,source,createdAt\n';

async function initializeCSV() {
  try {
    await fs.access(CSV_FILE);
    console.log('CSV file exists');
  } catch (error) {
    console.log('Creating new CSV file');
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
      if (lines[i].trim()) { // Skip empty lines
        const values = lines[i].split(',');
        const lead = {};
        headers.forEach((header, index) => {
          lead[header] = values[index] || '';
        });
        leads.push(lead);
      }
    }
    
    console.log(`Read ${leads.length} leads from CSV`);
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
      // Escape commas and quotes in data
      const escapedLead = {
        id: lead.id || '',
        name: (lead.name || '').replace(/,/g, ';'),
        email: lead.email || '',
        phone: (lead.phone || '').replace(/,/g, ';'),
        status: lead.status || 'New',
        source: lead.source || 'Manual',
        createdAt: lead.createdAt || new Date().toISOString()
      };
      
      csvContent += `${escapedLead.id},${escapedLead.name},${escapedLead.email},${escapedLead.phone},${escapedLead.status},${escapedLead.source},${escapedLead.createdAt}\n`;
    });
    
    await fs.writeFile(CSV_FILE, csvContent);
    console.log(`Wrote ${leads.length} leads to CSV`);
  } catch (error) {
    console.error('Error writing CSV:', error);
    throw error;
  }
}

// Gmail SMTP Configuration
const gmailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com', // Replace with your Gmail
    pass: process.env.GMAIL_PASS || 'your-app-password' // Replace with your Gmail App Password
  }
};

let transporter;
try {
  transporter = nodemailer.createTransporter(gmailConfig);
} catch (error) {
  console.error('Error creating email transporter:', error);
}

// Text extraction from PDF using poppler with better error handling
async function extractTextFromPDF(filePath) {
  const execAsync = util.promisify(exec);
  try {
    console.log(`Extracting text from PDF: ${filePath}`);
    const { stdout, stderr } = await execAsync(`pdftotext "${filePath}" -`);
    if (stderr) {
      console.warn('PDF extraction warning:', stderr);
    }
    return stdout || '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Text extraction from images using Tesseract with better error handling
async function extractTextFromImage(filePath) {
  try {
    console.log(`Extracting text from image: ${filePath}`);
    const { data: { text, confidence } } = await Tesseract.recognize(filePath, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    console.log(`OCR completed with confidence: ${confidence}`);
    return text || '';
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

// Enhanced lead information extraction with better regex patterns
function extractLeadInfo(text) {
  console.log('Extracting lead information from text...');
  const leads = [];
  
  try {
    // More comprehensive regex patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?(?:[0-9]{3})\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}|(?:\+?[1-9]\d{0,3}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    const nameRegex = /(?:^|\n)([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gm;
    
    const emails = [...new Set((text.match(emailRegex) || []))]; // Remove duplicates
    const phones = [...new Set((text.match(phoneRegex) || []).filter(phone => phone.length >= 10))];
    const nameMatches = text.match(nameRegex) || [];
    const names = [...new Set(nameMatches.map(name => name.trim()))];
    
    console.log(`Found: ${emails.length} emails, ${phones.length} phones, ${names.length} names`);
    
    // Create leads by matching emails with names and phones
    emails.forEach((email, index) => {
      const lead = {
        name: names[index] || names[0] || `Lead ${index + 1}`,
        email: email,
        phone: phones[index] || phones[0] || ''
      };
      
      // Only add if we have a valid email
      if (lead.email && lead.email.includes('@')) {
        leads.push(lead);
      }
    });
    
    // If we have more names than emails, create leads with names only
    if (names.length > emails.length) {
      for (let i = emails.length; i < names.length && i < emails.length + 3; i++) {
        leads.push({
          name: names[i],
          email: `${names[i].toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: phones[i] || ''
        });
      }
    }
    
    console.log(`Extracted ${leads.length} leads`);
    return leads;
  } catch (error) {
    console.error('Error extracting lead info:', error);
    return [];
  }
}

// Routes with comprehensive error handling

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Lead Management API is running',
    version: '1.0.0'
  });
});

// Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    console.log('Fetching all leads...');
    const leads = await readLeadsFromCSV();
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads',
      message: error.message 
    });
  }
});

// Add new lead
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, status, source } = req.body;
    
    console.log('Adding new lead:', { name, email, phone, status, source });
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Name and email are required' 
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Invalid email format' 
      });
    }
    
    const newLead = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      status: status || 'New',
      source: source || 'Manual',
      createdAt: new Date().toISOString()
    };
    
    const leads = await readLeadsFromCSV();
    
    // Check for duplicate email
    const existingLead = leads.find(lead => lead.email === newLead.email);
    if (existingLead) {
      return res.status(409).json({ 
        error: 'Duplicate lead',
        message: 'A lead with this email already exists' 
      });
    }
    
    leads.push(newLead);
    await writeLeadsToCSV(leads);
    
    console.log('Lead added successfully:', newLead.id);
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error adding lead:', error);
    res.status(500).json({ 
      error: 'Failed to add lead',
      message: error.message 
    });
  }
});

// Update lead
app.put('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Updating lead:', id, updates);
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Lead ID is required' 
      });
    }
    
    const leads = await readLeadsFromCSV();
    const leadIndex = leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      return res.status(404).json({ 
        error: 'Lead not found',
        message: `No lead found with ID: ${id}` 
      });
    }
    
    // Validate email if being updated
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Invalid email format' 
        });
      }
      updates.email = updates.email.trim().toLowerCase();
    }
    
    leads[leadIndex] = { ...leads[leadIndex], ...updates };
    await writeLeadsToCSV(leads);
    
    console.log('Lead updated successfully:', id);
    res.json(leads[leadIndex]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ 
      error: 'Failed to update lead',
      message: error.message 
    });
  }
});

// Delete lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting lead:', id);
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Lead ID is required' 
      });
    }
    
    const leads = await readLeadsFromCSV();
    const filteredLeads = leads.filter(lead => lead.id !== id);
    
    if (leads.length === filteredLeads.length) {
      return res.status(404).json({ 
        error: 'Lead not found',
        message: `No lead found with ID: ${id}` 
      });
    }
    
    await writeLeadsToCSV(filteredLeads);
    
    console.log('Lead deleted successfully:', id);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ 
      error: 'Failed to delete lead',
      message: error.message 
    });
  }
});

// Send email to lead
app.post('/api/leads/:id/email', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;
    
    console.log('Sending email to lead:', id);
    
    if (!subject || !message) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Subject and message are required' 
      });
    }
    
    const leads = await readLeadsFromCSV();
    const lead = leads.find(l => l.id === id);
    
    if (!lead) {
      return res.status(404).json({ 
        error: 'Lead not found',
        message: `No lead found with ID: ${id}` 
      });
    }
    
    if (!transporter) {
      return res.status(500).json({ 
        error: 'Email service unavailable',
        message: 'Email service is not configured' 
      });
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
    
    console.log('Email sent successfully to:', lead.email);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      message: error.message 
    });
  }
});

// File upload and processing with comprehensive error handling
app.post('/api/upload', upload.single('file'), async (req, res) => {
  let filePath;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a file to upload' 
      });
    }
    
    filePath = req.file.path;
    const fileType = req.file.mimetype;
    const fileSize = req.file.size;
    
    console.log(`Processing file: ${req.file.originalname}, Type: ${fileType}, Size: ${fileSize} bytes`);
    
    let extractedText = '';
    
    // Process based on file type
    if (fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else if (fileType.startsWith('image/')) {
      extractedText = await extractTextFromImage(filePath);
    } else {
      return res.status(400).json({ 
        error: 'Unsupported file type',
        message: `File type ${fileType} is not supported. Please upload PDF or image files.` 
      });
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({ 
        error: 'No text found',
        message: 'Could not extract any text from the uploaded file' 
      });
    }
    
    // Extract lead information
    const extractedLeads = extractLeadInfo(extractedText);
    
    if (extractedLeads.length === 0) {
      return res.status(422).json({ 
        error: 'No leads found',
        message: 'Could not extract any lead information from the document',
        extractedText: extractedText.substring(0, 500) + '...'
      });
    }
    
    console.log(`Successfully extracted ${extractedLeads.length} leads`);
    
    res.json({
      leads: extractedLeads,
      extractedText: extractedText.substring(0, 500) + '...', // First 500 chars for debugging
      fileInfo: {
        name: req.file.originalname,
        type: fileType,
        size: fileSize
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ 
      error: 'Failed to process file',
      message: error.message 
    });
  } finally {
    // Clean up uploaded file
    if (filePath) {
      try {
        await fs.unlink(filePath);
        console.log('Cleaned up uploaded file:', filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
  }
});

// Gemini AI Integration endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { leadId, query } = req.body;
    
    console.log('AI analysis request:', { leadId, query });
    
    if (!leadId || !query) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Lead ID and query are required' 
      });
    }
    
    const leads = await readLeadsFromCSV();
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
      return res.status(404).json({ 
        error: 'Lead not found',
        message: `No lead found with ID: ${leadId}` 
      });
    }
    
    // TODO: Integrate with Gemini API here
    // const geminiResponse = await callGeminiAPI(lead, query);
    
    // Enhanced placeholder response based on lead data
    const response = {
      analysis: `AI analysis for ${lead.name}: Based on their ${lead.source.toLowerCase()} source and ${lead.status.toLowerCase()} status, here are my insights...`,
      suggestions: [
        `Send personalized follow-up email to ${lead.name} within 24 hours`,
        `Schedule a call to discuss ${lead.name}'s specific needs and pain points`,
        `Send relevant case studies or product information based on their industry`,
        lead.phone ? `Call ${lead.name} at ${lead.phone} for immediate engagement` : `Request phone number from ${lead.name} for better communication`
      ],
      leadScore: Math.floor(Math.random() * 40) + 60, // Score between 60-100
      recommendedActions: [
        'immediate_follow_up',
        'send_resources',
        'schedule_call',
        lead.status === 'New' ? 'initial_contact' : 'nurture_relationship'
      ],
      leadData: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: lead.source
      }
    };
    
    console.log('AI analysis completed for lead:', leadId);
    res.json(response);
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze lead',
      message: error.message 
    });
  }
});

// Workflow automation endpoint
app.post('/api/workflow/execute', async (req, res) => {
  try {
    const { action, leadIds, emailTemplate } = req.body;
    
    console.log('Executing workflow:', { action, leadIds: leadIds?.length, emailTemplate: !!emailTemplate });
    
    if (!action || !leadIds || !Array.isArray(leadIds)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Action and leadIds array are required' 
      });
    }
    
    const leads = await readLeadsFromCSV();
    const targetLeads = leads.filter(lead => leadIds.includes(lead.id));
    
    if (targetLeads.length === 0) {
      return res.status(404).json({ 
        error: 'No leads found',
        message: 'None of the specified leads were found' 
      });
    }
    
    const results = [];
    
    switch (action) {
      case 'send_email':
        if (!emailTemplate || !emailTemplate.subject || !emailTemplate.message) {
          return res.status(400).json({ 
            error: 'Validation failed',
            message: 'Email template with subject and message is required' 
          });
        }
        
        for (const lead of targetLeads) {
          try {
            if (transporter) {
              const mailOptions = {
                from: gmailConfig.auth.user,
                to: lead.email,
                subject: emailTemplate.subject.replace('{{name}}', lead.name),
                html: emailTemplate.message.replace('{{name}}', lead.name).replace(/\n/g, '<br>')
              };
              
              await transporter.sendMail(mailOptions);
              results.push({ leadId: lead.id, status: 'sent', email: lead.email });
            } else {
              results.push({ leadId: lead.id, status: 'failed', error: 'Email service not configured' });
            }
          } catch (error) {
            results.push({ leadId: lead.id, status: 'failed', error: error.message });
          }
        }
        break;
        
      case 'update_status':
        const newStatus = req.body.status || 'Contacted';
        const updatedLeads = leads.map(lead => 
          leadIds.includes(lead.id) ? { ...lead, status: newStatus } : lead
        );
        await writeLeadsToCSV(updatedLeads);
        results.push({ action: 'status_updated', count: targetLeads.length, newStatus });
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Invalid action',
          message: `Action '${action}' is not supported` 
        });
    }
    
    console.log('Workflow execution completed:', results);
    res.json({ 
      message: 'Workflow executed successfully',
      results,
      processedLeads: targetLeads.length
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({ 
      error: 'Failed to execute workflow',
      message: error.message 
    });
  }
});

// Initialize server with comprehensive startup checks
async function startServer() {
  try {
    console.log('🚀 Starting Lead Management API...');
    
    // Check and create necessary directories
    await ensureDirectoryExists('uploads');
    console.log('✅ Upload directory ready');
    
    // Initialize CSV file
    await initializeCSV();
    console.log('✅ CSV database ready');
    
    // Test email configuration
    if (transporter) {
      try {
        await transporter.verify();
        console.log('✅ Email service ready');
      } catch (error) {
        console.warn('⚠️  Email service not configured properly:', error.message);
      }
    } else {
      console.warn('⚠️  Email service not configured');
    }
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Lead Management API running on port ${PORT}`);
      console.log(`📊 CSV file: ${CSV_FILE}`);
      console.log(`📧 Gmail SMTP: ${gmailConfig.auth.user}`);
      console.log(`🤖 AI Integration: Ready for Gemini API`);
      console.log(`\n🔗 API Endpoints:`);
      console.log(`   GET    /api/health - Health check`);
      console.log(`   GET    /api/leads - Get all leads`);
      console.log(`   POST   /api/leads - Create new lead`);
      console.log(`   PUT    /api/leads/:id - Update lead`);
      console.log(`   DELETE /api/leads/:id - Delete lead`);
      console.log(`   POST   /api/leads/:id/email - Send email to lead`);
      console.log(`   POST   /api/upload - Upload and process document`);
      console.log(`   POST   /api/ai/analyze - AI lead analysis`);
      console.log(`   POST   /api/workflow/execute - Execute workflow automation`);
      console.log(`\n✅ Server ready to accept connections!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
