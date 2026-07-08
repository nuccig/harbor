# ADR 0008 — Event loop main process + worker threads for background work

## Status
accepted

## Context
Harbor orchestrates PTY sessions (I/O-bound), syncs issues from external APIs on a schedule (I/O-bound), monitors token consumption, and sends notifications. It is a single-user desktop app — there is no need for a durable cross-process queue or an external broker.

## Decision
Run all background work in the **Electron main process event loop** (listeners, timers, IPC). Use **Node `worker_threads`** only for CPU-bound tasks that would block the UI thread (e.g. heavy parsing, bulk sync). No separate queue or Redis.

## Alternatives
- **BullMQ + Redis** — durable, retryable jobs; but Redis on a desktop app is unacceptable overhead (extra process, memory, ops).
- **Dedicated worker process** — more isolation, but unnecessary complexity for single-user I/O-bound work.

## Consequences
- Zero infra: no Redis, no separate process to manage.
- Scheduled issue sync runs via `setInterval` / `setTimeout` in the main process.
- Notifications use Electron's native `Notification` API.
- Worker threads are opt-in: add only when a measurable UI freeze justifies one.