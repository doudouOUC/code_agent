# refactor(acp-bridge): create skeleton + lift zero-coupling primitives (#4175 PR 22a)

PR: #4295 | Merged: 2026-05-18 | +1106/-688 | 17 files

## What it does

Creates the `packages/acp-bridge` package as a standalone module by extracting zero-coupling primitives from `packages/cli/src/serve/`. Moves `EventBus`, `InMemoryChannel`, `Channel` interface, and `Permission` types into the new package. This is a preparatory refactor (PR 22a) that enables the subsequent F1 self-sufficiency PR (#4319) to lift the full bridge without circular dependencies. The CLI package is updated to re-export from the new location for backward compatibility.

## Key files changed
- `packages/acp-bridge/src/channel.ts`: Channel interface (moved from cli/serve)
- `packages/acp-bridge/src/eventBus.ts`: EventBus implementation (moved from cli/serve)
- `packages/acp-bridge/src/inMemoryChannel.ts`: InMemoryChannel (moved from cli/serve)
- `packages/acp-bridge/src/permission.ts`: Permission types (moved from cli/serve)
- `packages/acp-bridge/src/index.ts`: Package barrel exports
- `packages/acp-bridge/package.json`: New package manifest
- `packages/acp-bridge/README.md`: Package documentation
- `packages/cli/src/serve/httpAcpBridge.ts`: Updated imports to reference acp-bridge package
- `packages/cli/src/serve/eventBus.ts`: Thin re-export shim
- `packages/cli/src/serve/inMemoryChannel.ts`: Thin re-export shim

## Final Implementation Status
- **Status**: MERGED (2026-05-18)
- **Outcome**: Implemented as designed
