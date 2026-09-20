-- Managed Agent v1.10 DESIGN delta, after actual V1/V2, storage and Workspace.
-- Future source migration number is not assigned here. No runtime wiring implied.
-- Existing managed_agent_command stays intact for legacy idempotency readers.
ALTER TABLE managed_agent_session
    ADD COLUMN archived_at BIGINT,
    ADD COLUMN deleted_at BIGINT,
    ADD COLUMN created_by_actor_id VARCHAR(128)
        CHARACTER SET ascii COLLATE ascii_bin;

-- Create requests have no client-known Session ID yet. This index resolves a
-- retry to the originally allocated Session/operation before any second insert.
CREATE TABLE managed_agent_creation_receipt (
    tenant_id VARCHAR(128) NOT NULL,
    actor_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_digest CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    operation_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at BIGINT NOT NULL,
    retry_until BIGINT NOT NULL,
    PRIMARY KEY (tenant_id, actor_id, idempotency_key),
    CONSTRAINT managed_agent_creation_receipt_session_fk
        FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id)
);

-- Actor-scoped durable input/cancel/Action/lifecycle delivery, no duplicate model
-- authority. Private command receipt references are not public artifact URLs.
CREATE TABLE managed_agent_operation (
    tenant_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    operation_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    operation_kind VARCHAR(32) NOT NULL,
    actor_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_digest CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    command_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    command_payload_json LONGTEXT NOT NULL,
    target_ref VARCHAR(128),
    admission_stage VARCHAR(32) NOT NULL DEFAULT 'java_durable',
    delivery_state VARCHAR(16) NOT NULL DEFAULT 'pending',
    state VARCHAR(32) NOT NULL DEFAULT 'pending',
    lease_owner VARCHAR(128),
    lease_until BIGINT,
    claim_generation BIGINT NOT NULL DEFAULT 0,
    available_at BIGINT NOT NULL,
    receipt_ref VARCHAR(512),
    result_json LONGTEXT,
    failure_code VARCHAR(128),
    retry_until BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, session_id, operation_id),
    UNIQUE KEY managed_agent_operation_idempotency_uq
        (tenant_id, session_id, operation_kind, actor_id, idempotency_key),
    CONSTRAINT managed_agent_operation_session_fk
        FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id),
    CONSTRAINT managed_agent_operation_kind_ck
        CHECK (operation_kind IN ('create_session', 'submit_input', 'cancel', 'action_response',
                                  'close', 'archive', 'delete')),
    CONSTRAINT managed_agent_operation_state_ck
        CHECK (state IN ('pending', 'running', 'completed', 'failed',
                         'cancelled', 'recovery_blocked')),
    CONSTRAINT managed_agent_operation_delivery_ck
        CHECK (delivery_state IN ('pending', 'leased', 'confirmed', 'blocked')),
    CONSTRAINT managed_agent_operation_stage_ck
        CHECK (admission_stage IN ('java_durable', 'harness_confirmed')),
    CONSTRAINT managed_agent_operation_claim_ck
        CHECK (claim_generation >= 0 AND
            (delivery_state <> 'leased' OR (lease_owner IS NOT NULL
             AND lease_until IS NOT NULL AND claim_generation > 0))),
    CONSTRAINT managed_agent_operation_receipt_ck
        CHECK ((state <> 'completed' AND admission_stage <> 'harness_confirmed'
                AND delivery_state <> 'confirmed') OR receipt_ref IS NOT NULL)
);
CREATE INDEX managed_agent_operation_pending_idx
    ON managed_agent_operation (delivery_state, available_at);
CREATE INDEX managed_agent_operation_expired_idx
    ON managed_agent_operation (delivery_state, lease_until);

-- W2 is still gated off during this expand/backfill step. Null actor means old,
-- unbound command: no cross-actor replay or new W2 writes until evidence-based
-- backfill completes. Then enforce non-null in the future contract migration.
ALTER TABLE managed_agent_cwd_operation
    ADD COLUMN actor_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin,
    DROP INDEX managed_agent_cwd_idempotency_uq,
    ADD UNIQUE KEY managed_agent_cwd_operation_actor_idempotency_uq
        (tenant_id, session_id, actor_id, idempotency_key);

-- command_payload_json is a validated closed command DTO or immutable input ref
-- plus digest; never arbitrary runtime commands, credentials or private tool args.
-- Current actor ACL is rechecked before replay; command retry must keep identity.
-- Terminal failures that were never delivered need no qwen receipt, but cannot
-- claim harness_confirmed. Close/delete completion additionally verifies all
-- cleanup facts, while input completion proves acceptance, not Turn settlement.
-- On terminal settlement extend retry_until to at least database_now + R.
-- Unsettled rows never expire. Retain authorized Session tombstones through R.
