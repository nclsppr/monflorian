export interface StoredTrip {
  id: string;
  public_token_hash: string;
  status: string;
  request_ciphertext: ArrayBuffer | null;
  request_nonce: ArrayBuffer | null;
  result_ciphertext: ArrayBuffer | null;
  result_nonce: ArrayBuffer | null;
  email_ciphertext: ArrayBuffer | null;
  email_nonce: ArrayBuffer | null;
  notification_status: string;
  error_code: string | null;
  created_at: number;
  updated_at: number;
  expires_at: number;
  completed_at: number | null;
}

export interface StoredAsset {
  id: string;
  trip_id: string;
  kind: "source_photo" | "generated_image";
  position: number;
  object_key: string;
  content_type: "image/png" | "image/webp";
  size_bytes: number;
  checksum_sha256: string;
  created_at: number;
  expires_at: number;
  deleted_at: number | null;
}

interface NewTrip {
  id: string;
  publicTokenHash: string;
  idempotencyKeyHash: string;
  requestCiphertext: Uint8Array;
  requestNonce: Uint8Array;
  emailCiphertext: Uint8Array;
  emailNonce: Uint8Array;
  bookingMode: string;
  createdAt: number;
  expiresAt: number;
}

interface NewAsset {
  id: string;
  tripId: string;
  kind: "source_photo" | "generated_image";
  position: number;
  objectKey: string;
  contentType: "image/png" | "image/webp";
  sizeBytes: number;
  checksumSha256: string;
  createdAt: number;
  expiresAt: number;
}

export async function findTripByIdempotencyHash(
  db: D1Database,
  idempotencyKeyHash: string,
): Promise<StoredTrip | null> {
  return db.prepare(
    `SELECT id, public_token_hash, status, request_ciphertext, request_nonce,
            result_ciphertext, result_nonce, email_ciphertext, email_nonce,
            notification_status, error_code, created_at, updated_at, expires_at, completed_at
       FROM trips
      WHERE idempotency_key_hash = ?1`,
  ).bind(idempotencyKeyHash).first<StoredTrip>();
}

export async function findTripByTokenHash(
  db: D1Database,
  publicTokenHash: string,
): Promise<StoredTrip | null> {
  return db.prepare(
    `SELECT id, public_token_hash, status, request_ciphertext, request_nonce,
            result_ciphertext, result_nonce, email_ciphertext, email_nonce,
            notification_status, error_code, created_at, updated_at, expires_at, completed_at
       FROM trips
      WHERE public_token_hash = ?1`,
  ).bind(publicTokenHash).first<StoredTrip>();
}

export async function insertTrip(db: D1Database, trip: NewTrip): Promise<void> {
  await db.prepare(
    `INSERT INTO trips (
       id, public_token_hash, idempotency_key_hash, status, locale, booking_mode,
       request_ciphertext, request_nonce, email_ciphertext, email_nonce,
       notification_status, created_at, updated_at, expires_at
     ) VALUES (?1, ?2, ?3, 'pending', 'fr', ?4, ?5, ?6, ?7, ?8, 'pending', ?9, ?9, ?10)`,
  ).bind(
    trip.id,
    trip.publicTokenHash,
    trip.idempotencyKeyHash,
    trip.bookingMode,
    trip.requestCiphertext,
    trip.requestNonce,
    trip.emailCiphertext,
    trip.emailNonce,
    trip.createdAt,
    trip.expiresAt,
  ).run();
}

export async function insertAssets(db: D1Database, assets: NewAsset[]): Promise<void> {
  if (!assets.length) return;
  await db.batch(assets.map((asset) => db.prepare(
    `INSERT INTO trip_assets (
       id, trip_id, kind, position, object_key, content_type, size_bytes,
       checksum_sha256, created_at, expires_at
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
  ).bind(
    asset.id,
    asset.tripId,
    asset.kind,
    asset.position,
    asset.objectKey,
    asset.contentType,
    asset.sizeBytes,
    asset.checksumSha256,
    asset.createdAt,
    asset.expiresAt,
  )));
}

export async function markTripQueued(
  db: D1Database,
  tripId: string,
  workflowInstanceId: string,
  now: number,
): Promise<void> {
  await db.prepare(
    `UPDATE trips
        SET status = 'queued', workflow_instance_id = ?2, updated_at = ?3
      WHERE id = ?1 AND status = 'pending'`,
  ).bind(tripId, workflowInstanceId, now).run();
}

export async function markTripFailed(
  db: D1Database,
  tripId: string,
  errorCode: string,
  now: number,
): Promise<void> {
  await db.prepare(
    `UPDATE trips
        SET status = 'failed', error_code = ?2, updated_at = ?3
      WHERE id = ?1 AND status NOT IN ('deleted', 'expired')`,
  ).bind(tripId, errorCode, now).run();
}

export async function listTripAssets(db: D1Database, tripId: string): Promise<StoredAsset[]> {
  const result = await db.prepare(
    `SELECT id, trip_id, kind, position, object_key, content_type, size_bytes,
            checksum_sha256, created_at, expires_at, deleted_at
       FROM trip_assets
      WHERE trip_id = ?1 AND deleted_at IS NULL
      ORDER BY kind, position`,
  ).bind(tripId).all<StoredAsset>();
  return result.results;
}

async function markAssetsDeleted(db: D1Database, assetIds: string[], now: number): Promise<void> {
  if (!assetIds.length) return;
  await db.batch(assetIds.map((assetId) => db.prepare(
    "UPDATE trip_assets SET deleted_at = ?2 WHERE id = ?1 AND deleted_at IS NULL",
  ).bind(assetId, now)));
}

export async function deleteTripData(
  db: D1Database,
  media: R2Bucket,
  trip: StoredTrip,
  finalStatus: "deleted" | "expired",
  now: number,
): Promise<number> {
  const assets = await listTripAssets(db, trip.id);
  if (assets.length) {
    await media.delete(assets.map((asset) => asset.object_key));
    await markAssetsDeleted(db, assets.map((asset) => asset.id), now);
  }
  await db.prepare(
    `UPDATE trips
        SET status = ?2,
            request_ciphertext = NULL,
            request_nonce = NULL,
            result_ciphertext = NULL,
            result_nonce = NULL,
            email_ciphertext = NULL,
            email_nonce = NULL,
            error_code = NULL,
            updated_at = ?3
      WHERE id = ?1`,
  ).bind(trip.id, finalStatus, now).run();
  return assets.length;
}

export async function purgeExpiredData(
  db: D1Database,
  media: R2Bucket,
  now: number,
): Promise<{ sourceAssetsDeleted: number; tripsExpired: number; tripAssetsDeleted: number }> {
  const sourceAssets = await db.prepare(
    `SELECT id, object_key
       FROM trip_assets
      WHERE kind = 'source_photo' AND deleted_at IS NULL AND expires_at <= ?1
      ORDER BY expires_at
      LIMIT 100`,
  ).bind(now).all<{ id: string; object_key: string }>();

  if (sourceAssets.results.length) {
    await media.delete(sourceAssets.results.map((asset) => asset.object_key));
    await markAssetsDeleted(db, sourceAssets.results.map((asset) => asset.id), now);
  }

  const expiredTrips = await db.prepare(
    `SELECT id, public_token_hash, status, request_ciphertext, request_nonce,
            result_ciphertext, result_nonce, email_ciphertext, email_nonce,
            notification_status, error_code, created_at, updated_at, expires_at, completed_at
       FROM trips
      WHERE expires_at <= ?1 AND status NOT IN ('deleted', 'expired')
      ORDER BY expires_at
      LIMIT 50`,
  ).bind(now).all<StoredTrip>();

  let tripAssetsDeleted = 0;
  for (const trip of expiredTrips.results) {
    tripAssetsDeleted += await deleteTripData(db, media, trip, "expired", now);
  }

  return {
    sourceAssetsDeleted: sourceAssets.results.length,
    tripsExpired: expiredTrips.results.length,
    tripAssetsDeleted,
  };
}
