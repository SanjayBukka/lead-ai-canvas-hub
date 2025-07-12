
# Lead Management with Agentic AI - Complete Project Documentation

## Project Overview

The **Lead Management with Agentic AI** is a comprehensive web application designed to streamline lead management processes through intelligent automation and AI-powered features. This system combines modern web technologies with AI capabilities to provide an efficient solution for businesses to manage, process, and nurture their leads.

### Key Features
- **Lead Management**: Complete CRUD operations for lead data
- **Document Processing**: OCR-powered document upload and lead extraction
- **Workflow Automation**: Visual workflow builder with React Flow
- **Email Integration**: Automated email communication with leads
- **AI Integration**: Ready for Gemini AI integration for lead analysis
- **Real-time Updates**: Live data synchronization and status updates

---

## Technology Stack

### Frontend
- **React 18.3.1**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development environment
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn/UI**: High-quality component library built on Radix UI
- **React Flow**: Interactive node-based workflow builder
- **Axios**: HTTP client for API communication
- **React Hook Form**: Form handling and validation
- **Lucide React**: Beautiful icon library

### Backend
- **FastAPI**: Modern, fast Python web framework
- **Python 3.8+**: Core backend language
- **Uvicorn**: ASGI server for running FastAPI
- **Pandas**: Data manipulation and CSV handling
- **pdf2image**: PDF to image conversion for OCR
- **Tesseract.js**: OCR (Optical Character Recognition) engine
- **SMTP**: Email integration with Gmail

### File Processing
- **OCR Technology**: Tesseract.js for text extraction from images
- **PDF Processing**: pdf2image + poppler-utils for PDF text extraction
- **File Validation**: Type and size validation for uploaded documents
- **Lead Extraction**: AI-powered extraction of names, emails, and phone numbers

---

## Project Structure

```
lead-management-app/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── setup.py              # Setup script for dependencies
│   ├── test_backend.py       # Backend testing script
│   ├── leads.csv             # Lead data storage
│   └── .env                  # Environment variables
├── src/                       # React frontend
│   ├── components/           # React components
│   │   ├── ui/              # Shadcn UI components
│   │   ├── Header.tsx       # Navigation header
│   │   ├── ImprovedHeader.tsx    # Enhanced header with stats
│   │   ├── LeadForm.tsx     # Lead creation form
│   │   ├── LeadTable.tsx    # Lead data table
│   │   ├── LeadModal.tsx    # Lead details modal
│   │   ├── LeadUpload.tsx   # File upload component
│   │   ├── ImprovedLeadUpload.tsx # Enhanced upload with drag-drop
│   │   └── ReactFlowCanvas.tsx   # Workflow builder
│   ├── hooks/               # Custom React hooks
│   │   └── use-toast.ts     # Toast notification hook
│   ├── lib/                 # Utility functions
│   │   └── utils.ts         # Common utilities
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles and theme
├── public/                   # Static assets
├── package.json             # Frontend dependencies
└── README.md               # Project readme
```

---

## Core Functionality

### 1. Lead Management System

#### Lead Data Structure
```typescript
interface Lead {
  id: string;           // Unique identifier (UUID)
  name: string;         // Lead's full name
  email: string;        // Email address (unique)
  phone: string;        // Phone number
  status: 'New' | 'Contacted';  // Lead status
  source: 'Manual' | 'Document'; // How lead was created
  createdAt: string;    // ISO timestamp
}
```

#### CRUD Operations
- **Create**: Add new leads manually or via document upload
- **Read**: View all leads in a paginated table with search/filter
- **Update**: Edit lead information and status
- **Delete**: Remove leads with confirmation

#### Features
- **Duplicate Prevention**: Email-based duplicate detection
- **Status Management**: Track lead progression (New → Contacted)
- **Source Tracking**: Distinguish between manual and document-extracted leads
- **Search & Filter**: Find leads quickly by name, email, or status

### 2. Document Processing & OCR

#### Supported File Types
- **PDF Documents**: Text extraction using pdf2image + poppler
- **Images**: JPG, PNG, GIF, BMP, TIFF with Tesseract OCR

#### Processing Pipeline
1. **File Upload**: Drag-and-drop or click to upload
2. **Validation**: File type and size validation (10MB limit)
3. **Text Extraction**: OCR processing to extract readable text
4. **Lead Detection**: AI-powered pattern matching for:
   - Names (First and last name patterns)
   - Email addresses (RFC-compliant regex)
   - Phone numbers (Multiple international formats)
5. **Data Cleaning**: Sanitization and validation of extracted data
6. **Lead Creation**: Automatic addition to lead database

#### Error Handling
- Invalid file types
- Corrupted documents
- No text found
- Processing timeouts
- OCR failures

### 3. Workflow Automation

#### Visual Workflow Builder
Built with React Flow, providing:
- **Drag-and-Drop Interface**: Easy workflow creation
- **Node Types**:
  - **Trigger Nodes**: Start workflow conditions
  - **Action Nodes**: Email sending, status updates
  - **Condition Nodes**: Logic branching
- **Real-time Preview**: Live workflow visualization
- **Save/Load**: Persistent workflow storage

#### Supported Actions
- **Send Email**: Bulk email to selected leads with templates
- **Update Status**: Batch status changes
- **Filter Leads**: Conditional lead selection
- **Schedule Actions**: Time-based workflow triggers

#### Template System
- **Email Templates**: Personalized with {{name}}, {{email}} variables
- **Subject Lines**: Dynamic subject generation
- **HTML Support**: Rich text email formatting

### 4. Email Integration

#### Gmail SMTP Configuration
```bash
# Environment variables required
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password  # Not regular password
```

#### Features
- **Template-based Emails**: Personalized content
- **Bulk Sending**: Send to multiple leads simultaneously
- **Error Handling**: Failed delivery tracking
- **Status Updates**: Automatic lead status updates after email

#### Security
- **App Passwords**: Gmail-specific app passwords required
- **TLS Encryption**: Secure email transmission
- **Rate Limiting**: Prevent spam and API limits

### 5. AI Integration (Ready for Gemini)

#### Placeholder Implementation
```python
@app.post("/api/ai/analyze")
async def analyze_lead(request: dict):
    # Ready for Gemini API integration
    # Placeholder for lead analysis, scoring, recommendations
    return {"analysis": "AI integration ready"}
```

#### Planned Features
- **Lead Scoring**: AI-powered lead quality assessment
- **Content Generation**: Automated email content creation
- **Sentiment Analysis**: Lead interaction sentiment tracking
- **Predictive Analytics**: Conversion probability predictions

---

## API Endpoints

### Lead Management
- `GET /api/leads` - Retrieve all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/{id}` - Update existing lead
- `DELETE /api/leads/{id}` - Delete lead

### File Processing
- `POST /api/upload` - Upload and process documents

### Email Communication
- `POST /api/leads/{id}/email` - Send email to specific lead

### Workflow Automation
- `POST /api/workflow/execute` - Execute workflow automation

### System
- `GET /api/health` - Health check endpoint

### AI Integration
- `POST /api/ai/analyze` - AI lead analysis (placeholder)

---

## Installation & Setup

### Prerequisites
- **Node.js 16+**: For frontend development
- **Python 3.8+**: For backend development
- **Tesseract OCR**: For image text extraction
- **Poppler Utils**: For PDF processing

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run setup script (installs system dependencies)
python setup.py

# Configure environment variables
cp .env.example .env
# Edit .env with your Gmail credentials

# Start the server
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### System Dependencies

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr poppler-utils
```

#### macOS
```bash
brew install tesseract poppler
```

#### Windows
- Download Tesseract from GitHub releases
- Install Poppler for Windows

---

## Configuration

### Environment Variables
```bash
# Backend (.env file)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-gmail-app-password
GEMINI_API_KEY=your-gemini-api-key
PORT=8000
```

### Gmail SMTP Setup
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account Settings → Security → App Passwords
3. Generate new App Password for "Mail"
4. Use this password in GMAIL_PASS (not your regular password)

---

## Data Storage & Management

### CSV-Based Storage
- **File**: `backend/leads.csv`
- **Format**: Standard CSV with headers
- **Backup**: Automatic backup on data changes
- **Encoding**: UTF-8 with proper escaping

### Data Schema
```csv
id,name,email,phone,status,source,createdAt
uuid4,John Doe,john@example.com,+1234567890,New,Manual,2024-01-01T00:00:00.000Z
```

### Data Validation
- **Email**: RFC-compliant validation
- **Phone**: International format support
- **Duplicates**: Email-based duplicate prevention
- **Sanitization**: CSV injection prevention

---

## Testing

### Backend Testing
```bash
# Run comprehensive backend tests
cd backend
python test_backend.py
```

### Test Coverage
- **API Endpoints**: All CRUD operations
- **File Upload**: Various file types and sizes
- **Email Sending**: SMTP configuration validation
- **Workflow Execution**: Automation testing
- **Error Handling**: Edge cases and failures

### Frontend Testing
- **Component Testing**: Individual component functionality
- **Integration Testing**: API communication
- **User Flow Testing**: Complete user journeys
- **Responsive Testing**: Mobile and desktop layouts

---

## Security Considerations

### Data Protection
- **Input Sanitization**: Prevent CSV injection attacks
- **File Validation**: Strict file type and size limits
- **Email Validation**: Prevent email header injection
- **CORS Configuration**: Restricted cross-origin requests

### Authentication (Future)
- **User Authentication**: Multi-user support ready
- **Role-Based Access**: Admin and user roles
- **API Security**: Token-based authentication
- **Data Encryption**: Sensitive data protection

---

## Performance Optimization

### Frontend
- **Code Splitting**: Lazy loading for large components
- **Image Optimization**: Compressed assets
- **Bundle Size**: Minimized production builds
- **Caching**: Browser and service worker caching

### Backend
- **Async Processing**: Non-blocking I/O operations
- **File Handling**: Temporary file cleanup
- **Memory Management**: Efficient data processing
- **Connection Pooling**: Database connection optimization

---

## Error Handling & Monitoring

### Frontend Error Handling
- **Toast Notifications**: User-friendly error messages
- **Loading States**: Clear progress indicators
- **Retry Mechanisms**: Automatic and manual retry options
- **Graceful Degradation**: Fallback UI states

### Backend Error Handling
- **HTTP Status Codes**: Proper REST API responses
- **Detailed Logging**: Comprehensive error logging
- **Input Validation**: Request data validation
- **Exception Handling**: Graceful error recovery

---

## Future Enhancements

### Planned Features
1. **Database Integration**: PostgreSQL/MySQL support
2. **Real-time Notifications**: WebSocket integration
3. **Advanced Analytics**: Lead performance dashboards
4. **Mobile App**: React Native mobile application
5. **API Rate Limiting**: Enhanced security measures
6. **Webhook Support**: Third-party integrations
7. **Advanced OCR**: Machine learning-based text extraction
8. **Multi-language Support**: Internationalization

### AI Enhancements
1. **Gemini Integration**: Complete AI functionality
2. **Lead Scoring**: ML-based lead quality assessment
3. **Predictive Analytics**: Conversion probability models
4. **Natural Language Processing**: Advanced text analysis
5. **Automated Responses**: AI-generated email responses

---

## Troubleshooting

### Common Issues

#### Backend Connection Errors
- **Check Server Status**: Ensure backend is running on port 8000
- **Verify CORS**: Frontend URL must be in CORS allowed origins
- **Network Issues**: Check firewall and network connectivity

#### File Processing Failures
- **System Dependencies**: Ensure Tesseract and Poppler are installed
- **File Permissions**: Check read/write permissions for upload directory
- **File Corruption**: Verify file integrity before upload

#### Email Configuration Issues
- **App Password**: Use Gmail App Password, not regular password
- **2FA Required**: Gmail requires 2-factor authentication
- **SMTP Settings**: Verify Gmail SMTP configuration

### Debug Mode
```bash
# Enable detailed logging
export DEBUG=1
python main.py
```

---

## Contributing

### Development Workflow
1. **Fork Repository**: Create your own fork
2. **Feature Branch**: Create feature-specific branches
3. **Code Standards**: Follow TypeScript and Python conventions
4. **Testing**: Add tests for new features
5. **Documentation**: Update documentation for changes
6. **Pull Request**: Submit PR with detailed description

### Code Style
- **TypeScript**: ESLint and Prettier configuration
- **Python**: PEP 8 compliance with Black formatter
- **CSS**: Tailwind CSS utility classes
- **Components**: Functional components with hooks

---

## License & Support

### License
This project is open-source under the MIT License.

### Support
- **Documentation**: Comprehensive guides and API docs
- **Community**: GitHub issues and discussions
- **Professional Support**: Available for enterprise users

---

## Conclusion

The Lead Management with Agentic AI project represents a modern, scalable approach to lead management. By combining AI capabilities with intuitive user interfaces and robust backend processing, it provides businesses with a powerful tool for managing their lead generation and nurturing processes.

The architecture is designed for extensibility, allowing for easy integration of additional AI services, third-party tools, and custom business logic. The comprehensive documentation and testing ensure maintainability and reliability for production use.

---

*Last Updated: January 2024*
*Version: 1.0.0*
