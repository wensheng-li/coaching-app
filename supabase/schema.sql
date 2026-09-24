-- Session records owned by a coach.
-- One coach owns many sessions; each record is isolated by RLS.
CREATE TABLE public.sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership: session must belong to the authenticated coach.
    coach_id uuid NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Required session summary; blank titles are rejected.
    title text NOT NULL
        CHECK (length(trim(title)) > 0),

    -- Freeform notes for the coaching session.
    description text NOT NULL,

    -- Time window: start and end are stored in UTC.
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,

    -- lifecycle: scheduled -> completed/cancelled.
    status text NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'cancelled')),

    -- Audit timestamps.
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Validity: a session cannot end before it starts.
    CONSTRAINT valid_session_time
        CHECK (start_time < end_time)
);

-- Fast lookup by owner.
CREATE INDEX sessions_coach_id_idx ON public.sessions(coach_id);

-- Secure access: coaches can only access their own sessions.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = coach_id);

CREATE POLICY "Coaches can create their own sessions"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = coach_id);

CREATE POLICY "Coaches can update their own sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = coach_id);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sessions TO authenticated;