# Client-Server Module Isolation & Bundling Guardrails

1. **Prevent Server Package Leaks**:
   - Never import Node.js server packages (such as `firebase-admin`, `express`, `winston`, `@google-cloud/*`, `fs`, `child_process`) inside frontend `src/` files meant for browser execution.
   - Note: Dynamic `import('firebase-admin/...')` statements inside browser code are still statically analyzed by Vite/Rollup and bundled into client chunks.

2. **Early Runtime Global Fallbacks**:
   - Ensure `index.html` contains early global fallbacks for `process` and `global` in `<head>` to guard against isomorphic third-party dependencies.

3. **SPA HTML Entrypoint Cache Invalidation**:
   - In `firebase.json` (and any hosting platform), always configure `Cache-Control: no-cache, no-store, must-revalidate` for `index.html` and root `/` so browsers always load new bundle hashes immediately.
