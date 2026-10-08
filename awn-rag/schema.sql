-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create extension if not exists vector;

create table if not exists chunks (
  id bigserial primary key,
  source_url text not null,
  title text,
  chunk_index int not null,
  content text not null,
  embedding vector(1024) not null,
  created_at timestamptz not null default now()
);

create index if not exists chunks_embedding_idx
  on chunks using hnsw (embedding vector_cosine_ops);
create index if not exists chunks_source_idx on chunks (source_url);

-- Access the data through the backend's database connection only.
alter table chunks enable row level security;
revoke all on table chunks from anon, authenticated;

create table if not exists query_log (
  id bigserial primary key,
  question text not null,
  answer text not null,
  source_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Questions can contain personal information; keep logs private.
alter table query_log enable row level security;
revoke all on table query_log from anon, authenticated;
