-- ============================================================
-- Module C: Incident Tickets — Database Schema
-- Owner: Suchintha
-- Run this in Supabase SQL Editor
-- ============================================================

-- Main tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID,                                  -- references resources(id) — FK added later
    reported_by UUID NOT NULL,                         -- references users(id) — FK added later
    assigned_to UUID,                                  -- technician/staff
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,                     -- ELECTRICAL, PLUMBING, IT, FURNITURE, OTHER
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',    -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',        -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    location VARCHAR(150),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    resolution_notes TEXT,
    rejection_reason TEXT,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket attachments (up to 3 images per ticket)
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket comments
CREATE TABLE IF NOT EXISTS ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,                           -- references users(id) — FK added later
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_reported_by ON tickets(reported_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);

-- ============================================================
-- Add these FK constraints AFTER Chanuka creates users table
-- and Vishwa creates resources table:
-- ============================================================
-- ALTER TABLE tickets ADD CONSTRAINT fk_tickets_reported_by
--     FOREIGN KEY (reported_by) REFERENCES users(id);
-- ALTER TABLE tickets ADD CONSTRAINT fk_tickets_assigned_to
--     FOREIGN KEY (assigned_to) REFERENCES users(id);
-- ALTER TABLE tickets ADD CONSTRAINT fk_tickets_resource
--     FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL;
-- ALTER TABLE ticket_comments ADD CONSTRAINT fk_comments_author
--     FOREIGN KEY (author_id) REFERENCES users(id);

-- ============================================================
-- Enable Row Level Security (optional, for Supabase best practices)
-- ============================================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service role (backend handles auth)
CREATE POLICY "Allow all for service role" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON ticket_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON ticket_comments FOR ALL USING (true) WITH CHECK (true);
