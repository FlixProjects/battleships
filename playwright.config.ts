import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    timeout: 120_000,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: "http://localhost:8080",
        trace: "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: [
        {
            // SAM + DynamoDB Local; needs Docker, so slow on a cold start
            command: "npm --prefix battleships-lambda run start",
            url: "http://127.0.0.1:3000/api/login",
            reuseExistingServer: true,
            timeout: 5 * 60 * 1000,
        },
        {
            command: "npm run dev",
            url: "http://localhost:8080",
            reuseExistingServer: true,
            timeout: 2 * 60 * 1000,
        },
    ],
});
