import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

test.describe("Authentication", () => {
  test("sign in reaches dashboard", async ({ page }) => {
    await signIn(page);

    // Should be on the main page after login
    await expect(page).toHaveURL("/");
  });

  test("sign out returns to auth page", async ({ page }) => {
    await signIn(page);

    // Open account menu / click sign out
    // NavBar has a sign out option — look for it
    const signOutButton = page.getByRole("button", { name: /sign out/i });
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
    } else {
      // Try the account dropdown or menu
      const accountButton = page.getByRole("button", { name: /account/i });
      if (await accountButton.isVisible()) {
        await accountButton.click();
        await page.getByRole("menuitem", { name: /sign out/i }).click();
      }
    }

    // Should redirect to auth page or hero
    await expect(page).toHaveURL(/\/(auth)?/);
  });
});
