import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const DATA_DIR = process.env.NODE_ENV === 'production' 
    ? '/app/data' 
    : path.join(process.cwd(), 'data');
  
  const DATA_FILE = path.join(DATA_DIR, 'scans.json');

  const info: any = {
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    dataDir: DATA_DIR,
    dataFile: DATA_FILE,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check if directory exists
    const dirStats = await fs.stat(DATA_DIR);
    info.directoryExists = true;
    info.directoryInfo = {
      isDirectory: dirStats.isDirectory(),
      mode: dirStats.mode.toString(8),
      created: dirStats.birthtime,
      modified: dirStats.mtime,
    };

    // List files in directory
    const files = await fs.readdir(DATA_DIR);
    info.filesInDirectory = files;

    // Check if scans.json exists
    try {
      const fileStats = await fs.stat(DATA_FILE);
      info.fileExists = true;
      info.fileInfo = {
        size: fileStats.size,
        created: fileStats.birthtime,
        modified: fileStats.mtime,
      };

      // Read file content
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      info.rawFileContent = content.substring(0, 500); // First 500 chars
      info.fileContentLength = content.length;
      
      try {
        const scans = JSON.parse(content);
        
        if (Array.isArray(scans)) {
          info.scansCount = scans.length;
          info.lastScan = scans.length > 0 ? scans[scans.length - 1] : null;
          info.contentValid = true;
        } else {
          info.contentValid = false;
          info.contentError = 'File content is not an array';
        }
      } catch (parseError: any) {
        info.contentValid = false;
        info.parseError = parseError.message;
      }
    } catch (fileError: any) {
      info.fileExists = false;
      info.fileError = fileError.message;
    }

    // Check write permissions
    try {
      const testFile = path.join(DATA_DIR, 'test-write.txt');
      await fs.writeFile(testFile, 'test', 'utf-8');
      await fs.unlink(testFile);
      info.canWrite = true;
    } catch (writeError: any) {
      info.canWrite = false;
      info.writeError = writeError.message;
    }

  } catch (dirError: any) {
    info.directoryExists = false;
    info.directoryError = dirError.message;
  }

  return NextResponse.json(info, { 
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    } 
  });
}
