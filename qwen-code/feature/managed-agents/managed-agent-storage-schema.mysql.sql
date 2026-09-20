-- Managed Agent v1.10 DESIGN delta for MySQL 8.0, AFTER actual V1 + V2.
-- Preserve V2 Item/Part/latest Snapshot/per-session Consumer Progress.
-- Not a registered Flyway migration or evidence of runtime implementation.
-- Future migration numbers must be allocated on the implementation branch.

ALTER TABLE managed_agent_session
    ADD COLUMN storage_version INT NOT NULL DEFAULT 1,
    ADD COLUMN replay_floor_sequence BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN snapshot_through_sequence BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN consumer_set_version INT NOT NULL DEFAULT 1;

ALTER TABLE managed_agent_turn
    ADD COLUMN input_item_id VARCHAR(128),
    ADD COLUMN input_revision BIGINT NOT NULL DEFAULT 1,
    ADD COLUMN input_digest CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin;

CREATE TABLE managed_agent_session_owner (
    tenant_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    owner_node_id VARCHAR(128) NOT NULL,
    owner_generation BIGINT NOT NULL,
    owner_lease_until BIGINT NOT NULL,
    harness_instance_id VARCHAR(128),
    harness_boot_id VARCHAR(36),
    journal_revision BIGINT NOT NULL DEFAULT 0,
    journal_manifest_ref VARCHAR(2048),
    journal_manifest_digest CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin,
    workspace_storage_id VARCHAR(256),
    state VARCHAR(32) NOT NULL,
    updated_at BIGINT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, session_id),
    CONSTRAINT managed_agent_session_owner_session_fk
        FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id),
    CONSTRAINT managed_agent_session_owner_generation_ck
        CHECK (owner_generation > 0),
    CONSTRAINT managed_agent_session_owner_state_ck
        CHECK (state IN ('claiming', 'active', 'draining',
                         'recovery_blocked', 'released'))
);

CREATE INDEX managed_agent_session_owner_lease_idx
    ON managed_agent_session_owner (state, owner_lease_until);

CREATE TABLE managed_agent_event_batch (
    batch_offset BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    turn_id VARCHAR(64),
    producer_kind VARCHAR(16) NOT NULL,
    producer_generation BIGINT NOT NULL,
    source_boot_id VARCHAR(36),
    source_event_epoch VARCHAR(64),
    source_first_event_id BIGINT,
    source_last_event_id BIGINT,
    first_sequence BIGINT,
    last_sequence BIGINT,
    event_count INT NOT NULL,
    schema_version INT NOT NULL,
    projection_version INT NOT NULL,
    payload_codec VARCHAR(32) NOT NULL,
    payload_bytes LONGBLOB,
    payload_sha256 CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin,
    terminal BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    PRIMARY KEY (batch_offset),
    UNIQUE KEY managed_agent_event_batch_identity_uq
        (tenant_id, session_id, batch_id),
    UNIQUE KEY managed_agent_event_batch_source_uq
        (tenant_id, session_id, source_boot_id, source_event_epoch,
         source_last_event_id),
    CONSTRAINT managed_agent_event_batch_session_fk
        FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id),
    CONSTRAINT managed_agent_event_batch_count_ck
        CHECK (event_count >= 0),
    CONSTRAINT managed_agent_event_batch_producer_ck
        CHECK (
            (producer_kind = 'harness'
                AND source_boot_id IS NOT NULL
                AND source_event_epoch IS NOT NULL
                AND source_first_event_id IS NOT NULL
                AND source_last_event_id IS NOT NULL
                AND source_first_event_id <= source_last_event_id)
            OR
            (producer_kind = 'java'
                AND source_boot_id IS NULL
                AND source_event_epoch IS NULL
                AND source_first_event_id IS NULL
                AND source_last_event_id IS NULL)
        ),
    CONSTRAINT managed_agent_event_batch_public_range_ck
        CHECK (
            (event_count = 0
                AND first_sequence IS NULL
                AND last_sequence IS NULL
                AND payload_bytes IS NULL
                AND payload_sha256 IS NULL)
            OR
            (event_count > 0
                AND first_sequence IS NOT NULL
                AND last_sequence IS NOT NULL
                AND first_sequence <= last_sequence
                AND last_sequence - first_sequence + 1 = event_count
                AND payload_bytes IS NOT NULL
                AND payload_sha256 IS NOT NULL)
        )
);

CREATE INDEX managed_agent_event_batch_replay_idx
    ON managed_agent_event_batch
        (tenant_id, session_id, first_sequence, last_sequence);

CREATE INDEX managed_agent_event_batch_expiry_idx
    ON managed_agent_event_batch (expires_at, batch_offset);

CREATE TABLE managed_agent_snapshot_version (
    tenant_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    snapshot_id VARCHAR(64) NOT NULL,
    through_sequence BIGINT NOT NULL,
    projection_version INT NOT NULL,
    item_count INT NOT NULL,
    snapshot_json LONGTEXT NOT NULL,
    snapshot_digest CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at BIGINT NOT NULL,
    expires_at BIGINT,
    PRIMARY KEY (tenant_id, session_id, snapshot_id),
    UNIQUE KEY managed_agent_snapshot_version_watermark_uq
        (tenant_id, session_id, through_sequence, projection_version),
    CONSTRAINT managed_agent_snapshot_version_session_fk
        FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id),
    CONSTRAINT managed_agent_snapshot_version_sequence_ck
        CHECK (through_sequence >= 0),
    CONSTRAINT managed_agent_snapshot_version_count_ck CHECK (item_count >= 0)
);

CREATE INDEX managed_agent_snapshot_version_latest_idx
    ON managed_agent_snapshot_version
        (tenant_id, session_id, projection_version, through_sequence DESC);

-- The V2 progress PK remains (tenant_id, session_id, consumer_name).
-- Its covered_sequence is a per-session contiguous business watermark.
ALTER TABLE managed_agent_consumer_progress
    ADD COLUMN lease_owner VARCHAR(128),
    ADD COLUMN lease_until BIGINT,
    ADD COLUMN claim_generation BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN last_error_code VARCHAR(128);

CREATE TABLE managed_agent_batch_delivery (
    tenant_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    consumer_name VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    consumer_set_version INT NOT NULL,
    state VARCHAR(16) NOT NULL DEFAULT 'pending',
    available_at BIGINT NOT NULL,
    lease_owner VARCHAR(128),
    lease_until BIGINT,
    claim_generation BIGINT NOT NULL DEFAULT 0,
    attempts INT NOT NULL DEFAULT 0,
    last_error_code VARCHAR(128),
    completed_at BIGINT,
    PRIMARY KEY (tenant_id, session_id, batch_id, consumer_name),
    CONSTRAINT managed_agent_batch_delivery_batch_fk
        FOREIGN KEY (tenant_id, session_id, batch_id)
        REFERENCES managed_agent_event_batch (tenant_id, session_id, batch_id),
    CONSTRAINT managed_agent_batch_delivery_state_ck
        CHECK (state IN ('pending', 'leased', 'done', 'blocked')),
    CONSTRAINT managed_agent_batch_delivery_claim_ck
        CHECK (claim_generation >= 0 AND attempts >= 0
            AND (state <> 'leased' OR
                (lease_owner IS NOT NULL AND lease_until IS NOT NULL
                 AND claim_generation > 0))),
    CONSTRAINT managed_agent_batch_delivery_done_ck
        CHECK (state <> 'done' OR completed_at IS NOT NULL)
);

CREATE INDEX managed_agent_batch_delivery_pending_idx
    ON managed_agent_batch_delivery (consumer_name, state, available_at);
CREATE INDEX managed_agent_batch_delivery_expired_idx
    ON managed_agent_batch_delivery (consumer_name, state, lease_until);

-- Compact deduplication receipts survive payload GC through the retry horizon.
-- Insert before deleting a batch, in the SAME cleanup transaction.
CREATE TABLE managed_agent_batch_receipt (
    tenant_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    payload_sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin,
    source_boot_id VARCHAR(36),
    source_event_epoch VARCHAR(64),
    source_last_event_id BIGINT,
    first_sequence BIGINT,
    last_sequence BIGINT,
    retry_until BIGINT NOT NULL,
    PRIMARY KEY (tenant_id, session_id, batch_id),
    UNIQUE KEY managed_agent_batch_receipt_source_uq
        (tenant_id, session_id, source_boot_id, source_event_epoch,
         source_last_event_id),
    CONSTRAINT managed_agent_batch_receipt_session_fk
        FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id),
    CONSTRAINT managed_agent_batch_receipt_range_ck
        CHECK ((first_sequence IS NULL AND last_sequence IS NULL)
            OR (first_sequence IS NOT NULL AND last_sequence IS NOT NULL
                AND first_sequence > 0 AND last_sequence >= first_sequence))
);
CREATE INDEX managed_agent_batch_receipt_expiry_idx
    ON managed_agent_batch_receipt (retry_until);

-- Invariants (application transaction predicates, not implied by DDL):
-- 1. Existing sessions remain storage_version=1. Cutover under the Session lock
--    installs a verified baseline snapshot/consumer set, then starts batches H+1.
-- 2. acceptBatch: Session -> Turn -> Owner; insert immutable batch + all required
--    delivery rows and advance source cursor/public sequence/terminal state.
--    Registry, when needed, precedes Session. No public events => no delivery.
-- 3. Claim ALL pending/expired work with bounded SKIP LOCKED reads. batch_offset
--    is only a locator/order key, NEVER a persistent lower-bound scan cursor.
--    Claim-only transactions release locks before materialization starts.
-- 4. Materialize: Session -> Turn/Owner if needed -> V2 progress -> delivery ->
--    Item/Snapshot. Validate contiguous sequence and live claim generation;
--    commit effects + progress + done together. MQ I/O stays outside locks.
-- 5. Relay uses a per-session relay lease in V2 progress. Claim Session -> relay
--    progress -> earliest unfinished delivery, then release the transaction.
--    Confirm using BOTH live generations/leases. A stale publisher may send a
--    duplicate; consumers still validate/deduplicate/repair public sequence.
-- 6. Publish immutable snapshot_version before advancing snapshot_through_sequence.
--    V2 mutable latest Snapshot is retained for legacy readers, not page pinning.
-- 7. GC validates W, snapshot content, all necessary tasks and pins under Session
--    lock; retain compact receipt, delete done tasks, delete batch, advance floor.
--    Batch/source dedupe checks BOTH retained receipts and live batch rows.
-- 8. Stable IDs require exact comparisons. Existing V1/V2 columns retain their
--    collation for upgrade compatibility: before enabling new writes audit ID
--    collisions, and use validated canonical IDs/exact comparison in adapters.
--    Do not silently rewrite existing tenant/session keys in this delta.
