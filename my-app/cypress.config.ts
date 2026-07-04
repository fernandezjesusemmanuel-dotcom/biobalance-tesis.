import { defineConfig } from "cypress";

const baseUrl =
  process.env.CYPRESS_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

export default defineConfig({
  e2e: {
    baseUrl,
    supportFile: false,
    specPattern: "cypress/e2e/**/*.cy.{js,ts,jsx,tsx}",
    setupNodeEvents(on: any, config: any) {
      return config;
    },
  },
});
