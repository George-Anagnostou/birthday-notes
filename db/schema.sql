-- Birthday Notes Database Schema
-- This schema is for use with Vercel Postgres

-- Create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs from Vercel Blob (stored as JSON)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create an index on timestamp for efficient sorting
CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp DESC);

-- Create an index on created_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
