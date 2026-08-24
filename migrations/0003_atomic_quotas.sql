ALTER TABLE daily_quotas ADD COLUMN limit_value INTEGER NOT NULL DEFAULT 1
  CHECK (limit_value BETWEEN 1 AND 10000);

CREATE TRIGGER daily_quotas_limit_insert
BEFORE INSERT ON daily_quotas
WHEN NEW.used > NEW.limit_value
BEGIN
  SELECT RAISE(ABORT, 'quota_exceeded');
END;

CREATE TRIGGER daily_quotas_limit_update
BEFORE UPDATE OF used, limit_value ON daily_quotas
WHEN NEW.used > NEW.limit_value
BEGIN
  SELECT RAISE(ABORT, 'quota_exceeded');
END;
