-- Managed Agent v1.6 target schema for MySQL 8.0.
-- This is the design source for the additive V2 migration. It is not evidence
-- that the current Java service has applied these tables.

ALTER TABLE managed_agent_session
    ADD COLUMN storage_version INT NOT NULL DEFAULT 1,
    ADD COLUMN replay_floor_sequence BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN snapshot_through_sequence BIGINT NOT NULL DEFAULT 0;

ALTER TABLE managed_agent_turn
    ADD COLUMN input_item_id VARCHAR(64),
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

CREATE TABLE managed_agent_item (
    tenant_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    item_id VARCHAR(64) NOT NULL,
    turn_id VARCHAR(64),
    item_type VARCHAR(32) NOT NULL,
    role VARCHAR(16),
    status VARCHAR(32) NOT NULL,
    revision BIGINT NOT NULL,
    projection_version INT NOT NULL,
    first_sequence BIGINT NOT NULL,
    last_sequence BIGINT NOT NULL,
    content_json LONGTEXT NOT NULL,
    content_digest CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    deleted_at BIGINT,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, session_id, item_id),
    CONSTRAINT managed_agent_item_session_fk
        FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id),
    CONSTRAINT managed_agent_item_revision_ck CHECK (revision > 0),
    CONSTRAINT managed_agent_item_sequence_ck
        CHECK (first_sequence > 0 AND first_sequence <= last_sequence),
    CONSTRAINT managed_agent_item_role_ck
        CHECK (role IS NULL OR role IN ('user', 'assistant', 'tool', 'system')),
    CONSTRAINT managed_agent_item_type_ck
        CHECK (item_type IN ('message', 'reasoning', 'tool_call',
                             'tool_result', 'approval', 'error'))
);

CREATE INDEX managed_agent_item_sequence_idx
    ON managed_agent_item
        (tenant_id, session_id, first_sequence, item_id);

CREATE INDEX managed_agent_item_turn_idx
    ON managed_agent_item
        (tenant_id, session_id, turn_id, first_sequence);

CREATE TABLE managed_agent_snapshot (
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
    UNIQUE KEY managed_agent_snapshot_watermark_uq
        (tenant_id, session_id, through_sequence, projection_version),
    CONSTRAINT managed_agent_snapshot_session_fk
        FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id),
    CONSTRAINT managed_agent_snapshot_sequence_ck
        CHECK (through_sequence >= 0),
    CONSTRAINT managed_agent_snapshot_count_ck CHECK (item_count >= 0)
);

CREATE INDEX managed_agent_snapshot_latest_idx
    ON managed_agent_snapshot
        (tenant_id, session_id, projection_version, through_sequence DESC);

CREATE TABLE managed_agent_consumer_progress (
    consumer_name VARCHAR(128) NOT NULL,
    shard_id INT NOT NULL,
    last_batch_offset BIGINT NOT NULL DEFAULT 0,
    lease_owner VARCHAR(128),
    lease_until BIGINT,
    last_error_code VARCHAR(128),
    last_error_at BIGINT,
    updated_at BIGINT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (consumer_name, shard_id),
    CONSTRAINT managed_agent_consumer_progress_shard_ck
        CHECK (shard_id >= 0),
    CONSTRAINT managed_agent_consumer_progress_offset_ck
        CHECK (last_batch_offset >= 0)
);

-- Migration invariants:
-- 0. Existing rows remain storage_version = 1. Admission explicitly creates
--    a version-2 session only after batch, item and replay code is enabled.
-- 1. acceptBatch locks session -> turn -> owner in that order, validates the
--    owner generation, inserts one stable batch, then advances source cursor,
--    public sequence and terminal state in the same transaction.
-- 2. event_count = 0 is a cursor-only checkpoint and is never published.
--    Cursor-only checkpoints are produced by Harness; Java control events use
--    producer_kind = 'java' and have no Harness source cursor.
-- 3. Consumers advance last_batch_offset only after the corresponding side
--    effect and consumer-specific deduplication commit.
--    The first SQL scanner uses shard_id = 0. Adding shards requires an
--    explicit assignment epoch and progress migration; changing the modulus
--    in place would skip or duplicate ownership.
-- 4. A snapshot is published by CAS-updating session.snapshot_through_sequence
--    only after every item through that sequence is committed.
-- 5. replay_floor_sequence advances only when a usable snapshot exists and
--    every required consumer is beyond the batches being deleted.
