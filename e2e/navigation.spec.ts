import { expect, test } from "@playwright/test";
import { PageHelper } from "./helpers/PageHelper";

let helper: PageHelper;

test.beforeEach(async ({ page }) => {
    helper = new PageHelper(page);
    await page.goto("/");
});

test("the menu is hidden on the login screen", async ({ page }) => {
    await helper.expectScreen("Login");
    await expect(page.locator("#hamburger-menu")).toBeHidden();
});

test("guest login moves to the lobby", async ({ page }) => {
    await helper.guestLogin();

    await helper.expectScreen("Lobby");
    await expect(page.locator("#hamburger-menu")).toBeVisible();
});

test("the lobby stays put on reload without a game", async ({ page }) => {
    await helper.guestLogin();
    await page.reload();

    await helper.expectScreen("Lobby");
});

test("the game menu item does nothing without a game", async () => {
    await helper.guestLogin();
    await helper.openMenuItem("Game");

    await helper.expectScreen("Lobby");
});

test("creating a game moves to the game screen", async () => {
    await helper.guestLogin();
    await helper.createGame("Alice");

    await helper.expectScreen("Game");
});

test("the menu moves between the lobby and the game", async () => {
    await helper.guestLogin();
    await helper.createGame("Alice");

    await helper.openMenuItem("Lobby");
    await helper.expectScreen("Lobby");

    await helper.openMenuItem("Game");
    await helper.expectScreen("Game");
});

test("a game listed in the lobby resumes the game", async ({ page }) => {
    await helper.guestLogin();
    const gameCode = await helper.createGame("Alice");

    await helper.openMenuItem("Lobby");
    await page.locator("#games").getByRole("button", { name: gameCode }).click();

    await helper.expectScreen("Game");
});

test("the game screen survives a reload", async ({ page }) => {
    await helper.guestLogin();
    await helper.createGame("Alice");
    await page.reload();

    await helper.expectScreen("Game");
});

test("exit returns to the login screen", async ({ page }) => {
    await helper.guestLogin();
    await helper.createGame("Alice");

    await helper.openMenuItem("Exit");

    await helper.expectScreen("Login");
    await expect(page.locator("#hamburger-menu")).toBeHidden();
});
