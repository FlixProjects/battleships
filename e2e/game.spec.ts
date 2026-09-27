import { expect, test } from "@playwright/test";
import { deployedFlagships, PageHelper } from "./helpers/PageHelper";

let helper: PageHelper;

test.beforeEach(async ({ page }) => {
    helper = new PageHelper(page);
    await page.goto("/");
    await helper.guestLogin();
});

test("a second player can join a created game", async ({ page }) => {
    const gameCode = await helper.createGame("Alice");
    expect(gameCode).toMatch(/^[A-Z0-9]{4}$/);

    await helper.handOverToNewPlayer();
    await helper.joinGame("Bob", gameCode);

    await expect(page.getByText("Alice", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Bob", { exact: true }).first()).toBeVisible();
});

test("both players deploy their flagship and the round resolves", async ({ page }) => {
    const gameCode = await helper.createGame("Alice");
    await helper.handOverToNewPlayer();
    await helper.joinGame("Bob", gameCode);

    // the joining player deploys along the bottom row, the creator along the top
    await helper.deployFlagship("2/6");
    await helper.submitTurn();
    await expect(page.locator("#status")).toContainText("WaitingForOtherPlayer");

    await helper.switchPlayer();
    await helper.deployFlagship("2/0");
    await helper.submitTurn();
    await expect(page.locator("#status")).toContainText("ReadyToSubmit");

    const alice = await helper.readPlayerView();
    expect(alice.currentRound).toBe(2);
    // fog of war: only Alice's own flagship survives in her view
    expect(deployedFlagships(alice)).toHaveLength(1);

    await helper.switchPlayer();
    await expect.poll(async () => (await helper.readPlayerView()).currentRound).toBe(2);
    const bob = await helper.readPlayerView();
    expect(bob.playerId).not.toBe(alice.playerId);
    expect(deployedFlagships(bob)).toHaveLength(1);
});
