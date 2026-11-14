-- ==============================================================================
-- TerraTwin Supabase PostgreSQL Migration
-- Migration Name: 20261115000000_create_cloud_research_workspace.sql
-- Description: User-specific Cloud Research Workspace tables for reproducible
--              research assessment records, immutable snapshot revisions,
--              follow-up validation tasks, and user-authored research notes
--              with strict Row Level Security (SELECT, INSERT, UPDATE, DELETE).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: research_records
-- Stores the parent research assessment context per authenticated user and
-- (candidateId, targetId, missionProfileId) context key.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    record_id TEXT NOT NULL,
    context_key TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    target_id TEXT NOT NULL,
    mission_profile_id TEXT NOT NULL,
    active_revision_number INTEGER NOT NULL DEFAULT 1,
    active_snapshot_id TEXT NOT NULL,
    active_snapshot JSONB NOT NULL,
    storage_mode TEXT NOT NULL DEFAULT 'supabase-cloud-rls-and-local-cache',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT uq_research_records_user_context UNIQUE (user_id, context_key),
    CONSTRAINT uq_research_records_user_record_id UNIQUE (user_id, record_id),
    CONSTRAINT chk_research_records_revision_positive CHECK (active_revision_number >= 1),
    CONSTRAINT chk_research_records_schema_version CHECK ((active_snapshot->>'schemaVersion') = '1.0.0'),
    CONSTRAINT chk_research_records_digest_format CHECK ((active_snapshot->>'contentDigest') LIKE 'fnv64-%'),
    CONSTRAINT chk_research_records_live_unverified CHECK (
        (active_snapshot->>'candidateSourceKind') IS DISTINCT FROM 'live-grid-cell'
        OR (active_snapshot->>'isVerified')::boolean = false
    )
);

-- ------------------------------------------------------------------------------
-- 2. Table: research_assessment_revisions
-- Append-only, immutable historical snapshots for each research record.
-- Historical revisions may never be overwritten or mutated in place.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_assessment_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    research_record_uuid UUID NOT NULL REFERENCES public.research_records(id) ON DELETE CASCADE,
    record_id TEXT NOT NULL,
    context_key TEXT NOT NULL,
    revision_number INTEGER NOT NULL,
    label TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    schema_version TEXT NOT NULL DEFAULT '1.0.0',
    content_digest TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT uq_research_revisions_record_rev UNIQUE (research_record_uuid, revision_number),
    CONSTRAINT uq_research_revisions_user_snapshot UNIQUE (user_id, snapshot_id),
    CONSTRAINT chk_research_revisions_rev_positive CHECK (revision_number >= 1),
    CONSTRAINT chk_research_revisions_schema_version CHECK (
        schema_version = '1.0.0' AND (snapshot->>'schemaVersion') = '1.0.0'
    ),
    CONSTRAINT chk_research_revisions_digest_match CHECK (
        content_digest LIKE 'fnv64-%' AND (snapshot->>'contentDigest') = content_digest
    ),
    CONSTRAINT chk_research_revisions_live_unverified CHECK (
        (snapshot->>'candidateSourceKind') IS DISTINCT FROM 'live-grid-cell'
        OR (snapshot->>'isVerified')::boolean = false
    )
);

-- Immutability Trigger: block any UPDATE on existing assessment revision rows
CREATE OR REPLACE FUNCTION public.prevent_research_revision_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'Historical research assessment revisions are immutable and cannot be modified (snapshot_id: %). Append a new revision instead.', OLD.snapshot_id
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_research_revision_mutation ON public.research_assessment_revisions;
CREATE TRIGGER trg_prevent_research_revision_mutation
    BEFORE UPDATE ON public.research_assessment_revisions
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_research_revision_mutation();

-- ------------------------------------------------------------------------------
-- 3. Table: research_tasks
-- Stores operational follow-up research tasks tied to a research record.
-- Completing a workflow task never upgrades scientific verification status.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    research_record_uuid UUID NOT NULL REFERENCES public.research_records(id) ON DELETE CASCADE,
    record_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    title TEXT NOT NULL,
    scientific_rationale TEXT NOT NULL,
    related_gap TEXT NOT NULL,
    driver_feature TEXT,
    suggested_observation_method TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'identified',
    observation_status TEXT NOT NULL DEFAULT 'recommended-not-completed',
    owner TEXT,
    notes TEXT,
    source_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,

    CONSTRAINT uq_research_tasks_record_task UNIQUE (research_record_uuid, task_id),
    CONSTRAINT chk_research_tasks_priority CHECK (priority IN ('critical', 'high', 'moderate')),
    CONSTRAINT chk_research_tasks_status CHECK (
        status IN (
            'identified',
            'evidence-review',
            'follow-up-planned',
            'observation-pending',
            'evidence-reviewed',
            'closed'
        )
    ),
    CONSTRAINT chk_research_tasks_observation_status CHECK (
        observation_status = 'recommended-not-completed'
    ),
    CONSTRAINT chk_research_tasks_owner_len CHECK (owner IS NULL OR char_length(owner) <= 80),
    CONSTRAINT chk_research_tasks_notes_len CHECK (notes IS NULL OR char_length(notes) <= 500)
);

-- ------------------------------------------------------------------------------
-- 4. Table: research_notes
-- Stores user-authored research notes, strictly isolated from measured telemetry.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    research_record_uuid UUID NOT NULL REFERENCES public.research_records(id) ON DELETE CASCADE,
    record_id TEXT NOT NULL,
    note_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'user-authored-research-note',
    related_feature TEXT NOT NULL DEFAULT 'general',
    user_supplied_source_url TEXT,
    linked_task_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT uq_research_notes_record_note UNIQUE (research_record_uuid, note_id),
    CONSTRAINT chk_research_notes_author_role CHECK (author_role = 'user-authored-research-note'),
    CONSTRAINT chk_research_notes_title_len CHECK (char_length(title) >= 1 AND char_length(title) <= 160),
    CONSTRAINT chk_research_notes_body_len CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
    CONSTRAINT chk_research_notes_url_scheme CHECK (
        user_supplied_source_url IS NULL OR user_supplied_source_url ~ '^https?://'
    )
);

-- ------------------------------------------------------------------------------
-- 5. Indexes for Fast User-Scoped Retrieval
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_research_records_user_updated
    ON public.research_records(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_records_user_context
    ON public.research_records(user_id, context_key);
CREATE INDEX IF NOT EXISTS idx_research_revisions_record_num
    ON public.research_assessment_revisions(research_record_uuid, revision_number ASC);
CREATE INDEX IF NOT EXISTS idx_research_revisions_user
    ON public.research_assessment_revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_tasks_record
    ON public.research_tasks(research_record_uuid);
CREATE INDEX IF NOT EXISTS idx_research_tasks_user
    ON public.research_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_record
    ON public.research_notes(research_record_uuid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_notes_user
    ON public.research_notes(user_id);

-- ------------------------------------------------------------------------------
-- 6. Strict Row Level Security (RLS) Policies
-- Anonymous users have zero access. Authenticated users can only SELECT, INSERT,
-- UPDATE, or DELETE rows where user_id = auth.uid() and parent records belong
-- to auth.uid().
-- ------------------------------------------------------------------------------
ALTER TABLE public.research_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.research_assessment_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_assessment_revisions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.research_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_tasks FORCE ROW LEVEL SECURITY;

ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.research_records FROM anon;
REVOKE ALL ON public.research_assessment_revisions FROM anon;
REVOKE ALL ON public.research_tasks FROM anon;
REVOKE ALL ON public.research_notes FROM anon;

REVOKE UPDATE ON public.research_assessment_revisions FROM authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_records TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.research_assessment_revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_notes TO authenticated;

-- Policies: public.research_records
DROP POLICY IF EXISTS "Users select own research_records" ON public.research_records;
CREATE POLICY "Users select own research_records"
    ON public.research_records
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own research_records" ON public.research_records;
CREATE POLICY "Users insert own research_records"
    ON public.research_records
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own research_records" ON public.research_records;
CREATE POLICY "Users update own research_records"
    ON public.research_records
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own research_records" ON public.research_records;
CREATE POLICY "Users delete own research_records"
    ON public.research_records
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Policies: public.research_assessment_revisions (Immutable: SELECT, INSERT, DELETE only)
DROP POLICY IF EXISTS "Users select own research_assessment_revisions" ON public.research_assessment_revisions;
CREATE POLICY "Users select own research_assessment_revisions"
    ON public.research_assessment_revisions
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own research_assessment_revisions" ON public.research_assessment_revisions;
CREATE POLICY "Users insert own research_assessment_revisions"
    ON public.research_assessment_revisions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.research_records r
            WHERE r.id = research_record_uuid
              AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users delete own research_assessment_revisions" ON public.research_assessment_revisions;
CREATE POLICY "Users delete own research_assessment_revisions"
    ON public.research_assessment_revisions
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Policies: public.research_tasks
DROP POLICY IF EXISTS "Users select own research_tasks" ON public.research_tasks;
CREATE POLICY "Users select own research_tasks"
    ON public.research_tasks
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own research_tasks" ON public.research_tasks;
CREATE POLICY "Users insert own research_tasks"
    ON public.research_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.research_records r
            WHERE r.id = research_record_uuid
              AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users update own research_tasks" ON public.research_tasks;
CREATE POLICY "Users update own research_tasks"
    ON public.research_tasks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.research_records r
            WHERE r.id = research_record_uuid
              AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users delete own research_tasks" ON public.research_tasks;
CREATE POLICY "Users delete own research_tasks"
    ON public.research_tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Policies: public.research_notes
DROP POLICY IF EXISTS "Users select own research_notes" ON public.research_notes;
CREATE POLICY "Users select own research_notes"
    ON public.research_notes
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own research_notes" ON public.research_notes;
CREATE POLICY "Users insert own research_notes"
    ON public.research_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.research_records r
            WHERE r.id = research_record_uuid
              AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users update own research_notes" ON public.research_notes;
CREATE POLICY "Users update own research_notes"
    ON public.research_notes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.research_records r
            WHERE r.id = research_record_uuid
              AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users delete own research_notes" ON public.research_notes;
CREATE POLICY "Users delete own research_notes"
    ON public.research_notes
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
