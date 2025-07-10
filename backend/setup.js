
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Lead Management Backend...\n');

// Create necessary directories
const directories = ['uploads', 'data'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`✅ Directory exists: ${dir}`);
  }
});

// Create empty CSV file if it doesn't exist
const csvFile = 'leads.csv';
const csvHeaders = 'id,name,email,phone,status,source,createdAt\n';

if (!fs.existsSync(csvFile)) {
  fs.writeFileSync(csvFile, csvHeaders);
  console.log(`✅ Created CSV file: ${csvFile}`);
} else {
  console.log(`✅ CSV file exists: ${csvFile}`);
}

// Create environment template
const envTemplate = `# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Gemini AI Configuration (Optional)
GEMINI_API_KEY=your-gemini-api-key

# Server Configuration
PORT=3001
NODE_ENV=development
`;

if (!fs.existsSync('.env.example')) {
  fs.writeFileSync('.env.example', envTemplate);
  console.log('✅ Created .env.example file');
}

console.log('\n🎉 Setup complete!');
console.log('\n📝 Next steps:');
console.log('1. Copy .env.example to .env and add your credentials');
console.log('2. Install dependencies: npm install');
console.log('3. Start the server: npm start');
console.log('\n💡 For Gmail SMTP, you need to:');
console.log('   - Enable 2-factor authentication on your Gmail account');
console.log('   - Generate an App Password for this application');
console.log('   - Use the App Password (not your regular password)');
