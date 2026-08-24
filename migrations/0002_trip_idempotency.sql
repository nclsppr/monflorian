ALTER TABLE trips ADD COLUMN idempotency_key_hash TEXT
  CHECK (idempotency_key_hash IS NULL OR length(idempotency_key_hash) = 64);

CREATE UNIQUE INDEX trips_by_idempotency_key_hash
  ON trips (idempotency_key_hash)
  WHERE idempotency_key_hash IS NOT NULL;
