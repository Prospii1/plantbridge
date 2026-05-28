-- Enable pgvector for embedding similarity search
-- down: drop extension if exists vector;

create extension if not exists vector;
