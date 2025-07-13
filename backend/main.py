from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import os
import uuid
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pytesseract
from PIL import Image
from pdf2image import convert_from_path, convert_from_bytes
import PyPDF2
import io
import re
from datetime import datetime
import logging
import aiofiles
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import tempfile
import asyncio

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Lead Management API",
    description="Advanced Lead Management System with AI-powered automation", 
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enhanced CORS Configuration for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://localhost:3000",
        "https://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = 'uploads'
CSV_FILE = 'leads.csv'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Gmail SMTP Configuration
GMAIL_USER = os.getenv('GMAIL_USER', 'your-email@gmail.com')
GMAIL_PASS = os.getenv('GMAIL_PASS', 'your-app-password')

# Pydantic Models
class LeadBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    status: str = "New"
    source: str = "Manual"

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None

class Lead(LeadBase):
    id: str
    createdAt: str

class EmailRequest(BaseModel):
    subject: str
    message: str

class WorkflowRequest(BaseModel):
    action: str
    leadIds: List[str]
    emailTemplate: Optional[Dict[str, str]] = None
    status: Optional[str] = None

class UploadResponse(BaseModel):
    leads: List[Dict[str, str]]
    extractedText: str
    fileInfo: Dict[str, Any]

# Database operations
def initialize_csv():
    """Initialize CSV file if it doesn't exist"""
    if not os.path.exists(CSV_FILE):
        df = pd.DataFrame(columns=['id', 'name', 'email', 'phone', 'status', 'source', 'createdAt'])
        df.to_csv(CSV_FILE, index=False)
        logger.info(f"Created new CSV file: {CSV_FILE}")

def read_leads_from_csv() -> List[Dict]:
    """Read leads from CSV file"""
    try:
        if os.path.exists(CSV_FILE):
            df = pd.read_csv(CSV_FILE)
            df = df.fillna('')
            return df.to_dict('records')
        return []
    except Exception as e:
        logger.error(f"Error reading CSV: {e}")
        return []

def write_leads_to_csv(leads: List[Dict]) -> bool:
    """Write leads to CSV file"""
    try:
        df = pd.DataFrame(leads)
        df.to_csv(CSV_FILE, index=False)
        logger.info(f"Wrote {len(leads)} leads to CSV")
        return True
    except Exception as e:
        logger.error(f"Error writing CSV: {e}")
        return False

# Enhanced OCR and PDF processing functions
async def extract_text_from_pdf_advanced(file_path: str) -> str:
    """Extract text from PDF using multiple methods"""
    try:
        text = ""
        
        # Method 1: Try PyPDF2 first (faster)
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted.strip():
                        text += extracted + "\n"
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {e}")
        
        # Method 2: If no text found, use pdf2image + OCR
        if not text.strip():
            try:
                # Convert PDF to images
                images = convert_from_path(file_path, dpi=300, first_page=1, last_page=5)  # Limit to first 5 pages
                
                for i, image in enumerate(images):
                    # Configure tesseract for better accuracy
                    custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@.-+()[] '
                    page_text = pytesseract.image_to_string(image, config=custom_config)
                    if page_text.strip():
                        text += f"Page {i+1}:\n{page_text}\n"
                        
            except Exception as e:
                logger.error(f"pdf2image + OCR extraction failed: {e}")
                raise HTTPException(status_code=422, detail=f"Failed to extract text from PDF: {str(e)}")
        
        return text
        
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        raise HTTPException(status_code=422, detail=f"Failed to process PDF: {str(e)}")

async def extract_text_from_image_advanced(file_path: str) -> str:
    """Extract text from image using enhanced OCR"""
    try:
        image = Image.open(file_path)
        
        # Enhance image for better OCR
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too small
        width, height = image.size
        if width < 1000 or height < 1000:
            scale_factor = max(1000/width, 1000/height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Configure tesseract with multiple PSM modes for better results
        psm_modes = [6, 4, 3, 1]  # Different page segmentation modes
        best_text = ""
        
        for psm in psm_modes:
            try:
                custom_config = f'--oem 3 --psm {psm} -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@.-+()[] '
                text = pytesseract.image_to_string(image, config=custom_config)
                
                # Choose the result with most content
                if len(text.strip()) > len(best_text.strip()):
                    best_text = text
                    
            except Exception as e:
                logger.warning(f"OCR with PSM {psm} failed: {e}")
                continue
        
        if not best_text.strip():
            raise HTTPException(status_code=422, detail="No text could be extracted from the image")
            
        return best_text
        
    except Exception as e:
        logger.error(f"Image OCR error: {e}")
        raise HTTPException(status_code=422, detail=f"Failed to extract text from image: {str(e)}")

def extract_lead_info_advanced(text: str) -> List[Dict[str, str]]:
    """Enhanced lead information extraction with better regex patterns"""
    try:
        leads = []
        
        # Enhanced regex patterns
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        # More comprehensive phone patterns
        phone_patterns = [
            r'(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',  # US format
            r'(?:\+?[1-9]\d{0,3}[-.\s]?)?(?:\(?(\d{1,4})\)?[-.\s]?)?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})',  # International
            r'(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})',  # Simple US format
        ]
        
        # Enhanced name patterns
        name_patterns = [
            r'(?:^|\n|\r)([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',  # Standard names
            r'Name:?\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',  # With "Name:" prefix
            r'Contact:?\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',  # With "Contact:" prefix
        ]
        
        # Extract emails
        emails = list(set(re.findall(email_pattern, text, re.IGNORECASE)))
        
        # Extract phones using multiple patterns
        phones = []
        for pattern in phone_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if isinstance(match, tuple):
                    phone = ''.join(match)
                else:
                    phone = match
                # Clean phone number
                clean_phone = re.sub(r'[^\d+]', '', phone)
                if len(clean_phone) >= 10:
                    phones.append(clean_phone)
        phones = list(set(phones))
        
        # Extract names using multiple patterns
        names = []
        for pattern in name_patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            names.extend(matches)
        names = list(set(names))
        
        logger.info(f"Enhanced extraction found: {len(emails)} emails, {len(phones)} phones, {len(names)} names")
        
        # Create leads by matching information
        max_leads = max(len(emails), len(names), 1)
        
        for i in range(max_leads):
            lead = {}
            
            # Assign email
            if i < len(emails):
                lead['email'] = emails[i]
            elif emails:
                lead['email'] = emails[0]
            else:
                continue  # Skip if no email
            
            # Assign name
            if i < len(names):
                lead['name'] = names[i]
            elif names:
                lead['name'] = names[0]
            else:
                # Try to generate name from email
                email_name = lead['email'].split('@')[0]
                lead['name'] = email_name.replace('.', ' ').replace('_', ' ').title()
            
            # Assign phone
            if i < len(phones):
                lead['phone'] = phones[i]
            elif phones:
                lead['phone'] = phones[0]
            else:
                lead['phone'] = ''
            
            if lead.get('email') and '@' in lead['email']:
                leads.append(lead)
        
        logger.info(f"Successfully extracted {len(leads)} leads with enhanced processing")
        return leads
        
    except Exception as e:
        logger.error(f"Enhanced lead extraction error: {e}")
        return []

async def send_email_smtp(to_email: str, subject: str, message: str, lead_name: str) -> bool:
    """Send email using Gmail SMTP with async support"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Create HTML body
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello {lead_name},</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            {message.replace(chr(10), '<br>')}
          </div>
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            Your Lead Management Team
          </p>
        </div>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email in thread pool to avoid blocking
        def send_email_sync():
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
                server.login(GMAIL_USER, GMAIL_PASS)
                text = msg.as_string()
                server.sendmail(GMAIL_USER, to_email, text)
        
        # Run in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, send_email_sync)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# API Routes
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Lead Management API is running",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
async def health_check():
    """Enhanced health check endpoint"""
    return {
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'message': 'Lead Management FastAPI is running',
        'version': '2.0.0',
        'endpoints': {
            'leads': '/api/leads',
            'upload': '/api/upload',
            'workflow': '/api/workflow/execute',
            'docs': '/docs'
        }
    }

@app.get("/api/leads", response_model=List[Lead])
async def get_leads():
    """Get all leads with proper error handling"""
    try:
        logger.info('Fetching all leads...')
        leads = read_leads_from_csv()
        logger.info(f'Retrieved {len(leads)} leads')
        return leads
    except Exception as e:
        logger.error(f"Error fetching leads: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch leads: {str(e)}")

@app.post("/api/leads", response_model=Lead)
async def add_lead(lead: LeadCreate):
    """Add new lead"""
    try:
        # Check for duplicates
        existing_leads = read_leads_from_csv()
        for existing_lead in existing_leads:
            if existing_lead.get('email', '').lower() == lead.email.lower():
                raise HTTPException(status_code=409, detail="A lead with this email already exists")
        
        # Create new lead
        new_lead = {
            'id': str(uuid.uuid4()),
            'name': lead.name.strip(),
            'email': lead.email.lower(),
            'phone': lead.phone.strip() if lead.phone else '',
            'status': lead.status,
            'source': lead.source,
            'createdAt': datetime.now().isoformat()
        }
        
        # Add to leads list and save
        existing_leads.append(new_lead)
        write_leads_to_csv(existing_leads)
        
        logger.info(f"Lead added successfully: {new_lead['id']}")
        return new_lead
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding lead: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add lead: {str(e)}")

@app.put("/api/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead: LeadUpdate):
    """Update lead"""
    try:
        leads = read_leads_from_csv()
        lead_index = None
        
        for i, existing_lead in enumerate(leads):
            if existing_lead.get('id') == lead_id:
                lead_index = i
                break
        
        if lead_index is None:
            raise HTTPException(status_code=404, detail=f"No lead found with ID: {lead_id}")
        
        # Update lead with only provided fields
        update_data = lead.dict(exclude_unset=True)
        if 'email' in update_data:
            update_data['email'] = update_data['email'].lower()
        
        leads[lead_index].update(update_data)
        write_leads_to_csv(leads)
        
        logger.info(f"Lead updated successfully: {lead_id}")
        return leads[lead_index]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lead: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update lead: {str(e)}")

@app.delete("/api/leads/{lead_id}")
async def delete_lead(lead_id: str):
    """Delete lead"""
    try:
        leads = read_leads_from_csv()
        original_count = len(leads)
        leads = [lead for lead in leads if lead.get('id') != lead_id]
        
        if len(leads) == original_count:
            raise HTTPException(status_code=404, detail=f"No lead found with ID: {lead_id}")
        
        write_leads_to_csv(leads)
        
        logger.info(f"Lead deleted successfully: {lead_id}")
        return {"message": "Lead deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lead: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete lead: {str(e)}")

@app.post("/api/leads/{lead_id}/email")
async def send_lead_email(lead_id: str, email_request: EmailRequest):
    """Send email to lead"""
    try:
        leads = read_leads_from_csv()
        lead = None
        lead_index = None
        
        for i, l in enumerate(leads):
            if l.get('id') == lead_id:
                lead = l
                lead_index = i
                break
        
        if not lead:
            raise HTTPException(status_code=404, detail=f"No lead found with ID: {lead_id}")
        
        # Check email configuration
        if GMAIL_USER == 'your-email@gmail.com' or GMAIL_PASS == 'your-app-password':
            raise HTTPException(status_code=500, detail="Email service is not configured")
        
        # Send email
        await send_email_smtp(lead['email'], email_request.subject, email_request.message, lead['name'])
        
        # Update lead status
        leads[lead_index]['status'] = 'Contacted'
        write_leads_to_csv(leads)
        
        logger.info(f"Email sent successfully to: {lead['email']}")
        return {"message": "Email sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload and process file with enhanced OCR"""
    temp_path = None
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or image files only")
        
        # Read file content
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
            temp_path = temp_file.name
            temp_file.write(contents)
        
        logger.info(f"Processing file: {file.filename}, Type: {file.content_type}, Size: {len(contents)} bytes")
        
        # Extract text based on file type
        extracted_text = ""
        if file.content_type == 'application/pdf' or file_extension == 'pdf':
            extracted_text = await extract_text_from_pdf_advanced(temp_path)
        elif file.content_type.startswith('image/') or file_extension in ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff']:
            extracted_text = await extract_text_from_image_advanced(temp_path)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
        
        if not extracted_text or not extracted_text.strip():
            raise HTTPException(status_code=422, detail="No text could be extracted from the uploaded file")
        
        # Extract lead information with enhanced processing
        extracted_leads = extract_lead_info_advanced(extracted_text)
        
        if not extracted_leads:
            raise HTTPException(
                status_code=422, 
                detail="No leads found in the document",
            )
        
        logger.info(f"Successfully extracted {len(extracted_leads)} leads from {file.filename}")
        
        return UploadResponse(
            leads=extracted_leads,
            extractedText=extracted_text[:1000] + '...' if len(extracted_text) > 1000 else extracted_text,
            fileInfo={
                'name': file.filename,
                'type': file.content_type,
                'size': len(contents)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                logger.error(f"Error cleaning up file: {e}")

@app.post("/api/workflow/execute")
async def execute_workflow(workflow: WorkflowRequest):
    """Execute workflow automation"""
    try:
        leads = read_leads_from_csv()
        target_leads = [lead for lead in leads if lead.get('id') in workflow.leadIds]
        
        if not target_leads:
            raise HTTPException(status_code=404, detail="None of the specified leads were found")
        
        results = []
        
        if workflow.action == 'send_email':
            if not workflow.emailTemplate or not workflow.emailTemplate.get('subject') or not workflow.emailTemplate.get('message'):
                raise HTTPException(status_code=400, detail="Email template with subject and message is required")
            
            # Check email configuration
            if GMAIL_USER == 'your-email@gmail.com' or GMAIL_PASS == 'your-app-password':
                raise HTTPException(status_code=500, detail="Email service is not configured")
            
            # Send emails concurrently (but limit concurrency to avoid overwhelming SMTP)
            async def send_single_email(lead):
                try:
                    subject = workflow.emailTemplate['subject'].replace('{{name}}', lead['name'])
                    message = workflow.emailTemplate['message'].replace('{{name}}', lead['name'])
                    await send_email_smtp(lead['email'], subject, message, lead['name'])
                    return {'leadId': lead['id'], 'status': 'sent', 'email': lead['email']}
                except Exception as e:
                    return {'leadId': lead['id'], 'status': 'failed', 'error': str(e)}
            
            # Process emails in batches to avoid overwhelming the SMTP server
            batch_size = 3
            for i in range(0, len(target_leads), batch_size):
                batch = target_leads[i:i+batch_size]
                batch_results = await asyncio.gather(*[send_single_email(lead) for lead in batch])
                results.extend(batch_results)
                
                # Small delay between batches
                if i + batch_size < len(target_leads):
                    await asyncio.sleep(1)
        
        elif workflow.action == 'update_status':
            new_status = workflow.status or 'Contacted'
            for i, lead in enumerate(leads):
                if lead.get('id') in workflow.leadIds:
                    leads[i]['status'] = new_status
            write_leads_to_csv(leads)
            results.append({'action': 'status_updated', 'count': len(target_leads), 'newStatus': new_status})
        
        else:
            raise HTTPException(status_code=400, detail=f"Action '{workflow.action}' is not supported")
        
        logger.info(f"Workflow execution completed: {results}")
        return {
            'message': 'Workflow executed successfully',
            'results': results,
            'processedLeads': len(target_leads)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")

if __name__ == "__main__":
    # Initialize CSV file
    initialize_csv()
    
    logger.info("🚀 Starting Lead Management FastAPI...")
    logger.info(f"📊 CSV file: {CSV_FILE}")
    logger.info(f"📧 Gmail SMTP: {GMAIL_USER}")
    logger.info("✅ Server ready to accept connections!")
    
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
