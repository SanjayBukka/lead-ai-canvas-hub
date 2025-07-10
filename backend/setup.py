
#!/usr/bin/env python3
"""
Setup script for Lead Management Backend
"""
import os
import pandas as pd

def create_directories():
    """Create necessary directories"""
    directories = ['uploads', 'data']
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            print(f"✅ Created directory: {directory}")
        else:
            print(f"✅ Directory exists: {directory}")

def create_csv_file():
    """Create empty CSV file if it doesn't exist"""
    csv_file = 'leads.csv'
    if not os.path.exists(csv_file):
        df = pd.DataFrame(columns=['id', 'name', 'email', 'phone', 'status', 'source', 'createdAt'])
        df.to_csv(csv_file, index=False)
        print(f"✅ Created CSV file: {csv_file}")
    else:
        print(f"✅ CSV file exists: {csv_file}")

def create_env_template():
    """Create environment template"""
    env_template = """# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Gemini AI Configuration (Optional)
GEMINI_API_KEY=your-gemini-api-key

# Server Configuration
PORT=3001
FLASK_ENV=development
"""
    
    if not os.path.exists('.env.example'):
        with open('.env.example', 'w') as f:
            f.write(env_template)
        print('✅ Created .env.example file')

def main():
    print('🚀 Setting up Lead Management Python Backend...\n')
    
    create_directories()
    create_csv_file()
    create_env_template()
    
    print('\n🎉 Setup complete!')
    print('\n📝 Next steps:')
    print('1. Copy .env.example to .env and add your credentials')
    print('2. Install dependencies: pip install -r requirements.txt')
    print('3. Install system dependencies:')
    print('   - Ubuntu/Debian: sudo apt-get install tesseract-ocr')
    print('   - macOS: brew install tesseract')
    print('4. Start the server: python app.py')
    print('\n💡 For Gmail SMTP, you need to:')
    print('   - Enable 2-factor authentication on your Gmail account')
    print('   - Generate an App Password for this application')
    print('   - Use the App Password (not your regular password)')

if __name__ == '__main__':
    main()
