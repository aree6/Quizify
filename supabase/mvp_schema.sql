-- =============================================================================
-- QUIZIFY MVP SCHEMA - Clean Implementation
-- Run this in Supabase SQL Editor to initialize the complete database
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- MATERIALS TABLE - Core for course content storage
-- =============================================================================
DROP TABLE IF EXISTS public.materials CASCADE;

CREATE TABLE public.materials (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code text NOT NULL,
    material_type text NOT NULL DEFAULT 'slide' CHECK (material_type IN ('slide', 'course_info')),
    chapter text,
    chapter_item_label text,
    file_name text NOT NULL,
    storage_path text NOT NULL UNIQUE,
    mime_type text,
    file_size bigint NOT NULL DEFAULT 0,
    chunk_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'Processing' CHECK (status IN ('Processing', 'Active', 'Failed', 'Deleted')),
    error_message text,
    uploaded_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes for materials
CREATE INDEX idx_materials_course_code ON public.materials (course_code);
CREATE INDEX idx_materials_status ON public.materials (status);
CREATE INDEX idx_materials_uploaded_at ON public.materials (uploaded_at DESC);
CREATE INDEX idx_materials_material_type ON public.materials (material_type);
CREATE INDEX idx_materials_chapter ON public.materials (chapter);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_materials ON public.materials;
CREATE TRIGGER trg_set_updated_at_materials
    BEFORE UPDATE ON public.materials
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- MATERIAL CHUNKS TABLE - RAG text chunks with embeddings
-- =============================================================================
DROP TABLE IF EXISTS public.material_chunks CASCADE;

CREATE TABLE public.material_chunks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
    course_code text NOT NULL,
    source_file text NOT NULL,
    chapter text,
    chunk_index integer,
    chunk_text text NOT NULL,
    embedding vector(1536),
    created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes for material chunks
CREATE INDEX idx_material_chunks_course_code ON public.material_chunks (course_code);
CREATE INDEX idx_material_chunks_material_id ON public.material_chunks (material_id);
CREATE INDEX idx_material_chunks_embedding ON public.material_chunks 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- MINI COURSES TABLE - Generated courses
-- =============================================================================
DROP TABLE IF EXISTS public.mini_courses CASCADE;

CREATE TABLE public.mini_courses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    course_code text NOT NULL,
    topics text[] NOT NULL DEFAULT '{}',
    lesson_content text NOT NULL,
    status text NOT NULL DEFAULT 'Ready' CHECK (status IN ('Generating', 'Ready', 'Shared')),
    share_token text UNIQUE NOT NULL,
    pass_percentage integer NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 1 AND 100),
    expires_at timestamptz,
    created_by_name text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mini_courses_share_token ON public.mini_courses (share_token);
CREATE INDEX idx_mini_courses_created_at ON public.mini_courses (created_at DESC);

DROP TRIGGER IF EXISTS trg_set_updated_at_mini_courses ON public.mini_courses;
CREATE TRIGGER trg_set_updated_at_mini_courses
    BEFORE UPDATE ON public.mini_courses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- QUIZZES TABLE
-- =============================================================================
DROP TABLE IF EXISTS public.quizzes CASCADE;

CREATE TABLE public.quizzes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    mini_course_id uuid NOT NULL REFERENCES public.mini_courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    question_count integer NOT NULL DEFAULT 5,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_mini_course_id ON public.quizzes (mini_course_id);

-- =============================================================================
-- QUESTIONS TABLE
-- =============================================================================
DROP TABLE IF EXISTS public.questions CASCADE;

CREATE TABLE public.questions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    prompt text NOT NULL,
    option_a text,
    option_b text,
    option_c text,
    option_d text,
    correct_option_index integer NOT NULL CHECK (correct_option_index BETWEEN 0 AND 3),
    order_index integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_quiz_id ON public.questions (quiz_id);

-- =============================================================================
-- QUIZ ATTEMPTS TABLE
-- =============================================================================
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;

CREATE TABLE public.quiz_attempts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    mini_course_id uuid NOT NULL REFERENCES public.mini_courses(id) ON DELETE CASCADE,
    quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_name text NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    percentage integer NOT NULL,
    submitted_answers jsonb NOT NULL,
    submitted_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_course ON public.quiz_attempts (mini_course_id);
CREATE INDEX idx_quiz_attempts_submitted_at ON public.quiz_attempts (submitted_at DESC);

-- =============================================================================
-- VECTOR SEARCH FUNCTION - Semantic similarity search
-- =============================================================================
DROP FUNCTION IF EXISTS public.match_material_chunks;

CREATE OR REPLACE FUNCTION public.match_material_chunks(
    query_embedding_text text,
    match_course_code text,
    match_count int DEFAULT 8
)
RETURNS TABLE (
    id uuid,
    material_id uuid,
    source_file text,
    chapter text,
    chunk_index int,
    chunk_text text,
    similarity float
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        mc.id,
        mc.material_id,
        mc.source_file,
        mc.chapter,
        COALESCE(mc.chunk_index, 0) as chunk_index,
        mc.chunk_text,
        1 - (mc.embedding <=> (query_embedding_text::vector)) as similarity
    FROM public.material_chunks mc
    JOIN public.materials m ON m.id = mc.material_id
    WHERE mc.course_code = match_course_code
      AND mc.embedding IS NOT NULL
      AND m.status = 'Active'
    ORDER BY mc.embedding <=> (query_embedding_text::vector)
    LIMIT GREATEST(match_count, 1);
$$;

-- =============================================================================
-- STORAGE SETUP
-- =============================================================================

-- Create storage bucket (correct Supabase storage schema)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Materials: Service role full access, anon can read active materials
DROP POLICY IF EXISTS "materials_service_role_all" ON public.materials;
CREATE POLICY "materials_service_role_all" ON public.materials
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "materials_anon_read_active" ON public.materials;
CREATE POLICY "materials_anon_read_active" ON public.materials
    FOR SELECT TO anon, authenticated
    USING (status = 'Active');

-- Material chunks: Service role full access, anon read for active materials
DROP POLICY IF EXISTS "material_chunks_service_role_all" ON public.material_chunks;
CREATE POLICY "material_chunks_service_role_all" ON public.material_chunks
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "material_chunks_anon_read" ON public.material_chunks;
CREATE POLICY "material_chunks_anon_read" ON public.material_chunks
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.materials m
            WHERE m.id = material_chunks.material_id AND m.status = 'Active'
        )
    );

-- Mini courses: Public read for Ready/Shared, service role full access
DROP POLICY IF EXISTS "mini_courses_public_read" ON public.mini_courses;
CREATE POLICY "mini_courses_public_read" ON public.mini_courses
    FOR SELECT TO anon, authenticated
    USING (status IN ('Ready', 'Shared'));

DROP POLICY IF EXISTS "mini_courses_service_role_all" ON public.mini_courses;
CREATE POLICY "mini_courses_service_role_all" ON public.mini_courses
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Quizzes: Public read for shared courses
DROP POLICY IF EXISTS "quizzes_public_read" ON public.quizzes;
CREATE POLICY "quizzes_public_read" ON public.quizzes
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.mini_courses mc
            WHERE mc.id = quizzes.mini_course_id AND mc.status IN ('Ready', 'Shared')
        )
    );

DROP POLICY IF EXISTS "quizzes_service_role_all" ON public.quizzes;
CREATE POLICY "quizzes_service_role_all" ON public.quizzes
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Questions: Public read for shared courses
DROP POLICY IF EXISTS "questions_public_read" ON public.questions;
CREATE POLICY "questions_public_read" ON public.questions
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            JOIN public.mini_courses mc ON mc.id = q.mini_course_id
            WHERE q.id = questions.quiz_id AND mc.status IN ('Ready', 'Shared')
        )
    );

DROP POLICY IF EXISTS "questions_service_role_all" ON public.questions;
CREATE POLICY "questions_service_role_all" ON public.questions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Quiz attempts: Everyone can insert/submit, service role can read
DROP POLICY IF EXISTS "quiz_attempts_insert" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "quiz_attempts_read" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_read" ON public.quiz_attempts
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "quiz_attempts_service_role_all" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_service_role_all" ON public.quiz_attempts
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Storage: Service role full access
DROP POLICY IF EXISTS "storage_service_role_all" ON storage.objects;
CREATE POLICY "storage_service_role_all" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'course-materials')
    WITH CHECK (bucket_id = 'course-materials');

-- =============================================================================
-- VERIFICATION
-- =============================================================================
SELECT 
    'Materials table columns' as check_name,
    column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'materials' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'Material chunks table columns' as check_name,
    column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'material_chunks' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Schema setup complete!' as status;