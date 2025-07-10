
# Lead Management Backend

A comprehensive Node.js backend for the Lead Management with Agentic AI system.

## Features

- **RESTful API** for lead management (CRUD operations)
- **File Upload & OCR** processing (PDF via Poppler, Images via Tesseract.js)
- **Email Integration** with Gmail SMTP
- **CSV Data Storage** with automatic backup
- **Workflow Automation** endpoints
- **AI Integration** ready (Gemini API placeholder)
- **Comprehensive Error Handling** and logging
- **Input Validation** and sanitization

## Quick Start

### 1. Setup
```bash
# Install dependencies
npm install

# Run setup script
node setup.js

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file with your credentials:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
GEMINI_API_KEY=your-gemini-api-key
PORT=3001
```

### 3. Gmail SMTP Setup
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account Settings → Security → App Passwords
3. Generate a new App Password for "Mail"
4. Use this App Password in your `.env` file (not your regular password)

### 4. Install System Dependencies
For PDF processing (Ubuntu/Debian):
```bash
sudo apt-get install poppler-utils
```

For PDF processing (macOS):
```bash
brew install poppler
```

### 5. Start Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on http://localhost:3001

## API Endpoints

### Lead Management
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Email & Communication
- `POST /api/leads/:id/email` - Send email to lead

### File Processing
- `POST /api/upload` - Upload and process documents (PDF/Images)

### Workflow Automation
- `POST /api/workflow/execute` - Execute workflow automation

### AI Integration
- `POST /api/ai/analyze` - AI lead analysis (Gemini integration)

### Health Check
- `GET /api/health` - Server health status

## Data Storage

Leads are stored in `leads.csv` with the following structure:
```csv
id,name,email,phone,status,source,createdAt
uuid,John Doe,john@example.com,+1234567890,New,Manual,2024-01-01T00:00:00.000Z
```

### Lead Status Options
- `New` - Newly created lead
- `Contacted` - Lead has been contacted

### Lead Source Options
- `Manual` - Manually entered lead
- `Document` - Extracted from uploaded document

## File Processing

### Supported Formats
- **PDF**: Text extraction using Poppler utilities
- **Images**: OCR using Tesseract.js (PNG, JPG, JPEG, GIF, BMP, TIFF)

### Lead Extraction
The system automatically extracts:
- **Names**: First and last name patterns
- **Emails**: Valid email addresses
- **Phone Numbers**: Various phone number formats

## Error Handling

The API provides comprehensive error responses:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (processing error)
- `500` - Internal Server Error

## Security Features

- **CORS** configured for frontend integration
- **File validation** (type and size limits)
- **Input sanitization** for CSV safety
- **Email validation** using regex patterns
- **Duplicate prevention** for email addresses

## Workflow Automation

### Supported Actions
- `send_email` - Send emails to multiple leads
- `update_status` - Update lead status in batch

### Example Workflow Request
```json
{
  "action": "send_email",
  "leadIds": ["uuid1", "uuid2"],
  "emailTemplate": {
    "subject": "Welcome {{name}}!",
    "message": "Hello {{name}}, welcome to our service!"
  }
}
```

## AI Integration

The system is ready for Gemini AI integration. Update the `/api/ai/analyze` endpoint with your Gemini API implementation.

### Example AI Request
```json
{
  "leadId": "uuid",
  "query": "Suggest follow-up actions for this lead"
}
```

## Performance & Limits

- **File Upload**: 10MB maximum file size
- **Request Timeout**: 30 seconds (60 seconds for file processing)
- **Concurrent Processing**: Handled with proper error boundaries
- **Memory Management**: Automatic file cleanup after processing

## Logging

The server provides detailed console logging:
- Request/response logging
- File processing progress
- Error tracking
- Workflow execution status

## Development

### File Structure
```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── setup.js          # Setup script
├── leads.csv         # Data storage
├── uploads/          # Temporary file storage
└── .env             # Environment variables
```

### Adding New Features
1. Add route handlers in `server.js`
2. Implement error handling
3. Add input validation
4. Update this README

## Troubleshooting

### Common Issues

**1. "Network Error" from frontend**
- Ensure server is running on port 3001
- Check CORS configuration
- Verify backend URL in frontend

**2. "Email service not configured"**
- Verify Gmail credentials in `.env`
- Check App Password (not regular password)
- Ensure 2FA is enabled on Gmail

**3. "Failed to extract text from PDF"**
- Install poppler-utils system dependency
- Check PDF file is not corrupted
- Ensure PDF contains selectable text

**4. "OCR processing failed"**
- Check image file format is supported
- Ensure image quality is sufficient
- Try with different image files

### Debug Mode
Set `NODE_ENV=development` in `.env` for detailed error messages and stack traces.

## License

MIT License - see LICENSE file for details.
