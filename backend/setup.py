
#!/usr/bin/env python3
"""
Setup script for the FastAPI Lead Management Backend
"""
import os
import sys
import subprocess
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def install_system_dependencies():
    """Install system dependencies based on the platform"""
    system = platform.system().lower()
    
    if system == "linux":
        print("🐧 Detected Linux system")
        commands = [
            "sudo apt-get update",
            "sudo apt-get install -y tesseract-ocr tesseract-ocr-eng poppler-utils"
        ]
        for cmd in commands:
            if not run_command(cmd, f"Installing system dependencies: {cmd}"):
                return False
    
    elif system == "darwin":  # macOS
        print("🍎 Detected macOS system")
        # Check if Homebrew is installed
        if subprocess.run("which brew", shell=True, capture_output=True).returncode != 0:
            print("❌ Homebrew not found. Please install Homebrew first:")
            print("   /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
            return False
        
        commands = [
            "brew install tesseract poppler"
        ]
        for cmd in commands:
            if not run_command(cmd, f"Installing system dependencies: {cmd}"):
                return False
    
    elif system == "windows":
        print("🪟 Detected Windows system")
        print("⚠️  Please manually install:")
        print("   1. Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki")
        print("   2. Poppler: https://blog.alivate.com.au/poppler-windows/")
        print("   3. Add both to your system PATH")
        input("Press Enter after installing the above dependencies...")
    
    return True

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = ".env"
    if not os.path.exists(env_file):
        env_content = """# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Server Configuration
PORT=8000
NODE_ENV=development
"""
        with open(env_file, 'w') as f:
            f.write(env_content)
        print("✅ Created .env file")
        print("⚠️  Please update .env with your Gmail credentials")
    else:
        print("✅ .env file already exists")

def main():
    """Main setup function"""
    print("🚀 Setting up FastAPI Lead Management Backend")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    
    # Install system dependencies
    if not install_system_dependencies():
        print("❌ Failed to install system dependencies")
        sys.exit(1)
    
    # Install Python dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        print("❌ Failed to install Python dependencies")
        sys.exit(1)
    
    # Create directories
    os.makedirs("uploads", exist_ok=True)
    print("✅ Created uploads directory")
    
    # Create CSV file
    csv_file = "leads.csv"
    if not os.path.exists(csv_file):
        with open(csv_file, 'w') as f:
            f.write("id,name,email,phone,status,source,createdAt\n")
        print("✅ Created leads.csv file")
    
    # Create .env file
    create_env_file()
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\n📝 Next steps:")
    print("1. Update .env file with your Gmail credentials")
    print("2. Start the server: python main.py")
    print("3. Test the API: http://localhost:8000/api/health")
    print("\n💡 For Gmail SMTP:")
    print("   - Enable 2-factor authentication")
    print("   - Generate an App Password")
    print("   - Use the App Password (not regular password)")

if __name__ == "__main__":
    main()
