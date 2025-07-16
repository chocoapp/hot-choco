# Supabase Integration Setup Guide

This guide will help you connect your existing Supabase table with the Hot Choco application.

## Prerequisites

- Supabase project with your existing table containing:
  - `content` column (text)
  - `embedding` column (vector)
  - `metadata` column (jsonb) with your structure

## Step 1: Environment Configuration

1. Copy the environment example file:
```bash
cp .env.local.example .env.local
```

2. Fill in your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_TABLE_NAME=your_table_name_here
```

## Step 2: Database Setup

1. **Create the vector similarity function** in your Supabase SQL editor:
   - Copy the contents of `supabase/functions/match_documents.sql`
   - Run it in your Supabase SQL editor

2. **Ensure your table has the correct structure**:
```sql
-- Your table should look like this:
CREATE TABLE documents (
  id text PRIMARY KEY,
  content text,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## Step 3: Verify Your Metadata Structure

The application expects your metadata to have this structure:
```json
{
  "product": "product_crm",
  "section": "section_customer_table", 
  "feature": "feature_customer_table",
  "sourceType": "docs" | "bugs",
  "source": "BUGS-6952",
  "status": "Not a bug",
  "statusCategory": "closed",
  "team": "CRM",
  "date": "2025-06-25",
  "issueType": "security",
  "blobType": "text/plain",
  "loc": {
    "lines": {
      "from": 1,
      "to": 1
    }
  }
}
```

## Step 4: Test the Connection

1. **Install dependencies**:
```bash
npm install
```

2. **Start the development server**:
```bash
npm run dev
```

3. **Check the console**:
   - If configured correctly, you'll see: "Using real Supabase service"
   - If not configured, you'll see: "Using mock Supabase service"

4. **Test the integration**:
   - Navigate to `/graph`
   - Open browser console
   - You should see API calls to your Supabase table

## Step 5: Map Your Data to Flow Screens

Update your `flow.json` to match your actual product/section/feature structure:

```json
{
  "nodes": [
    {
      "id": "your_screen_id",
      "type": "circularNode",
      "data": {
        "product": "product_crm",
        "section": "section_customer_table",
        "feature": "feature_customer_table"
      }
    }
  ]
}
```

## API Usage Examples

Once connected, you can use the services programmatically:

```typescript
import { supabaseService } from './lib/supabase';

// Get bug reports for a specific feature
const bugs = await supabaseService.getBugReports('product_crm', 'section_customer_table', 'feature_customer_table');

// Get documentation for a product
const docs = await supabaseService.getProductDocs('product_crm');

// Search across all content
const results = await supabaseService.searchBugReports('security issue', 'product_crm');

// Get bug count for risk calculation
const bugCount = await supabaseService.getBugCount('product_crm', 'section_customer_table');
```

## Data Mapping

The service automatically maps your data structure to the application's interface:

### Bug Reports:
- `metadata.source` → `title`
- `content` → `description`
- `metadata.issueType` → `severity` (mapped to low/medium/high/critical)
- `metadata.status` → `status` (mapped to open/in-progress/resolved/closed)
- `metadata.statusCategory` → Used for bug counting (only 'open', 'new' count as active bugs)

### Documentation:
- `metadata.source` → `title`
- `content` → `documentation`
- `metadata.team` → `team`
- `metadata.date` → `lastUpdated`

## Vector Search Integration

If you want to use vector similarity search for better content matching:

1. **Ensure your embeddings are properly generated** (1536 dimensions for OpenAI embeddings)
2. **Use the vector search method**:
```typescript
const similarContent = await supabaseService.searchSimilarContent(
  'search query',
  queryEmbedding,
  'docs', // or 'bugs'
  10 // limit
);
```

## Troubleshooting

### Common Issues:

1. **"Using mock Supabase service"**: Check your environment variables
2. **Database connection errors**: Verify your Supabase URL and keys
3. **No data returned**: Check your table name and metadata structure
4. **Vector search not working**: Ensure the SQL function is created and embeddings exist

### Debug Mode:

Add this to your service calls to see detailed logs:
```typescript
const bugs = await supabaseService.getBugReports('product_crm');
console.log('Bug reports:', bugs);
```

### Performance Optimization:

- The service includes proper indexing for metadata queries
- Vector search is optimized with ivfflat index
- Queries are filtered by sourceType for better performance

## Next Steps

Once connected, you can:
1. View real-time quality metrics in the flow visualization
2. Click on nodes to see actual bug reports and documentation
3. Use the risk calculation with real bug counts
4. Implement real-time updates with Supabase subscriptions
5. Add more sophisticated vector search capabilities

The application will automatically switch from mock data to real data once your Supabase connection is configured!