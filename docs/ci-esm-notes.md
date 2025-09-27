Backend ESM + CI Notes

- Backend now runs in ESM mode and uses ts-node with `--esm` for scripts:
  - dev: `nodemon --exec ts-node --esm src/index.ts`
  - migrate/seed scripts likewise use `ts-node --esm`

- GitHub Actions Node version
  - Set `NODE_VERSION: 20.19.0` (or newer) in workflows. Vite 7+ and `@vitejs/plugin-react@5` require Node 20.19+.

- Local development
  - Use Node 20.19+ or 22.12+.
  - If you see `ERR_REQUIRE_ESM` during tests, ensure `backend/package.json` has `"type": "module"` and Vitest runs under ESM (already configured).

- Turbo tasks
  - `npm run test -w backend` runs backend tests (unit + contract) without building the entire backend.
  - `npm run build -w backend` performs a full TypeScript emit; unrelated TS errors in experimental services may fail the build until addressed.

