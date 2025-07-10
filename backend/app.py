
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import os
import uuid
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image
import PyPDF2
import io
import re
from datetime import datetime
import logging
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000'], supports_credentials=True)

# Configuration
UPLOAD_FOLDER = 'uploads'
CSV_FILE = 'leads.csv'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gmail SMTP Configuration
GMAIL_USER = os.getenv('GMAIL_USER', 'your-email@gmail.com')
GMAIL_PASS = os.getenv('GMAIL_PASS', 'your-app-password')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'your-gemini-api-key')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def initialize_csv():
    """Initialize CSV file if it doesn't exist"""
    if not os.path.exists(CSV_FILE):
        df = pd.DataFrame(columns=['id', 'name', 'email', 'phone', 'status', 'source', 'createdAt'])
        df.to_csv(CSV_FILE, index=False)
        logger.info(f"Created new CSV file: {CSV_FILE}")

def read_leads_from_csv():
    """Read leads from CSV file"""
    try:
        if os.path.exists(CSV_FILE):
            df = pd.read_csv(CSV_FILE)
            # Replace NaN values with empty strings
            df = df.fillna('')
            return df.to_dict('records')
        return []
    except Exception as e:
        logger.error(f"Error reading CSV: {e}")
        return []

def write_leads_to_csv(leads):
    """Write leads to CSV file"""
    try:
        df = pd.DataFrame(leads)
        df.to_csv(CSV_FILE, index=False)
        logger.info(f"Wrote {len(leads)} leads to CSV")
        return True
    except Exception as e:
        logger.error(f"Error writing CSV: {e}")
        return False

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_image(file_path):
    """Extract text from image using OCR"""
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        raise Exception(f"Failed to extract text from image: {str(e)}")

def extract_lead_info(text):
    """Extract lead information from text"""
    try:
        leads = []
        
        # Regex patterns for extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'(?:\+?1[-.\s]?)?\(?(?:[0-9]{3})\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}|(?:\+?[1-9]\d{0,3}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}'
        name_pattern = r'(?:^|\n)([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'
        
        emails = list(set(re.findall(email_pattern, text)))
        phones = list(set([phone for phone in re.findall(phone_pattern, text) if len(phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '')) >= 10]))
        names = list(set(re.findall(name_pattern, text, re.MULTILINE)))
        
        logger.info(f"Found: {len(emails)} emails, {len(phones)} phones, {len(names)} names")
        
        # Create leads by matching emails with names and phones
        for i, email in enumerate(emails):
            lead = {
                'name': names[i] if i < len(names) else names[0] if names else f'Lead {i + 1}',
                'email': email,
                'phone': phones[i] if i < len(phones) else phones[0] if phones else ''
            }
            
            if lead['email'] and '@' in lead['email']:
                leads.append(lead)
        
        logger.info(f"Extracted {len(leads)} leads")
        return leads
    except Exception as e:
        logger.error(f"Error extracting lead info: {e}")
        return []

def send_email_smtp(to_email, subject, message, lead_name):
    """Send email using Gmail SMTP"""
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
        
        # Send email
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(GMAIL_USER, GMAIL_PASS)
            text = msg.as_string()
            server.sendmail(GMAIL_USER, to_email, text)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        raise Exception(f"Failed to send email: {str(e)}")

# Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'message': 'Lead Management Python API is running',
        'version': '1.0.0'
    })

@app.route('/api/leads', methods=['GET'])
def get_leads():
    """Get all leads"""
    try:
        logger.info('Fetching all leads...')
        leads = read_leads_from_csv()
        return jsonify(leads)
    except Exception as e:
        logger.error(f"Error fetching leads: {e}")
        return jsonify({'error': 'Failed to fetch leads', 'message': str(e)}), 500

@app.route('/api/leads', methods=['POST'])
def add_lead():
    """Add new lead"""
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Validation failed', 'message': 'Name and email are required'}), 400
        
        # Email validation
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'error': 'Validation failed', 'message': 'Invalid email format'}), 400
        
        # Create new lead
        new_lead = {
            'id': str(uuid.uuid4()),
            'name': data['name'].strip(),
            'email': data['email'].strip().lower(),
            'phone': data.get('phone', '').strip(),
            'status': data.get('status', 'New'),
            'source': data.get('source', 'Manual'),
            'createdAt': datetime.now().isoformat()
        }
        
        # Check for duplicates
        existing_leads = read_leads_from_csv()
        for lead in existing_leads:
            if lead.get('email') == new_lead['email']:
                return jsonify({'error': 'Duplicate lead', 'message': 'A lead with this email already exists'}), 409
        
        # Add to leads list and save
        existing_leads.append(new_lead)
        write_leads_to_csv(existing_leads)
        
        logger.info(f"Lead added successfully: {new_lead['id']}")
        return jsonify(new_lead), 201
        
    except Exception as e:
        logger.error(f"Error adding lead: {e}")
        return jsonify({'error': 'Failed to add lead', 'message': str(e)}), 500

@app.route('/api/leads/<string:lead_id>', methods=['PUT'])
def update_lead(lead_id):
    """Update lead"""
    try:
        data = request.get_json()
        
        if not lead_id:
            return jsonify({'error': 'Validation failed', 'message': 'Lead ID is required'}), 400
        
        leads = read_leads_from_csv()
        lead_index = None
        
        for i, lead in enumerate(leads):
            if lead.get('id') == lead_id:
                lead_index = i
                break
        
        if lead_index is None:
            return jsonify({'error': 'Lead not found', 'message': f'No lead found with ID: {lead_id}'}), 404
        
        # Validate email if being updated
        if 'email' in data:
            email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_pattern, data['email']):
                return jsonify({'error': 'Validation failed', 'message': 'Invalid email format'}), 400
            data['email'] = data['email'].strip().lower()
        
        # Update lead
        leads[lead_index].update(data)
        write_leads_to_csv(leads)
        
        logger.info(f"Lead updated successfully: {lead_id}")
        return jsonify(leads[lead_index])
        
    except Exception as e:
        logger.error(f"Error updating lead: {e}")
        return jsonify({'error': 'Failed to update lead', 'message': str(e)}), 500

@app.route('/api/leads/<string:lead_id>', methods=['DELETE'])
def delete_lead(lead_id):
    """Delete lead"""
    try:
        if not lead_id:
            return jsonify({'error': 'Validation failed', 'message': 'Lead ID is required'}), 400
        
        leads = read_leads_from_csv()
        original_count = len(leads)
        leads = [lead for lead in leads if lead.get('id') != lead_id]
        
        if len(leads) == original_count:
            return jsonify({'error': 'Lead not found', 'message': f'No lead found with ID: {lead_id}'}), 404
        
        write_leads_to_csv(leads)
        
        logger.info(f"Lead deleted successfully: {lead_id}")
        return jsonify({'message': 'Lead deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting lead: {e}")
        return jsonify({'error': 'Failed to delete lead', 'message': str(e)}), 500

@app.route('/api/leads/<string:lead_id>/email', methods=['POST'])
def send_lead_email(lead_id):
    """Send email to lead"""
    try:
        data = request.get_json()
        subject = data.get('subject')
        message = data.get('message')
        
        if not subject or not message:
            return jsonify({'error': 'Validation failed', 'message': 'Subject and message are required'}), 400
        
        leads = read_leads_from_csv()
        lead = None
        lead_index = None
        
        for i, l in enumerate(leads):
            if l.get('id') == lead_id:
                lead = l
                lead_index = i
                break
        
        if not lead:
            return jsonify({'error': 'Lead not found', 'message': f'No lead found with ID: {lead_id}'}), 404
        
        # Check email configuration
        if GMAIL_USER == 'your-email@gmail.com' or GMAIL_PASS == 'your-app-password':
            return jsonify({'error': 'Email service unavailable', 'message': 'Email service is not configured'}), 500
        
        # Send email
        send_email_smtp(lead['email'], subject, message, lead['name'])
        
        # Update lead status
        leads[lead_index]['status'] = 'Contacted'
        write_leads_to_csv(leads)
        
        logger.info(f"Email sent successfully to: {lead['email']}")
        return jsonify({'message': 'Email sent successfully'})
        
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return jsonify({'error': 'Failed to send email', 'message': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload and process file"""
    file_path = None
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded', 'message': 'Please select a file to upload'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file uploaded', 'message': 'Please select a file to upload'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Unsupported file type', 'message': 'Please upload PDF or image files only'}), 400
        
        # Save file
        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        file_type = file.content_type
        logger.info(f"Processing file: {file.filename}, Type: {file_type}")
        
        # Extract text based on file type
        extracted_text = ""
        if file_type == 'application/pdf':
            extracted_text = extract_text_from_pdf(file_path)
        elif file_type.startswith('image/'):
            extracted_text = extract_text_from_image(file_path)
        else:
            return jsonify({'error': 'Unsupported file type', 'message': f'File type {file_type} is not supported'}), 400
        
        if not extracted_text or not extracted_text.strip():
            return jsonify({'error': 'No text found', 'message': 'Could not extract any text from the uploaded file'}), 422
        
        # Extract lead information
        extracted_leads = extract_lead_info(extracted_text)
        
        if not extracted_leads:
            return jsonify({
                'error': 'No leads found',
                'message': 'Could not extract any lead information from the document',
                'extractedText': extracted_text[:500] + '...'
            }), 422
        
        logger.info(f"Successfully extracted {len(extracted_leads)} leads")
        
        return jsonify({
            'leads': extracted_leads,
            'extractedText': extracted_text[:500] + '...',
            'fileInfo': {
                'name': file.filename,
                'type': file_type,
                'size': len(file.read())
            }
        })
        
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        return jsonify({'error': 'Failed to process file', 'message': str(e)}), 500
    finally:
        # Clean up file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up file: {file_path}")
            except Exception as e:
                logger.error(f"Error cleaning up file: {e}")

@app.route('/api/workflow/execute', methods=['POST'])
def execute_workflow():
    """Execute workflow automation"""
    try:
        data = request.get_json()
        action = data.get('action')
        lead_ids = data.get('leadIds', [])
        email_template = data.get('emailTemplate')
        
        if not action or not isinstance(lead_ids, list):
            return jsonify({'error': 'Validation failed', 'message': 'Action and leadIds array are required'}), 400
        
        leads = read_leads_from_csv()
        target_leads = [lead for lead in leads if lead.get('id') in lead_ids]
        
        if not target_leads:
            return jsonify({'error': 'No leads found', 'message': 'None of the specified leads were found'}), 404
        
        results = []
        
        if action == 'send_email':
            if not email_template or not email_template.get('subject') or not email_template.get('message'):
                return jsonify({'error': 'Validation failed', 'message': 'Email template with subject and message is required'}), 400
            
            for lead in target_leads:
                try:
                    if GMAIL_USER != 'your-email@gmail.com' and GMAIL_PASS != 'your-app-password':
                        subject = email_template['subject'].replace('{{name}}', lead['name'])
                        message = email_template['message'].replace('{{name}}', lead['name'])
                        send_email_smtp(lead['email'], subject, message, lead['name'])
                        results.append({'leadId': lead['id'], 'status': 'sent', 'email': lead['email']})
                    else:
                        results.append({'leadId': lead['id'], 'status': 'failed', 'error': 'Email service not configured'})
                except Exception as e:
                    results.append({'leadId': lead['id'], 'status': 'failed', 'error': str(e)})
        
        elif action == 'update_status':
            new_status = data.get('status', 'Contacted')
            for i, lead in enumerate(leads):
                if lead.get('id') in lead_ids:
                    leads[i]['status'] = new_status
            write_leads_to_csv(leads)
            results.append({'action': 'status_updated', 'count': len(target_leads), 'newStatus': new_status})
        
        else:
            return jsonify({'error': 'Invalid action', 'message': f'Action \'{action}\' is not supported'}), 400
        
        logger.info(f"Workflow execution completed: {results}")
        return jsonify({
            'message': 'Workflow executed successfully',
            'results': results,
            'processedLeads': len(target_leads)
        })
        
    except Exception as e:
        logger.error(f"Error executing workflow: {e}")
        return jsonify({'error': 'Failed to execute workflow', 'message': str(e)}), 500

@app.route('/api/ai/analyze', methods=['POST'])
def ai_analyze():
    """AI analysis endpoint (Gemini integration placeholder)"""
    try:
        data = request.get_json()
        lead_id = data.get('leadId')
        query = data.get('query')
        
        if not lead_id or not query:
            return jsonify({'error': 'Validation failed', 'message': 'Lead ID and query are required'}), 400
        
        leads = read_leads_from_csv()
        lead = None
        for l in leads:
            if l.get('id') == lead_id:
                lead = l
                break
        
        if not lead:
            return jsonify({'error': 'Lead not found', 'message': f'No lead found with ID: {lead_id}'}), 404
        
        # TODO: Integrate with Gemini API here
        # response = call_gemini_api(lead, query)
        
        # Enhanced placeholder response
        response = {
            'analysis': f"AI analysis for {lead['name']}: Based on their {lead['source'].lower()} source and {lead['status'].lower()} status, here are my insights...",
            'suggestions': [
                f"Send personalized follow-up email to {lead['name']} within 24 hours",
                f"Schedule a call to discuss {lead['name']}'s specific needs and pain points",
                f"Send relevant case studies or product information based on their industry",
                f"Call {lead['name']} at {lead['phone']} for immediate engagement" if lead.get('phone') else f"Request phone number from {lead['name']} for better communication"
            ],
            'leadScore': 60 + (hash(lead_id) % 40),  # Score between 60-100
            'recommendedActions': [
                'immediate_follow_up',
                'send_resources',
                'schedule_call',
                'initial_contact' if lead['status'] == 'New' else 'nurture_relationship'
            ],
            'leadData': {
                'name': lead['name'],
                'email': lead['email'],
                'phone': lead.get('phone', ''),
                'status': lead['status'],
                'source': lead['source']
            }
        }
        
        logger.info(f"AI analysis completed for lead: {lead_id}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in AI analysis: {e}")
        return jsonify({'error': 'Failed to analyze lead', 'message': str(e)}), 500

if __name__ == '__main__':
    # Initialize CSV file
    initialize_csv()
    
    logger.info("🚀 Starting Lead Management Python API...")
    logger.info(f"📊 CSV file: {CSV_FILE}")
    logger.info(f"📧 Gmail SMTP: {GMAIL_USER}")
    logger.info(f"🤖 AI Integration: Ready for Gemini API")
    logger.info("✅ Server ready to accept connections!")
    
    app.run(debug=True, host='0.0.0.0', port=3001)
