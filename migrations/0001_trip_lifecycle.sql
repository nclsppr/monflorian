PRAGMA foreign_keys = ON;

CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  public_token_hash TEXT NOT NULL UNIQUE CHECK (length(public_token_hash) = 64),
  status TEXT NOT NULL CHECK (
    status IN (
      'pending',
      'queued',
      'generating_itinerary',
      'generating_images',
      'ready',
      'failed',
      'deleting',
      'deleted',
      'expired'
    )
  ),
  locale TEXT NOT NULL DEFAULT 'fr',
  booking_mode TEXT NOT NULL DEFAULT 'external' CHECK (booking_mode IN ('off', 'external', 'cj-static')),
  request_ciphertext BLOB,
  request_nonce BLOB,
  result_ciphertext BLOB,
  result_nonce BLOB,
  email_ciphertext BLOB,
  email_nonce BLOB,
  workflow_instance_id TEXT UNIQUE,
  notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    notification_status IN ('pending', 'sent', 'failed', 'skipped')
  ),
  error_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  completed_at INTEGER,
  notified_at INTEGER,
  CHECK (
    (request_ciphertext IS NULL AND request_nonce IS NULL) OR
    (request_ciphertext IS NOT NULL AND request_nonce IS NOT NULL)
  ),
  CHECK (
    (result_ciphertext IS NULL AND result_nonce IS NULL) OR
    (result_ciphertext IS NOT NULL AND result_nonce IS NOT NULL)
  ),
  CHECK (
    (email_ciphertext IS NULL AND email_nonce IS NULL) OR
    (email_ciphertext IS NOT NULL AND email_nonce IS NOT NULL)
  )
) STRICT;

CREATE INDEX trips_by_status_updated_at ON trips (status, updated_at);
CREATE INDEX trips_by_expiration ON trips (expires_at) WHERE status NOT IN ('deleted', 'expired');

CREATE TABLE trip_assets (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('source_photo', 'generated_image')),
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 15),
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  checksum_sha256 TEXT NOT NULL CHECK (length(checksum_sha256) = 64),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  deleted_at INTEGER,
  UNIQUE (trip_id, kind, position)
) STRICT;

CREATE INDEX trip_assets_by_trip ON trip_assets (trip_id, kind, position);
CREATE INDEX trip_assets_by_expiration ON trip_assets (expires_at) WHERE deleted_at IS NULL;

CREATE TABLE daily_quotas (
  bucket_date TEXT NOT NULL CHECK (length(bucket_date) = 10),
  subject_hash TEXT NOT NULL CHECK (length(subject_hash) = 64),
  kind TEXT NOT NULL CHECK (kind IN ('trip', 'illustration')),
  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (bucket_date, subject_hash, kind)
) WITHOUT ROWID, STRICT;
