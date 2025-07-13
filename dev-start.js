
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Lead Management Development Environment...\n');

// Function to run commands with proper cross-platform support
function runCommand(command, args, cwd, name, color) {
  const process = spawn(command, args, {
    cwd: cwd,
    stdio: 'pipe',
    shell: true
  });

  process.stdout.on('data', (data) => {
    console.log(`\x1b[${color}m[${name}]\x1b[0m ${data.toString().trim()}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`\x1b[${color}m[${name} ERROR]\x1b[0m ${data.toString().trim()}`);
  });

  process.on('close', (code) => {
    console.log(`\x1b[${color}m[${name}]\x1b[0m Process exited with code ${code}`);
  });

  return process;
}

// Start backend (Python FastAPI)
console.log('📱 Starting Backend Server (Python FastAPI)...');
const backendProcess = runCommand('python', ['main.py'], path.join(__dirname, 'backend'), 'BACKEND', '33');

// Wait a moment for backend to start, then start frontend
setTimeout(() => {
  console.log('🌐 Starting Frontend Server (Vite + React)...');
  const frontendProcess = runCommand('npm', ['run', 'dev'], __dirname, 'FRONTEND', '36');
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down development servers...');
  process.exit();
});

console.log('\n📋 Development Environment Status:');
console.log('   • Backend: http://localhost:8000');
console.log('   • Frontend: http://localhost:5173');
console.log('   • Health Check: http://localhost:8000/api/health');
console.log('\n💡 Press Ctrl+C to stop all servers\n');
