
# Lead Management Backend

## Features

- **Lead Management**: Full CRUD operations for leads
- **CSV Storage**: Persistent data storage in CSV format
- **File Upload**: Support for PDF and image files
- **OCR Processing**: Text extraction using Tesseract.js (images) and Poppler (PDFs)
- **Email Integration**: Gmail SMTP for sending emails
- **AI Ready**: Endpoint prepared for Gemini API integration

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install system dependencies:

**For Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**For macOS:**
```bash
brew install poppler
```

**For Windows:**
Download poppler from: https://poppler.freedesktop.org/

3. Configure Gmail SMTP:
   - Update `gmailConfig` in `server.js` with your Gmail credentials
   - Use App Password for Gmail authentication
   - Enable 2-factor authentication in Gmail settings

## Usage

1. Start the server:
```bash
npm start
```

2. For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Email
- `POST /api/leads/:id/email` - Send email to lead

### File Processing
- `POST /api/upload` - Upload and process PDF/image files

### AI Integration
- `POST /api/ai/analyze` - AI analysis endpoint (ready for Gemini API)

### Health
- `GET /api/health` - Health check

## Gemini AI Integration

To integrate with Gemini API, update the `/api/ai/analyze` endpoint in `server.js`:

```javascript
// Add your Gemini API key
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

// Update the analyze endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { leadId, query } = req.body;
    const leads = await readLeadsFromCSV();
    const lead = leads.find(l => l.id === leadId);
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Analyze this lead and provide insights: ${JSON.stringify(lead)}. Query: ${query}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ analysis: text });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});
```

## Environment Variables

Create a `.env` file:
```
PORT=3001
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
GEMINI_API_KEY=your-gemini-api-key
```

## File Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── uploads/           # File upload directory
├── leads.csv          # Lead data storage
└── README.md          # This file
```
