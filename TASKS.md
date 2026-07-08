# Harbor — Tasks

## Verify gate

```
npm run lint && npm run typecheck && npm run test
```

## Commands

| Task       | Command                  |
|------------|--------------------------|
| lint       | `eslint .`               |
| typecheck  | `tsc --noEmit`           |
| test       | `vitest run`             |
| build      | `vite build`             |
| build:app  | `electron-builder`       |
| dev        | `vite` (renderer HMR)    |
| app        | `electron .` (dev mode)  |
| e2e        | `playwright test` (when added) |

> Commands become functional after the first project scaffold (`package.json` + deps install), guided by `docs/adr/`.