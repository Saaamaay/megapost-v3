import { type Page, expect } from "@playwright/test";

export async function signIn(page: Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars required");
  }

  await page.goto("/auth");
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for navigation to dashboard (Index page)
  await expect(page).toHaveURL("/", { timeout: 15000 });
}
