# IrtzaLink Build Script for Windows PowerShell
# This script sets up and builds the complete IrtzaLink project

Write-Host "🚀 Setting up IrtzaLink Project..." -ForegroundColor Green

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed. Please install npm" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js and npm are installed" -ForegroundColor Green

# Navigate to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "📦 Installing Firebase CLI..." -ForegroundColor Blue
try {
    npm install -g firebase-tools
    Write-Host "✅ Firebase CLI installed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firebase CLI installation failed or already installed" -ForegroundColor Yellow
}

# Install web panel dependencies
Write-Host "📦 Installing web panel dependencies..." -ForegroundColor Blue
Set-Location "$projectRoot\web_panel"

if (Test-Path "package.json") {
    npm install
    Write-Host "✅ Web panel dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found in web_panel directory" -ForegroundColor Red
}

# Install Firebase Functions dependencies
Write-Host "📦 Installing Firebase Functions dependencies..." -ForegroundColor Blue
Set-Location "$projectRoot\firebase\functions"

if (Test-Path "package.json") {
    npm install
    Write-Host "✅ Firebase Functions dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found in firebase/functions directory" -ForegroundColor Red
}

# Build web panel
Write-Host "🏗️  Building web panel..." -ForegroundColor Blue
Set-Location "$projectRoot\web_panel"

npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Web panel built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Web panel build failed" -ForegroundColor Red
}

# Return to project root
Set-Location $projectRoot

Write-Host ""
Write-Host "🎉 IrtzaLink setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up Firebase project:" -ForegroundColor White
Write-Host "   - Go to https://console.firebase.google.com" -ForegroundColor Gray
Write-Host "   - Create a new project" -ForegroundColor Gray
Write-Host "   - Enable Authentication (Google & Email)" -ForegroundColor Gray
Write-Host "   - Create Firestore database" -ForegroundColor Gray
Write-Host "   - Enable Firebase Hosting" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure Firebase:" -ForegroundColor White
Write-Host "   firebase login" -ForegroundColor Gray
Write-Host "   firebase init" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Update Firebase configuration in:" -ForegroundColor White
Write-Host "   - web_panel/src/services/firebase.js" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Deploy to Firebase:" -ForegroundColor White
Write-Host "   firebase deploy" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Test the web panel locally:" -ForegroundColor White
Write-Host "   cd web_panel && npm start" -ForegroundColor Gray