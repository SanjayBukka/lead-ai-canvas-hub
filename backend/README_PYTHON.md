
# Lead Management Python Backend

A comprehensive Python Flask backend for the Lead Management with Agentic AI system.

## Features

- **RESTful API** for lead management (CRUD operations)
- **File Upload & OCR** processing (PDF via PyPDF2, Images via Tesseract)
- **Email Integration** with Gmail SMTP
- **CSV Data Storage** with pandas
- **Workflow Automation** endpoints
- **AI Integration** ready (Gemini API placeholder)
- **Comprehensive Error Handling** and logging
- **Input Validation** and sanitization

## Quick Start

### 1. Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run setup script
python setup.py

# Copy environment template
cp .env.example .env
```

### 2. System Dependencies
For OCR processing:

Ubuntu/Debian:
```bash
sudo apt-get install tesseract-ocr
```

macOS:
```bash
brew install tesseract
```

Windows:
- Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
- Add to PATH

### 3. Configure Environment
Edit `.env` file with your credentials:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Gmail SMTP Setup
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account Settings → Security → App Passwords
3. Generate a new App Password for "Mail"
4. Use this App Password in your `.env` file (not your regular password)

### 5. Start Server
```bash
# Development mode
python app.py
```

The server will start on http://localhost:3001

## Testing the Backend

Run the comprehensive test suite:
```bash
python test_backend.py
```

This will test all endpoints and verify:
- ✅ Health check
- ✅ CRUD operations for leads
- ✅ Email functionality
- ✅ Workflow automation
- ✅ AI analysis
- ✅ File processing capabilities

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

Leads are stored in `leads.csv` using pandas:
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
- **PDF**: Text extraction using PyPDF2
- **Images**: OCR using Tesseract (PNG, JPG, JPEG, GIF, BMP, TIFF)

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
- **Concurrent Processing**: Handled with Flask's built-in capabilities
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
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── setup.py           # Setup script
├── test_backend.py    # Comprehensive test suite
├── leads.csv          # Data storage
├── uploads/           # Temporary file storage
└── .env              # Environment variables
```

### Adding New Features
1. Add route handlers in `app.py`
2. Implement error handling
3. Add input validation
4. Update tests in `test_backend.py`
5. Update this README

## Troubleshooting

### Common Issues

**1. "Network Error" from frontend**
- Ensure server is running: `python app.py`
- Check server is accessible on port 3001
- Verify CORS configuration

**2. "Email service not configured"**
- Verify Gmail credentials in `.env`
- Check App Password (not regular password)
- Ensure 2FA is enabled on Gmail

**3. "Failed to extract text from PDF"**
- Check PDF file is not corrupted
- Ensure PDF contains selectable text
- Try with different PDF files

**4. "OCR processing failed"**
- Install Tesseract: `sudo apt-get install tesseract-ocr`
- Check image file format is supported
- Ensure image quality is sufficient

**5. "Module not found" errors**
- Install dependencies: `pip install -r requirements.txt`
- Check Python version (3.8+ recommended)

### Debug Mode
The Flask app runs in debug mode by default for detailed error messages and auto-reload.

### Testing Individual Endpoints
Use the test script to verify specific functionality:
```bash
python test_backend.py
```

## Comparison with Node.js Backend

### Advantages of Python Backend:
- **Better OCR**: More robust Tesseract integration
- **Data Processing**: Pandas for CSV handling
- **AI Integration**: Better ecosystem for AI/ML
- **Testing**: Comprehensive test suite included
- **Error Handling**: More explicit error types
- **Logging**: Better structured logging

### Migration Notes:
- Same API endpoints and response formats
- Compatible with existing React frontend
- Environment variables remain the same
- File processing is more reliable
- Better memory management for large files

## License

MIT License - see LICENSE file for details.
