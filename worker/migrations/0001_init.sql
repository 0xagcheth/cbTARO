CREATE TABLE IF NOT EXISTS user_stats (
  fid INTEGER PRIMARY KEY,
  wallet TEXT,
  total_readings INTEGER NOT NULL DEFAULT 0,
  one_card_count INTEGER NOT NULL DEFAULT 0,
  three_card_count INTEGER NOT NULL DEFAULT 0,
  custom_count INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_visit_day_key TEXT,
  first_seen_ts INTEGER,
  last_seen_ts INTEGER
);

CREATE INDEX IF NOT EXISTS idx_wallet ON user_stats(wallet);
CREATE INDEX IF NOT EXISTS idx_last_visit_day_key ON user_stats(last_visit_day_key);

