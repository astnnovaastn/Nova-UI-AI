#!/usr/bin/env node

/**
 * JARVIS Server Manager
 * Manages the backend server and frontend development together
 */

import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = os.platform() === 'win32';
const backendDir = path.join(__dirname, '..', 'backend');
const frontendDir = path.join(__dirname);
const rootDir = path.join(__dirname, '..', '..', '..');  // Go up three levels to d:\Astra_ai

// Load .env file
function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  .env file not found at ${filePath}`);
        return;
    }
    
    const envContent = fs.readFileSync(filePath, 'utf-8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        process.env[key.trim()] = value;
    });
}

// Load environment variables from .env file
const envPath = path.join(rootDir, '.env');
loadEnv(envPath);

console.log('\n🚀 Nova AI UI - Starting Backend Server and Frontend\n');
console.log('📍 Backend Server: ws://localhost:8340/ws/voice');
console.log('📍 Frontend UI:    http://localhost:5173/');
console.log('📍 REST API:       http://localhost:8340/api\n');

let serverProcess = null;
let viteProcess = null;

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Shutting down...');
    
    if (serverProcess) {
        console.log('Stopping backend server...');
        serverProcess.kill();
    }
    if (viteProcess) {
        console.log('Stopping frontend...');
        viteProcess.kill();
    }
    
    process.exit(0);
});

// Start backend server
function startServer() {
    console.log('Starting Backend Server (nova_ai.py)...');
    
    const pythonCmd = isWindows ? 'python' : 'python3';
    serverProcess = spawn(pythonCmd, ['server.py'], {
        cwd: backendDir,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env }
    });
    
    serverProcess.on('error', (err) => {
        console.error('❌ Failed to start server:', err.message);
    });
    
    serverProcess.on('exit', (code) => {
        if (code !== 0) {
            console.error(`❌ Server exited with code ${code}`);
        }
    });
}

// Start Vite frontend
function startFrontend() {
    console.log('Starting Frontend (Vite on port 5173)...');
    
    // Use npx to run vite
    const cmd = isWindows ? 'npx.cmd' : 'npx';
    viteProcess = spawn(cmd, ['vite'], {
        cwd: frontendDir,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env }
    });
    
    viteProcess.on('error', (err) => {
        console.error('❌ Failed to start frontend:', err.message);
    });
    
    viteProcess.on('exit', (code) => {
        if (code !== 0) {
            console.error(`⚠️ Frontend exited with code ${code}`);
        }
        // When frontend exits, shut down everything
        if (serverProcess) {
            console.log('\n📴 Stopping backend server...');
            serverProcess.kill();
        }
        process.exit(0);
    });
}

// Start both processes
startServer();

// Give server time to initialize
setTimeout(() => {
    startFrontend();
}, 2000);

console.log('✅ System Starting...');
console.log('⏰ Press Ctrl+C to stop all services\n');
