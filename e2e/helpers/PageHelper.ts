import { expect, type Page } from "@playwright/test";

// Local mode (DEPLOY_ENV=local) keeps the game in the tab's sessionStorage in
// place of S3, so both players share one tab and swap via "Switch Player".

// SAM spins up a container per cold lambda, so first hits can be slow
const API_TIMEOUT = 60_000;

interface IPlainShip {
    refNo: string;
    deployed?: boolean;
}

export interface IPlayerView {
    playerId: string;
    currentRound: number;
    ships: IPlainShip[];
}

type TScreen = "Login" | "Lobby" | "Game";
type TMenuItem = "Login" | "Game" | "Lobby" | "Exit";

export const deployedFlagships = (view: IPlayerView) =>
    view.ships.filter((ship) => ship.refNo === "tudf_flagship0" && ship.deployed);

export class PageHelper {
    constructor(private readonly page: Page) {}

    private get submitButton() {
        return this.page.getByRole("button", { name: "Submit Move" });
    }

    private async clickAndWaitFor(path: RegExp, click: () => Promise<void>) {
        const [response] = await Promise.all([this.page.waitForResponse(path, { timeout: API_TIMEOUT }), click()]);
        expect(response.status()).toBe(200);
    }

    async guestLogin() {
        await expect(this.page.locator("#login-page")).toBeVisible();
        await this.clickAndWaitFor(/\/api\/login\?guest=true/, () => this.page.locator("#guestBtn").click());
        await expect(this.page.locator("#createGameBtn")).toBeVisible();
    }

    async createGame(playerName: string): Promise<string> {
        await this.page.locator("#playerName").fill(playerName);
        await this.clickAndWaitFor(/\/api\/create/, () => this.page.locator("#createGameBtn").click());
        await expect(this.page.locator("#switchPlayerBtn")).toBeVisible();

        return await this.page.evaluate(() => JSON.parse(sessionStorage.getItem("fp-game-state") ?? "{}").code);
    }

    async joinGame(playerName: string, gameCode: string) {
        await this.page.locator("#playerName").fill(playerName);
        await this.page.locator("#joinCode").fill(gameCode);
        await this.clickAndWaitFor(/\/api\/join/, () => this.page.locator("#joinGameBtn").click());
        await expect(this.page.locator(".tile")).toHaveCount(35);
    }

    // The creator hands the tab over; the second player signs in as a fresh guest
    async handOverToNewPlayer() {
        await this.page.locator("#switchPlayerBtn").click();
        await this.page.locator("#hamburgerBtn").click();
        await this.page.getByRole("button", { name: "Login", exact: true }).click();
        await this.guestLogin();
    }

    // Refresh re-reads the shared local game so the incoming player sees the other's changes
    async switchPlayer() {
        await this.page.locator("#switchPlayerBtn").click();
        await this.page.locator("#refreshBtn").click();
    }

    // The flagship card is pre-selected while it is undeployed, so one tile click places it
    async deployFlagship(tileId: string) {
        await this.page.locator(`[id="${tileId}"]`).click();
        await expect(this.submitButton).toBeEnabled();
    }

    async submitTurn() {
        await this.clickAndWaitFor(/\/api\/submit/, () => this.submitButton.click());
    }

    async openMenuItem(item: TMenuItem) {
        const menu = this.page.locator("#hamburger-menu");
        await menu.locator("#hamburgerBtn").click();
        await menu.getByRole("button", { name: item, exact: true }).click();
    }

    // Each screen shows exactly one of these blocks; some switches wait on an API call
    async expectScreen(screen: TScreen) {
        const blocks: Record<TScreen, string> = {
            Login: "#login-page",
            Lobby: "#controls",
            Game: "#gameArea",
        };

        for (const [name, selector] of Object.entries(blocks)) {
            if (name === screen) {
                await expect(this.page.locator(selector)).toBeVisible({ timeout: API_TIMEOUT });
            } else {
                await expect(this.page.locator(selector)).toBeHidden({ timeout: API_TIMEOUT });
            }
        }
    }

    async readPlayerView(): Promise<IPlayerView> {
        return await this.page.evaluate(() => {
            const playerId = sessionStorage.getItem("fp-current-player") ?? "";
            const states = JSON.parse(sessionStorage.getItem("fp-player-states") ?? "{}");
            const { currentRound, ships } = states[playerId].gameState;

            return { playerId, currentRound, ships };
        });
    }
}
