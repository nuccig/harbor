---
id: 102
severity: medium
status: resolved
location: package.json:62
created: 2026-07-09
---

# Windows build:app fails on unsigned sign/edit step

## Problem

`npm run build:app -- --dir --config.asar=false` fails on Windows in this workspace after packaging the app and native dependencies. The failure is not in the renderer bundle, preload, or native rebuild; it happens when electron-builder downloads/extracts `winCodeSign` for the Windows executable sign/edit path:

`ERROR: Cannot create symbolic link : O cliente nao tem o privilégio necessário ... libcrypto.dylib`

This makes the current `build:app` script unreliable on Windows machines without symlink privileges/developer-mode setup, even though the scaffold has no signing material configured yet. It also blocks a local unsigned packaging smoke from completing.

Evidence from this review:

- Fails: `npm run build:app -- --dir --config.asar=false`
- Passes: `npm run build:app -- --dir --config.asar=false --config.win.signAndEditExecutable=false`
- The passing run still rebuilds/copies `better-sqlite3`, `keytar`, and `node-pty`, and still produces `dist/win-unpacked`.

## Suggested fix

Set the current unsigned Windows packaging config to skip executable sign/edit until a signing ADR/pipeline is added:

```json
"win": {
  "target": "nsis",
  "signAndEditExecutable": false
}
```

If release signing is introduced later, re-enable this in the release-specific config or CI path together with a real certificate/signing setup.

## Resolution

`package.json` agora define `build.win.signAndEditExecutable=false` para o packaging
Windows unsigned desta fase. `npm run build:app -- --dir --config.asar=false` passou
com exit 0 e gerou `dist/win-unpacked`, incluindo rebuild/cópia dos addons nativos.
