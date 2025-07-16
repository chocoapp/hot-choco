-- SQL function for vector similarity search in Supabase
-- Run this in your Supabase SQL editor to create the function

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  source_type text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  content text,
  metadata jsonb,
  embedding vector(1536),
  similarity float,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    documents.embedding,
    1 - (documents.embedding <=> query_embedding) as similarity,
    documents.created_at,
    documents.updated_at
  FROM documents
  WHERE 
    (source_type IS NULL OR documents.metadata->>'sourceType' = source_type)
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index for faster vector similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops);

-- Create index for faster metadata queries
CREATE INDEX IF NOT EXISTS documents_metadata_source_type_idx ON documents USING GIN ((metadata->>'sourceType'));
CREATE INDEX IF NOT EXISTS documents_metadata_product_idx ON documents USING GIN ((metadata->>'product'));
CREATE INDEX IF NOT EXISTS documents_metadata_section_idx ON documents USING GIN ((metadata->>'section'));
CREATE INDEX IF NOT EXISTS documents_metadata_feature_idx ON documents USING GIN ((metadata->>'feature'));
CREATE INDEX IF NOT EXISTS documents_metadata_status_category_idx ON documents USING GIN ((metadata->>'statusCategory'));