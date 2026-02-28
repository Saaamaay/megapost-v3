import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

test.describe("Post Generation", () => {
  test("select platform, enter description, generate, verify results", async ({ page }) => {
    await signIn(page);

    // Wait for the content generator to be visible (user must have a voice profile)
    // If user lands on hero/setup, navigate to generator
    const generateButton = page.getByTestId("generate-button");

    // If the generate button isn't visible, user might be on hero page
    // Click "Start Creating" or similar to get to generator
    if (!(await generateButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      const startButton = page.getByRole("button", { name: /start creating/i });
      if (await startButton.isVisible()) {
        await startButton.click();
      }
    }

    // Select LinkedIn platform
    const linkedinButton = page.getByTestId("platform-linkedin");
    await linkedinButton.click();

    // Enter a description
    const textarea = page.getByPlaceholder(/e\.g\./);
    await textarea.fill("Just launched our new product line — excited to share the journey behind building it.");

    // Click generate
    await page.getByTestId("generate-button").click();

    // Wait for posts to appear (AI call can take up to 30s)
    const postCard = page.getByTestId("post-card-linkedin");
    await expect(postCard).toBeVisible({ timeout: 30000 });

    // Verify the post card has content
    await expect(postCard).toContainText(/.{20,}/); // At least 20 chars of content
  });
});
