
# Lead Management System

A comprehensive web application for managing leads with document processing, email automation, and workflow visualization capabilities.

## Features

- **Lead Management**: Add, edit, delete, and track leads with comprehensive status management
- **Document Processing**: Upload PDF and image files with OCR text extraction
- **Email Integration**: Send personalized emails to leads with tracking
- **Workflow Visualization**: Design and execute automated workflows with visual editor
- **Data Storage**: CSV-based storage with backup and export capabilities
- **Advanced Search**: Filter and search through leads with multiple criteria
- **Responsive Design**: Modern UI built with React, TypeScript, and Tailwind CSS

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **React Query** for data fetching
- **React Flow** for workflow visualization
- **Tesseract.js** for OCR processing

### Backend
- **Python FastAPI** for REST API
- **CSV file storage** for data persistence
- **Email integration** for automated communications
- **File upload handling** for document processing

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org)
- **Python 3.8+** - [Download](https://python.org/downloads)
- **Git** - [Download](https://git-scm.com)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd lead-management-system
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The frontend will be available at `http://localhost:5173`

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```
The backend will be available at `http://localhost:3001`

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
GEMINI_API_KEY=your-gemini-api-key
```

## API Endpoints

### Core Lead Management
- `GET /api/leads` - Retrieve all leads
- `POST /api/leads` - Create a new lead
- `PUT /api/leads/{id}` - Update existing lead
- `DELETE /api/leads/{id}` - Delete lead

### Document Processing
- `POST /api/upload` - Upload and process documents with OCR

### Email Operations
- `POST /api/leads/{id}/email` - Send email to specific lead

### Workflow Management
- `POST /api/workflow/execute` - Execute automated workflows

### Utility
- `GET /api/health` - Health check endpoint
- `GET /docs` - API documentation (Swagger UI)

## Project Structure

```
lead-management-system/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Header.tsx      # Navigation header
│   │   ├── LeadForm.tsx    # Lead creation/editing form
│   │   ├── LeadTable.tsx   # Data table for leads
│   │   ├── LeadUpload.tsx  # Document upload component
│   │   └── ReactFlowCanvas.tsx # Workflow visualization
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   └── App.tsx             # Main application component
├── backend/
│   ├── main.py             # FastAPI server
│   ├── requirements.txt    # Python dependencies
│   └── uploads/            # File upload directory
├── public/                 # Static assets
└── package.json            # Node.js dependencies
```

## Development Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend
python main.py       # Start FastAPI server
python -m pytest    # Run tests (if available)
```

## Usage

1. **Start both servers** (frontend on port 5173, backend on port 3001)
2. **Access the application** at `http://localhost:5173`
3. **Add leads** using the form interface
4. **Upload documents** for automatic data extraction
5. **Send emails** to leads directly from the interface
6. **Create workflows** using the visual flow editor
7. **Export data** as needed for external use

## Troubleshooting

### Common Issues

**Backend Connection Error**
- Ensure backend is running on port 3001
- Check that all Python dependencies are installed
- Verify the health endpoint: `http://localhost:3001/api/health`

**File Upload Issues**
- Check that the `backend/uploads/` directory exists
- Verify file permissions for the uploads directory

**Email Not Working**
- Ensure Gmail credentials are configured in `.env`
- Use App Password for Gmail (not regular password)
- Check Gmail settings allow less secure apps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation at `http://localhost:3001/docs`
3. Check browser console for frontend errors
4. Review backend logs in the terminal

---

Built with ❤️ using React, TypeScript, Python, and FastAPI.
```
