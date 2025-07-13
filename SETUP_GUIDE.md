
# Lead Management System - Setup Guide

## Quick Start (Windows PowerShell)

### Option 1: Using Batch File (Easiest)
```bash
# Double-click start-dev.bat or run:
start-dev.bat
```

### Option 2: Using PowerShell Script
```powershell
# Run in PowerShell:
.\start-dev.ps1
```

### Option 3: Manual Setup
```powershell
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend  
npm install
npm run dev
```

## Prerequisites

### Required Software
- **Python 3.8+** - [Download](https://python.org/downloads)
- **Node.js 18+** - [Download](https://nodejs.org)
- **Git** - [Download](https://git-scm.com)

### Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Node.js Dependencies
```bash
npm install
```

## Configuration

### Environment Variables (.env file in backend/)
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
GEMINI_API_KEY=your-gemini-api-key
```

### Ports
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Troubleshooting

### Common Issues

#### "Backend Connection Error"
**Solution**: Start the backend server first
```bash
cd backend
python main.py
```

#### "Python not found"
**Solution**: Use python3 or install Python
```bash
python3 main.py
# or install Python from python.org
```

#### "Port already in use"
**Solution**: Kill existing processes
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or restart your computer
```

#### Build Configuration Errors
**Solution**: Clear cache and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

## Features

### ✅ Working Features
- ✅ Lead CRUD operations
- ✅ Document upload (PDF/Images)
- ✅ OCR text extraction
- ✅ Email integration
- ✅ Workflow visualization
- ✅ CSV data storage
- ✅ Responsive UI

### 🔧 Configuration Needed
- 📧 Gmail SMTP (for email sending)
- 🤖 Gemini API (for AI features)

## Development Commands

```bash
# Start development servers
npm run dev           # Frontend only
python backend/main.py    # Backend only

# Build for production
npm run build

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

## API Endpoints

### Core Endpoints
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create lead
- `PUT /api/leads/{id}` - Update lead
- `DELETE /api/leads/{id}` - Delete lead

### Advanced Endpoints
- `POST /api/upload` - Process documents
- `POST /api/leads/{id}/email` - Send email
- `POST /api/workflow/execute` - Run workflows

### Utility Endpoints
- `GET /api/health` - Health check
- `GET /docs` - API documentation

## Project Structure

```
lead-management/
├── src/                    # Frontend React code
│   ├── components/         # UI components
│   ├── hooks/             # Custom hooks
│   └── lib/               # Utilities
├── backend/               # Python FastAPI backend
│   ├── main.py           # Main server file
│   ├── requirements.txt  # Python dependencies
│   └── uploads/          # File uploads
├── start-dev.bat         # Windows batch script
├── start-dev.ps1         # PowerShell script
└── dev-start.js          # Node.js startup script
```

## Support

### Getting Help
1. Check this setup guide
2. Review console errors
3. Check backend logs
4. Verify all dependencies are installed
5. Ensure ports 5173 and 8000 are free

### Logs and Debugging
- **Frontend**: Browser Developer Tools (F12)
- **Backend**: Terminal output where you ran `python main.py`
- **Network**: Check browser Network tab for API calls

## Next Steps

1. Start both servers using one of the methods above
2. Open http://localhost:5173 in your browser
3. Test the health check: http://localhost:8000/api/health
4. Upload a document to test OCR functionality
5. Configure email credentials for full functionality

🎉 **You're all set!** The system should now be running properly.
```
