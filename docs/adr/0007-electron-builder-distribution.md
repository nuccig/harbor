# ADR 0007 — electron-builder + GitHub Releases for distribution and auto-update

## Status
accepted

## Context
Harbor is a desktop app; "deployment" means building installers and distributing them with auto-update. There is no server to deploy — external APIs (Linear, GitHub, AI providers) are consumed, not hosted.

## Decision
Use **electron-builder** to produce installers (`.exe` / `.dmg` / `.AppImage`) and publish them to **GitHub Releases**. Auto-update via **electron-updater** checking the GitHub Releases feed.

## Alternatives
- **electron-forge** — official Electron toolchain, but less mature auto-update story than electron-builder.
- **Manual distribution** — no auto-update; users must re-download manually. Unacceptable for an actively developed tool.

## Consequences
- One toolchain handles build, code-signing, publish, and auto-update.
- GitHub Releases is free hosting; release pipeline runs on GitHub Actions.
- Auto-update works out of the box once a `publish` config points at the repo.
- macOS builds should be signed + notarized (future ADR if/when an Apple Developer cert is obtained).