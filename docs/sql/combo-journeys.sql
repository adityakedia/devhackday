-- Apply manually to the Neon database used by the Combo Worker.
CREATE TABLE IF NOT EXISTS combo_journeys (
  id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
