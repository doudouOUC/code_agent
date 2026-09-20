-- v1.9 Workspace target delta against the implemented Java Flyway V1/V2.
-- DESIGN ONLY: assign a new Flyway version during implementation. Do not run
-- the older managed-agent-storage-schema.mysql.sql first or replace V1/V2.
-- tenant_id/session_id retain the deployed base-table collation for FK parity.
CREATE TABLE managed_agent_workspace (
    tenant_id VARCHAR(128) NOT NULL,
    workspace_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    generation BIGINT NOT NULL,
    storage_id VARCHAR(256) NOT NULL,
    display_name VARCHAR(512) NOT NULL,
    state VARCHAR(32) NOT NULL,
    policy_ref VARCHAR(512) NOT NULL,
    config_ref VARCHAR(512) NOT NULL,
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (tenant_id, workspace_id),
    CHECK (generation > 0),
    CHECK (state IN ('active', 'draining', 'removed'))
);

ALTER TABLE managed_agent_session
    ADD COLUMN workspace_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin,
    ADD COLUMN workspace_generation BIGINT,
    ADD COLUMN workspace_storage_id VARCHAR(256),
    ADD COLUMN cwd_relative VARCHAR(1024),
    ADD COLUMN context_config_ref VARCHAR(512),
    ADD COLUMN canonical_workspace_cwd TEXT,
    ADD COLUMN effective_cwd TEXT,
    ADD COLUMN context_revision BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN context_state VARCHAR(32) NOT NULL DEFAULT 'unbound',
    ADD CONSTRAINT managed_agent_session_workspace_fk
        FOREIGN KEY (tenant_id, workspace_id)
        REFERENCES managed_agent_workspace (tenant_id, workspace_id),
    ADD CONSTRAINT managed_agent_session_context_ck CHECK (
        (context_state = 'unbound' AND context_revision = 0
            AND workspace_id IS NULL AND workspace_generation IS NULL
            AND workspace_storage_id IS NULL AND cwd_relative IS NULL
            AND context_config_ref IS NULL)
        OR
        (context_state IN ('ready', 'changing', 'recovery_blocked')
            AND context_revision > 0 AND workspace_id IS NOT NULL
            AND workspace_generation IS NOT NULL AND workspace_generation > 0
            AND workspace_storage_id IS NOT NULL AND cwd_relative IS NOT NULL
            AND context_config_ref IS NOT NULL)
    );

CREATE INDEX managed_agent_session_workspace_idx
    ON managed_agent_session (tenant_id, workspace_id, updated_at, session_id);

CREATE TABLE managed_agent_cwd_operation (
    tenant_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    operation_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_digest CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    expected_context_revision BIGINT NOT NULL,
    target_context_revision BIGINT NOT NULL,
    target_cwd_relative VARCHAR(1024) NOT NULL,
    prior_context_json LONGTEXT NOT NULL,
    target_context_ref VARCHAR(512),
    runtime_receipt_ref VARCHAR(512),
    harness_receipt_ref VARCHAR(512),
    state VARCHAR(32) NOT NULL,
    result_context_revision BIGINT,
    failure_code VARCHAR(128),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, session_id, operation_id),
    UNIQUE KEY managed_agent_cwd_idempotency_uq (tenant_id, idempotency_key),
    FOREIGN KEY (tenant_id, session_id)
        REFERENCES managed_agent_session (tenant_id, session_id),
    CHECK (expected_context_revision > 0
        AND target_context_revision = expected_context_revision + 1),
    CHECK (state IN ('pending', 'installing', 'completed', 'failed',
                    'recovery_blocked')),
    CHECK (state <> 'completed' OR
        (result_context_revision IS NOT NULL
            AND result_context_revision = target_context_revision
            AND target_context_ref IS NOT NULL
            AND runtime_receipt_ref IS NOT NULL
            AND harness_receipt_ref IS NOT NULL))
);

-- No default-workspace backfill: each old session needs verified binding evidence.
-- New admission stores the binding with the command and Session in one transaction.
-- context_state is an admission barrier, not proof of a mounted/ready Runtime.
-- Lock the Session before admitting input or a cwd operation; only one pending
-- operation may own its barrier. If a Registry lock is needed, acquire it first:
-- Registry -> Session -> Turn -> SessionOwner; invalidation uses the same order.
-- Serialize registry replace/trust changes with
-- admission and recheck authoritative policy before installing/executing.
-- A durable operation scanner/outbox retries the same operation ID under the
-- existing owner/OperationGrant fencing. SQL completion, revision and public
-- event commit together after both receipts; ACKs never reopen gates by themselves.
-- Canonical/effective absolute paths are internal installation snapshots only.
-- Path validation, ACL checks, immutable storage identity and generation checks
-- remain application responsibilities; constraints alone do not authorize I/O.
