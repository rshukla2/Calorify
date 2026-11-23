import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Node 25+ ships its own localStorage global that shadows jsdom's; turn it off.
    poolOptions: { forks: { execArgv: ["--no-experimental-webstorage"] } },
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "src/utils/glp1.ts",
        "src/services/glp1StorageService.ts",
        "src/hooks/useGLP1Data.ts",
        "src/components/GLP1*.tsx",
        "src/components/MedicationLogModal.tsx",
        "src/components/SymptomLogModal.tsx",
        "src/pages/GLP1Page.tsx",
      ],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
