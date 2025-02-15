/*
  # Initial Schema Setup for AI Development Platform

  1. New Tables
    - `projects`
      - Project metadata and configuration
      - Stores project settings, deployment info
    - `code_generations`
      - History of AI code generation requests
      - Includes prompts, responses, and performance metrics
    - `technical_docs`
      - Documentation storage for RAG system
      - Includes vector embeddings for semantic search
    - `collaboration_sessions`
      - Real-time collaboration metadata
      - Tracks active users and their permissions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Set up proper owner-based access control

  3. Indexes
    - Add indexes for frequent query patterns
    - Optimize vector similarity searches
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  deployment_data jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON projects(owner_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);

-- Code generations table
CREATE TABLE IF NOT EXISTS code_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  user_id uuid REFERENCES auth.users(id),
  prompt text NOT NULL,
  model text NOT NULL,
  response jsonb NOT NULL,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  context jsonb DEFAULT '{}'::jsonb,
  attribution text[] DEFAULT '{}'::text[]
);

CREATE INDEX IF NOT EXISTS code_generations_project_id_idx ON code_generations(project_id);
CREATE INDEX IF NOT EXISTS code_generations_user_id_idx ON code_generations(user_id);
CREATE INDEX IF NOT EXISTS code_generations_created_at_idx ON code_generations(created_at);

-- Technical documentation table with vector embeddings
CREATE TABLE IF NOT EXISTS technical_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS technical_docs_embedding_idx ON technical_docs USING ivfflat (embedding vector_cosine_ops);

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  participants jsonb DEFAULT '[]'::jsonb,
  session_data jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS collaboration_sessions_project_id_idx ON collaboration_sessions(project_id);
CREATE INDEX IF NOT EXISTS collaboration_sessions_started_at_idx ON collaboration_sessions(started_at);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Code generations policies
CREATE POLICY "Users can view code generations for their projects"
  ON code_generations
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE owner_id = auth.uid() OR is_public = true
    )
  );

CREATE POLICY "Users can create code generations for their projects"
  ON code_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE owner_id = auth.uid()
    )
  );

-- Technical docs policies
CREATE POLICY "Everyone can view technical docs"
  ON technical_docs
  FOR SELECT
  TO authenticated
  USING (true);

-- Collaboration sessions policies
CREATE POLICY "Users can view sessions for their projects"
  ON collaboration_sessions
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE owner_id = auth.uid() OR is_public = true
    )
  );

CREATE POLICY "Users can create sessions for their projects"
  ON collaboration_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE owner_id = auth.uid()
    )
  );

-- Functions for vector similarity search
CREATE OR REPLACE FUNCTION search_technical_docs(
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    technical_docs.id,
    technical_docs.title,
    technical_docs.content,
    1 - (technical_docs.embedding <=> query_embedding) as similarity
  FROM technical_docs
  WHERE 1 - (technical_docs.embedding <=> query_embedding) > similarity_threshold
  ORDER BY technical_docs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;