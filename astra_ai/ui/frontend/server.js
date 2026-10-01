#!/usr/bin/env node

/**
 * AEGIS Server Manager
 * Manages the backend server and frontend development together.
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
const rootDir = path.join(__dirname, '..', '..', '..');

let serverProcess = null;
let viteProcess = null;
let isShuttingDown = false;
let backendFailed = false;

function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`[WARN] .env file not found at ${filePath}`);
        return;
    }

    const envContent = fs.readFileSync(filePath, 'utf-8');
    const lines = envContent.split('\n');

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
    });
}

function stopProcesses() {
    isShuttingDown = true;

    if (serverProcess) {
        console.log('Stopping backend server...');
        serverProcess.kill();
    }

    if (viteProcess) {
        console.log('Stopping frontend...');
        viteProcess.kill();
    }
}

process.on('SIGINT', () => {
    console.log('\n\n[WARN] Shutting down...');
    stopProcesses();
    process.exit(0);
});

function startServer() {
    console.log(`Starting backend server from ${backendDir}...`);

    // Always use the project's pinned environment. Using plain `python` here
    // silently starts a different interpreter and can load an older Gemini
    // SDK, which breaks Live tool/audio behavior.
    const pythonCmd = isWindows
        ? path.join(rootDir, 'astra_ai', '.venv', 'Scripts', 'python.exe')
        : path.join(rootDir, 'astra_ai', '.venv', 'bin', 'python');
    serverProcess = spawn(pythonCmd, ['server.py'], {
        cwd: backendDir,
        stdio: 'inherit',
        shell: false,
        env: { ...process.env },
    });

    console.log(`[BACKEND] Python: ${pythonCmd}`);
    console.log(`[BACKEND] Working directory: ${backendDir}`);

    serverProcess.on('error', (err) => {
        console.error('[ERROR] Failed to start server:', err.message);
    });

    serverProcess.on('exit', (code) => {
        if (isShuttingDown) {
            console.log('Backend server stopped.');
            return;
        }

        if (code !== 0 && code !== null) {
            backendFailed = true;
            console.error(`[ERROR] Server exited with code ${code}`);
            console.error('[ERROR] Frontend startup will stop because the backend did not remain running. Scroll up for the Python traceback.');
        } else if (code === null) {
            backendFailed = true;
            console.error('[ERROR] Server exited unexpectedly.');
        }
    });
}

async function waitForBackend(timeoutMs = 20000) {
    const startedAt = Date.now();
    const healthUrl = 'http://127.0.0.1:8340/api/settings/status';
    while (!backendFailed && Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(healthUrl);
            if (response.ok) {
                console.log('[BACKEND] Health check passed.');
                return true;
            }
        } catch {
            // The backend is still importing/starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (backendFailed) {
        console.error('[ERROR] Backend failed before the health check passed. Vite was not started.');
    } else {
        console.error(`[ERROR] Backend health check timed out after ${timeoutMs}ms. Vite was not started.`);
    }
    return false;
}

function startFrontend() {
    console.log('Starting frontend (Vite on port 5173)...');

    const cmd = isWindows ? 'npx.cmd' : 'npx';
    viteProcess = spawn(cmd, ['vite'], {
        cwd: frontendDir,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env },
    });

    viteProcess.on('error', (err) => {
        console.error('[ERROR] Failed to start frontend:', err.message);
    });

    viteProcess.on('exit', (code) => {
        if (code !== 0) {
            console.error(`[WARN] Frontend exited with code ${code}`);
        }
        if (serverProcess) {
            console.log('\nStopping backend server...');
            serverProcess.kill();
        }
        process.exit(0);
    });
}

loadEnv(path.join(rootDir, '.env'));

console.log('\nAegis AI UI - Starting backend server and frontend\n');
console.log('Backend Server: ws://localhost:8340/ws/voice');
console.log('Frontend UI:    http://localhost:5173/');
console.log('REST API:       http://localhost:8340/api\n');

startServer();

waitForBackend().then((ready) => {
    if (ready && !isShuttingDown) startFrontend();
});

console.log('System starting...');
console.log(`Active backend path: ${backendDir}`);
console.log('Press Ctrl+C to stop all services\n');
