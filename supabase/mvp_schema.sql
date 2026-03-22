create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.mini_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course_code text not null,
  topics text[] not null default '{}',
  lesson_content text not null,
  status text not null default 'Ready' check (status in ('Generating', 'Ready', 'Shared')),
  share_token text unique not null,
  pass_percentage int not null default 70 check (pass_percentage between 1 and 100),
  expires_at timestamptz,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mini_courses_share_token on public.mini_courses (share_token);
create index if not exists idx_mini_courses_created_at on public.mini_courses (created_at desc);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  mini_course_id uuid not null references public.mini_courses(id) on delete cascade,
  title text not null,
  question_count int not null default 5,
  created_at timestamptz not null default now()
);

create index if not exists idx_quizzes_mini_course_id on public.quizzes (mini_course_id);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_option_index int not null check (correct_option_index between 0 and 3),
  order_index int not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_quiz_id on public.questions (quiz_id);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  mini_course_id uuid not null references public.mini_courses(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_name text not null,
  score int not null,
  total_questions int not null,
  percentage int not null,
  submitted_answers jsonb not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_course on public.quiz_attempts (mini_course_id);
create index if not exists idx_quiz_attempts_submitted_at on public.quiz_attempts (submitted_at desc);

create table if not exists public.material_chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid,
  course_code text not null,
  source_file text not null,
  topic text,
  chunk_index int,
  chunk_text text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists idx_material_chunks_course_code on public.material_chunks (course_code);
create index if not exists idx_material_chunks_material_id on public.material_chunks (material_id);
create index if not exists idx_material_chunks_embedding on public.material_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  course_code text not null,
  material_type text not null default 'slide' check (material_type in ('course_info', 'slide')),
  chapter text,
  topic text,
  relative_path text,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint not null default 0,
  chunk_count int not null default 0,
  status text not null default 'Active' check (status in ('Processing', 'Active', 'Failed', 'Deleted')),
  error_message text,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_materials_course_code on public.materials (course_code);
create index if not exists idx_materials_uploaded_at on public.materials (uploaded_at desc);

alter table public.materials add column if not exists material_type text not null default 'slide';
alter table public.materials add column if not exists chapter text;
alter table public.materials add column if not exists relative_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'materials_material_type_check'
  ) then
    alter table public.materials
      add constraint materials_material_type_check
      check (material_type in ('course_info', 'slide'));
  end if;
end;
$$;

alter table public.material_chunks
  add column if not exists material_id uuid;
alter table public.material_chunks
  add column if not exists chunk_index int;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'fk_material_chunks_material_id'
      and table_name = 'material_chunks'
      and table_schema = 'public'
  ) then
    alter table public.material_chunks
      add constraint fk_material_chunks_material_id
      foreign key (material_id)
      references public.materials(id)
      on delete cascade;
  end if;
end;
$$;

create or replace function public.match_material_chunks(
  query_embedding_text text,
  match_course_code text,
  match_count int default 8
)
returns table (
  id uuid,
  material_id uuid,
  source_file text,
  chunk_index int,
  chunk_text text,
  topic text,
  similarity float
)
language sql
stable
as $$
  select
    mc.id,
    mc.material_id,
    mc.source_file,
    coalesce(mc.chunk_index, 0) as chunk_index,
    mc.chunk_text,
    mc.topic,
    1 - (mc.embedding <=> (query_embedding_text::vector)) as similarity
  from public.material_chunks mc
  join public.materials m on m.id = mc.material_id
  where mc.course_code = match_course_code
    and mc.embedding is not null
    and m.status = 'Active'
  order by mc.embedding <=> (query_embedding_text::vector)
  limit greatest(match_count, 1);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_mini_courses on public.mini_courses;
create trigger trg_set_updated_at_mini_courses
before update on public.mini_courses
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_set_updated_at_materials on public.materials;
create trigger trg_set_updated_at_materials
before update on public.materials
for each row execute procedure public.set_updated_at();

alter table public.mini_courses enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.material_chunks enable row level security;
alter table public.materials enable row level security;

drop policy if exists "public_read_shared_courses" on public.mini_courses;
create policy "public_read_shared_courses"
on public.mini_courses
for select
to anon, authenticated
using (status in ('Ready', 'Shared'));

drop policy if exists "public_read_quizzes" on public.quizzes;
create policy "public_read_quizzes"
on public.quizzes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.mini_courses mc
    where mc.id = quizzes.mini_course_id
      and mc.status in ('Ready', 'Shared')
  )
);

drop policy if exists "public_read_questions" on public.questions;
create policy "public_read_questions"
on public.questions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.quizzes q
    join public.mini_courses mc on mc.id = q.mini_course_id
    where q.id = questions.quiz_id
      and mc.status in ('Ready', 'Shared')
  )
);

drop policy if exists "allow_insert_attempts" on public.quiz_attempts;
create policy "allow_insert_attempts"
on public.quiz_attempts
for insert
to anon, authenticated
with check (true);

drop policy if exists "allow_read_attempts" on public.quiz_attempts;
create policy "allow_read_attempts"
on public.quiz_attempts
for select
to anon, authenticated
using (true);

drop policy if exists "allow_read_materials" on public.materials;
create policy "allow_read_materials"
on public.materials
for select
to anon, authenticated
using (status = 'Active');

insert into storage.buckets (id, name, public)
values ('course-materials', 'course-materials', false)
on conflict (id) do nothing;

drop policy if exists "service_role_manage_course_materials" on storage.objects;
create policy "service_role_manage_course_materials"
on storage.objects
for all
to service_role
using (bucket_id = 'course-materials')
with check (bucket_id = 'course-materials');
