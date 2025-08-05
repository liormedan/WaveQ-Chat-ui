# PowerShell Script for Running Chat Application

param(
    [string]$Mode = ""
)

# Function to display menu
function Show-Menu {
    Clear-Host
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "    Chat Application Launcher" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Select User Type:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Administrators - No Authentication" -ForegroundColor Green
    Write-Host "2. Regular Users" -ForegroundColor Blue
    Write-Host "3. Exit" -ForegroundColor Red
    Write-Host ""
    Write-Host "Enter option number: " -NoNewline -ForegroundColor White
}

# Function to run application in administrator mode
function Start-AdminMode {
    Write-Host ""
    Write-Host "Starting in Administrator mode..." -ForegroundColor Green
    
    # Set environment variable for admin mode
    $env:ADMIN_MODE = "true"
    $env:SKIP_AUTH = "true"
    
    # Check if node_modules exists, if not install dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        pnpm install
    }
    
    # Run database migration
    Write-Host "Running database migration..." -ForegroundColor Yellow
    pnpm run db:migrate
    
    # Start the development server
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "The application will open in browser at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
    
    pnpm run dev
}

# Function to run application in regular user mode
function Start-UserMode {
    Write-Host ""
    Write-Host "Starting in Regular User mode..." -ForegroundColor Blue
    
    # Clear admin mode environment variables
    $env:ADMIN_MODE = $null
    $env:SKIP_AUTH = $null
    
    # Check if node_modules exists, if not install dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        pnpm install
    }
    
    # Run database migration
    Write-Host "Running database migration..." -ForegroundColor Yellow
    pnpm run db:migrate
    
    # Start the development server
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "The application will open in browser at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
    
    pnpm run dev
}

# Main script logic
try {
    # Check if pnpm is installed
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "Error: pnpm is not installed" -ForegroundColor Red
        Write-Host "Install pnpm using: npm install -g pnpm" -ForegroundColor Yellow
        exit 1
    }
    
    # If mode is provided as parameter, run directly
    if ($Mode -eq "1" -or $Mode -eq "admin") {
        Start-AdminMode
        exit 0
    }
    elseif ($Mode -eq "2" -or $Mode -eq "user") {
        Start-UserMode
        exit 0
    }
    
    # Interactive menu
    while ($true) {
        Show-Menu
        $choice = Read-Host
        
        switch ($choice) {
            "1" {
                Start-AdminMode
                break
            }
            "2" {
                Start-UserMode
                break
            }
            "3" {
                Write-Host ""
                Write-Host "Exiting..." -ForegroundColor Yellow
                exit 0
            }
            default {
                Write-Host ""
                Write-Host "Invalid option" -ForegroundColor Red
                Write-Host "Press Enter to continue..." -NoNewline
                Read-Host
            }
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Press Enter to continue..." -NoNewline
    Read-Host
} 