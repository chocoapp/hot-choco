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
      // Test what's actually in the database for section_order_guide_management
      addResult('Testing direct query for section_order_guide_management...');
      
      // Create a direct query to see what's in the database
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: sectionData, error: sectionError } = await supabase
        .from('documents')
        .select('metadata')
        .eq('metadata->>section', 'section_order_guide_management');
      
      if (sectionError) {
        addResult(`❌ Error: ${sectionError.message}`);
      } else {
        addResult(`✅ Found ${sectionData?.length || 0} records for section_order_guide_management`);
        if (sectionData && sectionData.length > 0) {
          addResult(`Sample metadata: ${JSON.stringify(sectionData[0].metadata, null, 2)}`);
          
          // Check what product names are actually in the database
          const productNames = [...new Set(sectionData.map(item => item.metadata.product))];
          addResult(`Product names in database: ${JSON.stringify(productNames)}`);
          
          // Check the distribution of sourceTypes
          const sourceTypes = [...new Set(sectionData.map(item => item.metadata.sourceType))];
          addResult(`Source types in database: ${JSON.stringify(sourceTypes)}`);
          
          // Show count per product
          const productCounts: Record<string, number> = {};
          sectionData.forEach(item => {
            const product = item.metadata.product;
            productCounts[product] = (productCounts[product] || 0) + 1;
          });
          addResult(`Records per product: ${JSON.stringify(productCounts)}`);
        }
      }

      // Test direct query for bugs
      addResult('Testing direct bug query...');
      const { data: directBugs, error: directBugsError } = await supabase
        .from('documents')
        .select('*')
        .eq('metadata->>sourceType', 'bug')
        .eq('metadata->>product', 'product_choco')
        .eq('metadata->>section', 'section_order_guide_management');
      
      if (directBugsError) {
        addResult(`❌ Direct bug query error: ${directBugsError.message}`);
      } else {
        addResult(`✅ Direct bug query found ${directBugs?.length || 0} bugs`);
      }

      // Test direct query for docs
      addResult('Testing direct docs query...');
      const { data: directDocs, error: directDocsError } = await supabase
        .from('documents')
        .select('*')
        .eq('metadata->>sourceType', 'docs')
        .eq('metadata->>product', 'product_choco')
        .eq('metadata->>section', 'section_order_guide_management');
      
      if (directDocsError) {
        addResult(`❌ Direct docs query error: ${directDocsError.message}`);
      } else {
        addResult(`✅ Direct docs query found ${directDocs?.length || 0} docs`);
      }

      // Test getting product docs
      addResult('Testing getProductDocs...');
      const docs = await supabaseService.getProductDocs('product_choco', 'section_order_guide_management');
      addResult(`✅ Found ${docs.length} product docs for product_choco/section_order_guide_management`);
      
      // Test getting bug reports
      addResult('Testing getBugReports...');
      const bugs = await supabaseService.getBugReports('product_choco', 'section_order_guide_management');
      addResult(`✅ Found ${bugs.length} bug reports for product_choco/section_order_guide_management`);
      
      // Test getting bug count
      addResult('Testing getBugCount...');
      const bugCount = await supabaseService.getBugCount('product_choco', 'section_order_guide_management');
      addResult(`✅ Found ${bugCount} bugs for product_choco/section_order_guide_management`);
      
      // Test getBugReportsByStatus method
      addResult('Testing getBugReportsByStatus for open bugs...');
      const openBugs = await supabaseService.getBugReportsByStatus('product_ecommerce', 'open', 'section_order_guide_management', 'feature_order_guide');
      addResult(`✅ Found ${openBugs.length} open bugs for feature_order_guide`);
      if (openBugs.length > 0) {
        addResult(`Sample open bug: ${JSON.stringify(openBugs[0], null, 2)}`);
      }
      
      addResult('Testing getBugReportsByStatus for closed bugs...');
      const closedBugs = await supabaseService.getBugReportsByStatus('product_ecommerce', 'closed', 'section_order_guide_management', 'feature_order_guide');
      addResult(`✅ Found ${closedBugs.length} closed bugs for feature_order_guide`);
      if (closedBugs.length > 0) {
        addResult(`Sample closed bug: ${JSON.stringify(closedBugs[0], null, 2)}`);
      }
      
      // Test Allure TestOps integration
      addResult('Testing Allure TestOps integration...');
      const { allureService } = await import('../../lib/services');
      
      addResult('Testing getTestCases for feature_order_guide...');
      const testCases = await allureService.getTestCases('product_ecommerce', 'section_order_guide_management', 'feature_order_guide');
      addResult(`✅ Found ${testCases.length} test cases for feature_order_guide`);
      if (testCases.length > 0) {
        addResult(`Sample test case: ${JSON.stringify(testCases[0], null, 2)}`);
      }
      
      addResult('Testing getTestStats for feature_order_guide...');
      const testStats = await allureService.getTestStats('product_ecommerce', 'section_order_guide_management', 'feature_order_guide');
      addResult(`✅ Test stats: ${JSON.stringify(testStats, null, 2)}`);
      
      addResult('Testing getTestCoverage for feature_order_guide...');
      const testCoverage = await allureService.getTestCoverage('product_ecommerce', 'section_order_guide_management', 'feature_order_guide');
      addResult(`✅ Test coverage: ${JSON.stringify(testCoverage, null, 2)}`);
      
      // Test direct query with the exact parameters
      addResult('Testing direct query with exact parameters...');
      const { data: exactQuery, error: exactError } = await supabase
        .from('documents')
        .select('*')
        .eq('metadata->>sourceType', 'bug')
        .eq('metadata->>statusCategory', 'open')
        .eq('metadata->>feature', 'feature_order_guide');
      
      if (exactError) {
        addResult(`❌ Exact query error: ${exactError.message}`);
      } else {
        addResult(`✅ Exact query found ${exactQuery?.length || 0} bugs`);
        if (exactQuery && exactQuery.length > 0) {
          addResult(`Sample result: ${JSON.stringify(exactQuery[0].metadata, null, 2)}`);
        }
      }
      
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
        <h3 className="font-bold mb-2 text-gray-900">Test Results:</h3>
        {results.length === 0 ? (
          <p className="text-gray-600">Click &quot;Test Connection&quot; to run tests</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="whitespace-pre-wrap text-gray-900">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}