import { defineConfig } from 'vite';

// The supplied asset directory is published as static content. The app loads
// the authoritative GLB directly rather than regenerating or duplicating it.
export default defineConfig({ publicDir: 'assets' });
