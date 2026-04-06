-- ============================================================
-- Module C: Incident Tickets, Attachments & Comments
-- Paste this in Supabase SQL Editor and run it.
-- Make sure Chanuka's `users` table and Vishwa's `resources`
-- table already exist before running this script.
-- ============================================================

-- ── Main tickets table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id      UUID REFERENCES resources(id) ON DELETE SET NULL,
    reported_by      UUID NOT NULL REFERENCES users(id),
    assigned_to      UUID REFERENCES users(id),       -- technician / staff
    title            VARCHAR(150) NOT NULL,
    category         VARCHAR(50)  NOT NULL,            -- ELECTRICAL, PLUMBING, IT, FURNITURE, OTHER
    description      TEXT NOT NULL,
    priority         VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH, CRITICAL
    status           VARCHAR(20)  NOT NULL DEFAULT 'OPEN',    -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    location         VARCHAR(150),
    contact_name     VARCHAR(100),
    contact_phone    VARCHAR(20),
    contact_email    VARCHAR(100),
    resolution_notes TEXT,
    rejection_reason TEXT,
    resolved_at      TIMESTAMPTZ,
    closed_at        TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Ticket attachments (up to 3 images per ticket) ──────────
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_url    TEXT NOT NULL,      -- Public Supabase Storage URL
    file_size   INTEGER,
    mime_type   VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ── Ticket comments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,   -- true = only staff/admin can see
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_reported_by  ON tickets(reported_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to  ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status        ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket    ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_ticket       ON ticket_comments(ticket_id);

-- ── Auto-update `updated_at` trigger ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON ticket_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed data (optional, remove in production) ──────────────
-- INSERT INTO tickets (reported_by, title, category, description, priority, status, location)
-- VALUES
--   ('<your-user-uuid>', 'Broken AC in Lab 3', 'ELECTRICAL', 'The air conditioning unit is not working.', 'HIGH', 'OPEN', 'Lab 3 - Building A');
