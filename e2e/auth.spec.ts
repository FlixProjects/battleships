import { expect, test } from "@playwright/test";
import { PageHelper } from "./helpers/PageHelper";

test("guest login lands on the lobby", async ({ page }) => {
    await page.goto("/");
    await new PageHelper(page).guestLogin();

    await expect(page.locator("#login-page")).toBeHidden();
});

test("login without credentials asks for a username", async ({ page }) => {
    await page.goto("/");
    await page.locator("#loginBtn").click();

    await expect(page.getByText("Enter your username!")).toBeVisible();
});
