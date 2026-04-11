#!/usr/bin/env node

/**
 * Kill any process using port 8340
 * Run this before `npm start` if the port is already in use
 */

import { exec } from 'child_process';
import os from 'os';

const port = 8340;
const isWindows = os.platform() === 'win32';

function killPort() {
  if (isWindows) {
    // Windows: use netstat and taskkill
    exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
      if (error || !stdout) {
        console.log(`✅ Port ${port} is free`);
        return;
      }
      
      const lines = stdout.split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        if (pid && pid !== 'PID') {
          console.log(`🔨 Killing process ${pid} on port ${port}...`);
          exec(`taskkill /PID ${pid} /F`, (err) => {
            if (!err) {
              console.log(`✅ Process ${pid} killed successfully`);
            } else {
              console.warn(`⚠️  Could not kill process ${pid}`);
            }
          });
        }
      });
    });
  } else {
    // Linux/Mac: use lsof and kill
    exec(`lsof -ti:${port}`, (error, stdout, stderr) => {
      if (error || !stdout) {
        console.log(`✅ Port ${port} is free`);
        return;
      }
      
      const pid = stdout.trim();
      console.log(`🔨 Killing process ${pid} on port ${port}...`);
      exec(`kill -9 ${pid}`, (err) => {
        if (!err) {
          console.log(`✅ Process ${pid} killed successfully`);
        } else {
          console.warn(`⚠️  Could not kill process ${pid}`);
        }
      });
    });
  }
}

killPort();
