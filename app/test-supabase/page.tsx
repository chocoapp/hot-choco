'use client';

import { useState } from 'react';
import { supabaseService } from '../../lib/supabase';

export default function TestSupabasePage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);
    
    addResult('🔍 Testing Supabase connection...');

    try {
      // Test getting product docs
      addResult('Testing getProductDocs...');
      const docs = await supabaseService.getProductDocs('authentication');
      addResult(`✅ Found ${docs.length} product docs for authentication`);
      
      // Test getting bug reports
      addResult('Testing getBugReports...');
      const bugs = await supabaseService.getBugReports('ordering-system');
      addResult(`✅ Found ${bugs.length} bug reports for ordering-system`);
      
      // Test getting bug count
      addResult('Testing getBugCount...');
      const bugCount = await supabaseService.getBugCount('ordering-system');
      addResult(`✅ Found ${bugCount} bugs for ordering-system`);
      
      // Test search functionality
      addResult('Testing searchProductDocs...');
      const searchResults = await supabaseService.searchProductDocs('login');
      addResult(`✅ Found ${searchResults.length} search results for 'login'`);
      
      addResult('🎉 All tests completed successfully!');
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg mb-6"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
        <h3 className="font-bold mb-2">Test Results:</h3>
        {results.length === 0 ? (
          <p className="text-gray-500">Click &quot;Test Connection&quot; to run tests</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}