import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? '/app/data' 
  : path.join(process.cwd(), 'data');

const DATA_FILE = path.join(DATA_DIR, 'scans.json');

/**
 * POST /api/init
 * Manually initialize the storage directory and file
 * This can be called after deployment to ensure everything is set up correctly
 */
export async function POST() {
  try {
    console.log('=== STORAGE INITIALIZATION ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Data directory:', DATA_DIR);
    console.log('Data file:', DATA_FILE);

    const steps: string[] = [];
    const errors: string[] = [];

    // Step 1: Check if directory exists
    try {
      await fs.access(DATA_DIR);
      steps.push(`✅ Directory exists: ${DATA_DIR}`);
      console.log('Directory exists');
    } catch {
      steps.push(`⚠️ Directory does not exist, creating: ${DATA_DIR}`);
      console.log('Directory does not exist, creating...');
      
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        steps.push(`✅ Directory created: ${DATA_DIR}`);
        console.log('Directory created successfully');
      } catch (err) {
        const error = `❌ Failed to create directory: ${err}`;
        errors.push(error);
        console.error('Failed to create directory:', err);
      }
    }

    // Step 2: Check directory permissions
    try {
      const stats = await fs.stat(DATA_DIR);
      steps.push(`✅ Directory stats: mode=${stats.mode.toString(8)}, size=${stats.size}`);
      console.log('Directory stats:', stats);
    } catch (err) {
      const error = `❌ Failed to get directory stats: ${err}`;
      errors.push(error);
      console.error('Failed to get directory stats:', err);
    }

    // Step 3: Check if file exists
    try {
      await fs.access(DATA_FILE);
      steps.push(`✅ File exists: ${DATA_FILE}`);
      console.log('File exists');
      
      // Read existing content
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const scans = JSON.parse(content);
      steps.push(`✅ File readable, contains ${scans.length} scans`);
      console.log(`File contains ${scans.length} scans`);
    } catch {
      steps.push(`⚠️ File does not exist, creating: ${DATA_FILE}`);
      console.log('File does not exist, creating...');
      
      try {
        await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
        steps.push(`✅ File created: ${DATA_FILE}`);
        console.log('File created successfully');
      } catch (err) {
        const error = `❌ Failed to create file: ${err}`;
        errors.push(error);
        console.error('Failed to create file:', err);
      }
    }

    // Step 4: Test write permissions
    try {
      const testData = [{ test: true, timestamp: new Date().toISOString() }];
      await fs.writeFile(DATA_FILE, JSON.stringify(testData, null, 2), 'utf-8');
      steps.push(`✅ Write test successful`);
      console.log('Write test successful');
      
      // Read it back
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      steps.push(`✅ Read test successful, read ${parsed.length} items`);
      console.log('Read test successful');
      
      // Restore empty array
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
      steps.push(`✅ File reset to empty array`);
      console.log('File reset to empty array');
    } catch (err) {
      const error = `❌ Write/Read test failed: ${err}`;
      errors.push(error);
      console.error('Write/Read test failed:', err);
    }

    // Step 5: List directory contents
    try {
      const files = await fs.readdir(DATA_DIR);
      steps.push(`✅ Directory contents: ${files.join(', ') || '(empty)'}`);
      console.log('Directory contents:', files);
    } catch (err) {
      const error = `❌ Failed to list directory: ${err}`;
      errors.push(error);
      console.error('Failed to list directory:', err);
    }

    console.log('=== INITIALIZATION COMPLETE ===');
    console.log('Steps:', steps);
    console.log('Errors:', errors);

    return NextResponse.json({
      success: errors.length === 0,
      environment: process.env.NODE_ENV,
      dataDir: DATA_DIR,
      dataFile: DATA_FILE,
      steps,
      errors,
      message: errors.length === 0 
        ? 'Storage initialized successfully! You can now use the app.' 
        : 'Storage initialization had errors. Check the errors array for details.'
    });

  } catch (error) {
    console.error('Fatal error during initialization:', error);
    return NextResponse.json({
      success: false,
      error: 'Fatal error during initialization',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * GET /api/init
 * Check initialization status without making changes
 */
export async function GET() {
  const checks: string[] = [];
  
  try {
    // Check directory
    try {
      await fs.access(DATA_DIR);
      checks.push('✅ Directory exists');
    } catch {
      checks.push('❌ Directory does not exist');
    }

    // Check file
    try {
      await fs.access(DATA_FILE);
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const scans = JSON.parse(content);
      checks.push(`✅ File exists with ${scans.length} scans`);
    } catch {
      checks.push('❌ File does not exist');
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      dataDir: DATA_DIR,
      dataFile: DATA_FILE,
      checks,
      message: 'Use POST to this endpoint to initialize storage'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
