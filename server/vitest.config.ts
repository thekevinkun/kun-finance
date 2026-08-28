// Vitest configuration — tells Vitest which files count as tests
// and explicitly excludes compiled build output so old .js files
// left over from `npm run build` don't get picked up and re-run.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/dist/**", "**/node_modules/**"],
  },
});
