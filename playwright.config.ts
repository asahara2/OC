import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3035",
    browserName: "chromium",
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
  webServer: [
    { command: "node tests/ui/fixture-server.mjs", url: "http://127.0.0.1:54329/health", reuseExistingServer: false },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3035",
      url: "http://127.0.0.1:3035/news",
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "ui-test-anon-not-a-real-key",
        SUPABASE_SERVICE_ROLE_KEY: "ui-test-service-not-a-real-key",
        ADMIN_USERNAME: "ui-test",
        ADMIN_PASSWORD: "ui-test-password",
      },
    },
  ],
});
