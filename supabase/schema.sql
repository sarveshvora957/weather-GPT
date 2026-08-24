-- WeatherGPT Cloud PostgreSQL Schema for Supabase (SIH 2026)

-- 1. Create Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    messages JSONB DEFAULT '[]'::jsonb
);

-- 2. Create Saved Locations Watchlist Table
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    admin1 TEXT,
    country TEXT NOT NULL,
    country_code TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timezone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Custom Smart Alerts Table
CREATE TABLE IF NOT EXISTS public.custom_alerts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    condition_type TEXT NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    unit TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    notify_channels JSONB DEFAULT '["in-app", "push"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Telemetry & AI Queries Table
CREATE TABLE IF NOT EXISTS public.ai_queries (
    id BIGSERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    intent TEXT,
    city TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime replication for alerts & conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations, public.custom_alerts, public.saved_locations;
