import { expect, type Page } from "@playwright/test";

// Local mode (DEPLOY_ENV=local) keeps the game in the tab's sessionStorage in
// place of S3, so both players share one tab and swap via "Switch Player".

// SAM spins up a container per cold lambda, so first hits can be slow
const API_TIMEOUT = 60_000;

interface IPlainShip {
    id: string;
    refNo: string;
    playerId: string;
    deployed?: boolean;
    destroyed?: boolean;
}

export interface IPlainHull {
    id: string;
    shipId: string;
    location: [number, number];
    remainingHealth: number;
    armor: number;
    destroyed?: boolean;
}

interface IPlainPlayer {
    id: string;
    name: string;
    ready: boolean;
    commandPoints: number;
    pendingActions: string[];
    hand: string[];
}

export interface IPlayerView {
    playerId: string;
    currentRound: number;
    initiative?: string;
    isOver: boolean;
    winners: string[];
    players: IPlainPlayer[];
    ships: IPlainShip[];
    hulls: IPlainHull[];
}

export const FLAGSHIP_REF_NO = "tudf_flagship0";

type TScreen = "Login" | "Lobby" | "Game";
type TMenuItem = "Login" | "Game" | "Lobby" | "Exit";

export interface IRecordedAnimation {
    kind: "move" | "projectile" | "hit" | "sink" | "explosion";
    shipId?: string;
}

declare global {
    interface Window {
        __animations?: IRecordedAnimation[];
        __lastAnimationAt?: number;
    }
}

export const deployedFlagships = (view: IPlayerView) =>
    view.ships.filter((ship) => ship.refNo === FLAGSHIP_REF_NO && ship.deployed);

export const hullAt = (view: IPlayerView, tileId: string) =>
    view.hulls.find((hull) => hull.location.join("/") === tileId);

export class PageHelper {
    constructor(private readonly page: Page) {}

    private get submitButton() {
        return this.page.getByRole("button", { name: "Submit Move" });
    }

    // The same button reads "Awaiting other player" once submitted and "Game Over" at the end
    get turnButton() {
        return this.page.getByRole("button", { name: /^(Submit Move|Awaiting other player|Game Over)$/ });
    }

    get moveButton() {
        return this.page.locator("#select-action-move");
    }

    get attackButton() {
        return this.page.locator("#select-action-attack");
    }

    private async clickAndWaitFor(path: RegExp, click: () => Promise<void>) {
        const [response] = await Promise.all([this.page.waitForResponse(path, { timeout: API_TIMEOUT }), click()]);
        expect(response.status()).toBe(200);
    }

    // Deploys Bob on 2/6 + 2/5 and Alice on 2/0 + 2/1, leaving Alice current at the start of round 2
    async startGameWithFlagships() {
        const gameCode = await this.createGame("Alice");
        await this.handOverToNewPlayer();
        await this.joinGame("Bob", gameCode);

        await this.deployFlagship("2/6");
        await this.submitTurn();

        await this.switchPlayer();
        await this.deployFlagship("2/0");
        await this.submitTurn();

        return { gameCode };
    }

    async ownFlagshipId() {
        const view = await this.readPlayerView();
        const flagship = view.ships.find((ship) => ship.refNo === FLAGSHIP_REF_NO && ship.playerId === view.playerId);
        expect(flagship).toBeDefined();

        return flagship?.id ?? "";
    }

    // Tiles the current interaction offers, marked by their pulsing highlight
    async highlightedTiles(): Promise<string[]> {
        return await this.page
            .locator(".tile")
            .evaluateAll((tiles) =>
                tiles.filter((tile) => (tile as HTMLElement).style.animation.includes("pulse")).map((tile) => tile.id),
            );
    }

    async pendingActionCount() {
        const view = await this.readPlayerView();
        return view.players.find((player) => player.id === view.playerId)?.pendingActions.length ?? 0;
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

    // A refused join leaves the player in the lobby
    async attemptJoinGame(playerName: string, gameCode: string) {
        await this.page.locator("#playerName").fill(playerName);
        await this.page.locator("#joinCode").fill(gameCode);
        const [response] = await Promise.all([
            this.page.waitForResponse(/\/api\/join/, { timeout: API_TIMEOUT }),
            this.page.locator("#joinGameBtn").click(),
        ]);

        return response.status();
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
        await this.clickAndWaitFor(/\/api\?code=/, () => this.page.locator("#refreshBtn").click());
        await this.waitForReplay();
    }

    // The flagship card is pre-selected while it is undeployed, so one tile click places it
    async deployFlagship(tileId: string) {
        await this.tile(tileId).click();
        await expect(this.submitButton).toBeEnabled();
    }

    async submitTurn() {
        await this.clickAndWaitFor(/\/api\/submit/, () => this.submitButton.click());
        await this.waitForReplay();
    }

    // The ship's sprite sits over its tile in a separate layer, so click the tile's point
    async selectShip(tileId: string) {
        await this.clickTile(tileId);
    }

    async clickTile(tileId: string) {
        await this.tile(tileId).click({ force: true });
    }

    async moveShip(fromTileId: string, toTileId: string) {
        await this.selectShip(fromTileId);
        await this.page.locator("#select-action-move").click();
        await this.tile(toTileId).click({ force: true });
        await this.page.locator("#path-menu-confirm").click();
    }

    async attack(fromTileId: string, targetTileId: string) {
        await this.selectShip(fromTileId);
        await this.page.locator("#select-action-attack").click();
        await this.tile(targetTileId).click({ force: true });
    }

    // A click mid-replay skips it, so wait until the latest resolved round has played out.
    // Mid-replay the stored state is the rewound prior round, so it only matches the
    // watermark once the replay restores the real state.
    // Checked twice because an API response lands a moment before the app applies it.
    async waitForReplay() {
        const isSettled = () =>
            this.page.evaluate(() => {
                const playerId = sessionStorage.getItem("fp-current-player") ?? "";
                const states = JSON.parse(sessionStorage.getItem("fp-player-states") ?? "{}");
                const snapshots = JSON.parse(sessionStorage.getItem("fp-round-snapshots") ?? "{}");
                const shownRound = states[playerId]?.gameState?.lastResolvedRound ?? 0;

                return (snapshots[playerId]?.lastAnimatedRound ?? 0) === shownRound;
            });

        await expect
            .poll(
                async () => {
                    if (!(await isSettled())) return false;
                    await this.page.waitForTimeout(250);
                    return await isSettled();
                },
                { timeout: API_TIMEOUT },
            )
            .toBe(true);
    }

    // Logs the board's CSS animations and transform transitions from here on
    async recordAnimations() {
        await this.page.evaluate(() => {
            window.__animations = [];
            window.__lastAnimationAt = Date.now();
            if (document.body.dataset.animationRecorder) return;
            document.body.dataset.animationRecorder = "on";

            const record = (animation: IRecordedAnimation) => {
                window.__animations?.push(animation);
                window.__lastAnimationAt = Date.now();
            };
            const onBoard = (event: Event) => {
                const target = event.target;
                return target instanceof HTMLElement && target.closest("#gameBoardContainer") ? target : undefined;
            };
            const keyframeKinds: Record<string, IRecordedAnimation["kind"]> = {
                shiver: "hit",
                sink: "sink",
                "css-explosion-anim": "explosion",
            };

            document.addEventListener(
                "animationstart",
                (event) => {
                    const target = onBoard(event);
                    const kind = keyframeKinds[event.animationName];
                    if (!target || !kind) return;

                    const shipId = target.getAttribute("alt") ?? target.querySelector("img")?.getAttribute("alt");
                    record({ kind, shipId: shipId ?? undefined });
                },
                true,
            );

            // Projectiles slide their bullet sprite; moves slide a pivot wrapping the ship copy
            document.addEventListener(
                "transitionrun",
                (event) => {
                    const target = onBoard(event);
                    if (!target || event.propertyName !== "transform") return;

                    if (target.getAttribute("src")?.includes("bullet")) {
                        record({ kind: "projectile" });
                    } else if (target.firstElementChild?.id) {
                        record({ kind: "move", shipId: target.firstElementChild.id });
                    }
                },
                true,
            );

            const markActive = () => (window.__lastAnimationAt = Date.now());
            document.addEventListener("animationend", markActive, true);
            document.addEventListener("transitionend", markActive, true);
        });
    }

    async recordedAnimations(): Promise<IRecordedAnimation[]> {
        return await this.page.evaluate(() => window.__animations ?? []);
    }

    // Local previews play straight after an order is given; let them finish before moving on
    async waitForAnimationsToSettle(quietMs = 1500) {
        await this.page.evaluate(() => (window.__lastAnimationAt = Date.now()));
        await expect
            .poll(() => this.page.evaluate((quiet) => Date.now() - (window.__lastAnimationAt ?? 0) > quiet, quietMs), {
                timeout: API_TIMEOUT,
            })
            .toBe(true);
    }

    private tile(tileId: string) {
        return this.page.locator(`[id="${tileId}"]`);
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
            const { currentRound, initiative, isOver, winners, players, ships, hulls } = states[playerId].gameState;

            return { playerId, currentRound, initiative, isOver, winners, players, ships, hulls: hulls ?? [] };
        });
    }
}
