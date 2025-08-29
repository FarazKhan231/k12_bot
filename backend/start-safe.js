#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { platform } from 'os';

const PORT = 8787;

async function killProcessOnPort(port) {
  try {
    console.log(`Checking for existing processes on port ${port}...`);
    
    let pids = [];
    
    if (platform() === 'win32') {
      // Windows
      try {
        const output = execSync(`netstat -aon | findstr :${port}`, { encoding: 'utf8' });
        const lines = output.split('\n').filter(line => line.trim());
        pids = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return parts[parts.length - 1];
        }).filter(pid => pid !== '0' && pid !== '');
      } catch (e) {
        // No processes found
      }
    } else {
      // macOS/Linux
      try {
        const output = execSync(`lsof -tiTCP:${port}`, { encoding: 'utf8' });
        pids = output.trim().split('\n').filter(pid => pid);
      } catch (e) {
        // No processes found
      }
    }
    
    if (pids.length > 0) {
      console.log(`Found existing process(es) on port ${port}: ${pids.join(', ')}`);
      console.log('Killing existing process(es)...');
      
      for (const pid of pids) {
        try {
          if (platform() === 'win32') {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          } else {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          }
        } catch (e) {
          console.log(`Failed to kill process ${pid}: ${e.message}`);
        }
      }
      
      // Wait a bit for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Port ${port} cleared`);
    } else {
      console.log(`Port ${port} is free`);
    }
  } catch (error) {
    console.log(`Error checking port ${port}: ${error.message}`);
  }
}

async function main() {
  await killProcessOnPort(PORT);
  
  console.log('Starting backend server...');
  
  // Start the backend
  const child = spawn('node', ['--env-file=.env', 'src/index.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error(`Failed to start backend: ${error.message}`);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    process.exit(code);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\nShutting down...');
    child.kill('SIGTERM');
  });
}

main().catch(console.error);
