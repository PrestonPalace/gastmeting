'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [initResult, setInitResult] = useState<string>('');
  const [debugResult, setDebugResult] = useState<string>('');
  const [scansResult, setScansResult] = useState<string>('');
  const [clearResult, setClearResult] = useState<string>('');

  const initializeStorage = async () => {
    setInitResult('⏳ Initializing storage...');
    try {
      const response = await fetch('/api/init', { method: 'POST' });
      const data = await response.json();
      setInitResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setInitResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const checkDebug = async () => {
    setDebugResult('⏳ Checking status...');
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      setDebugResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setDebugResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const viewScans = async () => {
    setScansResult('⏳ Loading scans...');
    try {
      const response = await fetch('/api/scans');
      const data = await response.json();
      setScansResult(JSON.stringify({ count: data.length, scans: data }, null, 2));
    } catch (error) {
      setScansResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearData = async () => {
    if (!confirm('Are you sure? This will delete ALL scan data permanently!')) {
      return;
    }
    
    setClearResult('⏳ Clearing data...');
    try {
      const response = await fetch('/api/scans', { method: 'DELETE' });
      if (response.ok) {
        setClearResult('✅ All data cleared successfully');
      } else {
        throw new Error('Failed to clear data');
      }
    } catch (error) {
      setClearResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-accent">
          🔧 Admin & Diagnostics
        </h1>

        {/* Initialize Storage */}
        <section className="bg-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-secondary">
            Initialize Storage
          </h2>
          <p className="mb-4 text-gray-200">
            Click this button to set up the storage directory and file. 
            This will create /app/data/scans.json if it doesn&apos;t exist.
          </p>
          <button
            onClick={initializeStorage}
            className="bg-accent text-primary px-6 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
          >
            🚀 Initialize Storage
          </button>
          {initResult && (
            <pre className="mt-4 p-4 rounded bg-black/30 text-sm overflow-auto">
              {initResult}
            </pre>
          )}
        </section>

        {/* Check Debug Info */}
        <section className="bg-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-secondary">
            Debug Information
          </h2>
          <p className="mb-4 text-gray-200">
            View current storage status and configuration.
          </p>
          <button
            onClick={checkDebug}
            className="bg-secondary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
          >
            📊 Check Status
          </button>
          {debugResult && (
            <pre className="mt-4 p-4 rounded bg-black/30 text-sm overflow-auto">
              {debugResult}
            </pre>
          )}
        </section>

        {/* View All Scans */}
        <section className="bg-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-secondary">
            View All Scans
          </h2>
          <p className="mb-4 text-gray-200">
            See all stored scan data.
          </p>
          <button
            onClick={viewScans}
            className="bg-secondary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
          >
            📋 View Scans
          </button>
          {scansResult && (
            <pre className="mt-4 p-4 rounded bg-black/30 text-sm overflow-auto">
              {scansResult}
            </pre>
          )}
        </section>

        {/* Clear All Data */}
        <section className="bg-red-900/30 border border-red-500 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-red-400">
            ⚠️ Danger Zone
          </h2>
          <p className="mb-4 text-gray-200">
            Clear all scan data. This cannot be undone!
          </p>
          <button
            onClick={clearData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            🗑️ Clear All Data
          </button>
          {clearResult && (
            <pre className="mt-4 p-4 rounded bg-black/30 text-sm overflow-auto">
              {clearResult}
            </pre>
          )}
        </section>

        {/* Back to App */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-white/10 px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
          >
            ← Back to App
          </a>
        </div>
      </div>
    </div>
  );
}
