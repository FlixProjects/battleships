import { expect, type Page } from "@playwright/test";
import { type TConfigOverride, TEST_BOARD, withTestConfig } from "./test-config";

// Local mode (DEPLOY_ENV=local) keeps the game in the tab's sessionStorage in
// place of S3, so both players share one tab and swap via "Switch Player".

// SAM spins up a container per cold lambda, so first hits can be slow
const API_TIMEOUT = 60_000;

export interface IPlainShip {
    id: string;
    refNo: string;
    name: string;
    playerId: string;
    deployed?: boolean;
    destroyed?: boolean;
    attackRange: number;
    attackMinRange?: number;
    attackCommandPointCost: number;
    remainingAttacks: number;
    movementCommandPointCost: number;
    remainingMovement: number;
}

export interface IPlainHull {
    id: string;
    shipId: string;
    location: [number, number];
    remainingHealth: number;
    armor: number;
    front?: boolean;
    destroyed?: boolean;
}

// The slice of a get-game response that must not reveal the opponent's secrets
export interface IWireGameState {
    players: { id: string; hand: string[]; pendingActions: string[] }[];
    ships: { id: string; playerId: string }[];
    hulls?: { shipId: string }[];
    cards: { id: string }[];
    decks: { playerId: string; cards: string[]; played: string[] }[];
    actions?: { playerId: string }[];
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

export type TSupportRefNo = "flare" | "inspire" | "airstrike";

export const FRIGATE_REF_NO = "tudf_frigate0";

export const DESTROYER_REF_NO = "tudf_destroyer0";

type TShipCardRefNo = typeof FRIGATE_REF_NO | typeof DESTROYER_REF_NO;

type TLineOrientation = "vertical" | "horizontal";

export interface IBoardMarks {
    highlighted: string[];
    targeted: string[];
    tinted: string[];
}

export const IDLE_BOARD: IBoardMarks = { highlighted: [], targeted: [], tinted: [] };

type TScreen = "Login" | "Lobby" | "Game";
type TMenuItem = "Login" | "Game" | "Lobby" | "Exit";

export interface IRecordedAnimation {
    kind: "move" | "projectile" | "hit" | "sink" | "explosion";
    shipId?: string;
}

export interface IBoardAtMoveStart {
    movingShipId: string;
    effects: string[];
    shipIds: string[];
}

declare global {
    interface Window {
        __animations?: IRecordedAnimation[];
        __lastAnimationAt?: number;
        __boardAtMoveStart?: IBoardAtMoveStart[];
    }
}

export const deployedFlagships = (view: IPlayerView) =>
    view.ships.filter((ship) => ship.refNo === FLAGSHIP_REF_NO && ship.deployed);

export const hullAt = (view: IPlayerView, tileId: string) =>
    view.hulls.find((hull) => hull.location.join("/") === tileId);

export const tileOf = (hull: IPlainHull) => hull.location.join("/");

// Ranges count straight board steps, as the path finder does
export const stepsBetween = (fromTileId: string, toTileId: string) => {
    const [fromCol, fromRow] = fromTileId.split("/").map(Number);
    const [toCol, toRow] = toTileId.split("/").map(Number);
    return Math.abs(fromCol - toCol) + Math.abs(fromRow - toRow);
};

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
        return response;
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
        return (await this.ownFlagship()).id;
    }

    async ownFlagship(): Promise<IPlainShip> {
        const view = await this.readPlayerView();
        const flagship = view.ships.find((ship) => ship.refNo === FLAGSHIP_REF_NO && ship.playerId === view.playerId);
        if (!flagship) throw new Error("The current player has no flagship");

        return flagship;
    }

    async ownFrontTile() {
        const [view, flagship] = await Promise.all([this.readPlayerView(), this.ownFlagship()]);
        const front = view.hulls.find((hull) => hull.shipId === flagship.id && hull.front);
        if (!front) throw new Error("The flagship has no front hull");

        return tileOf(front);
    }

    async ownCommandPoints() {
        const view = await this.readPlayerView();
        return view.players.find((player) => player.id === view.playerId)?.commandPoints ?? 0;
    }

    // Picks whichever tile the board offers, so the test doesn't encode the ship's range
    private async clickFirstOffered() {
        await expect.poll(async () => (await this.highlightedTiles()).length).toBeGreaterThan(0);
        const [tileId] = await this.highlightedTiles();
        await this.clickTile(tileId);
        return tileId;
    }

    async attackFirstTarget(fromTileId: string) {
        await this.selectShip(fromTileId);
        await this.attackButton.click();
        return await this.clickFirstOffered();
    }

    async moveToFirstDestination(fromTileId: string) {
        await this.selectShip(fromTileId);
        await this.moveButton.click();
        const tileId = await this.clickFirstOffered();
        await this.page.locator("#path-menu-confirm").click();
        return tileId;
    }

    // Tiles the current interaction offers, marked by their pulsing highlight
    async highlightedTiles(): Promise<string[]> {
        return await this.page
            .locator(".tile")
            .evaluateAll((tiles) =>
                tiles.filter((tile) => (tile as HTMLElement).style.animation.includes("pulse")).map((tile) => tile.id),
            );
    }

    // What the board shows of the current interaction, in tile order. A tile appears once
    // per target icon it holds, so a doubled icon shows up as a repeat.
    async boardMarks(): Promise<IBoardMarks> {
        return await this.page.locator(".tile").evaluateAll((tiles) => {
            const elements = tiles as HTMLElement[];
            return {
                highlighted: elements.filter((tile) => tile.style.animation.includes("pulse")).map((tile) => tile.id),
                targeted: elements.flatMap((tile) =>
                    Array.from(tile.querySelectorAll('img[id^="target-icon-"]')).map(() => tile.id),
                ),
                tinted: elements
                    .filter((tile) => tile.style.background.includes("255, 110, 110"))
                    .map((tile) => tile.id),
            };
        });
    }

    // Support cards whose row is marked as the one being played
    async selectedCards(): Promise<string[]> {
        return await this.page
            .locator(".card-row")
            .evaluateAll((rows) =>
                rows
                    .filter((row) => (row as HTMLElement).style.animation.includes("pulse"))
                    .map((row) => row.querySelector("img")?.getAttribute("alt") ?? ""),
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

    // The local backend builds a player's side of the game from the config sent along with the request:
    // the test config, with any override a spec layers on top
    private async sendConfigOverride(path: RegExp, override?: TConfigOverride) {
        const overrideConfig = withTestConfig(override);

        await this.page.route(
            path,
            (route) => route.continue({ postData: { ...route.request().postDataJSON(), overrideConfig } }),
            { times: 1 },
        );
    }

    async createGame(playerName: string, overrideConfig?: TConfigOverride): Promise<string> {
        await this.sendConfigOverride(/\/api\/create/, overrideConfig);
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

    async joinGame(playerName: string, gameCode: string, overrideConfig?: TConfigOverride) {
        await this.sendConfigOverride(/\/api\/join/, overrideConfig);
        await this.page.locator("#playerName").fill(playerName);
        await this.page.locator("#joinCode").fill(gameCode);
        await this.clickAndWaitFor(/\/api\/join/, () => this.page.locator("#joinGameBtn").click());
        await expect(this.page.locator(".tile")).toHaveCount(TEST_BOARD.rows * TEST_BOARD.columns);
    }

    // The creator hands the tab over; the second player signs in as a fresh guest
    async handOverToNewPlayer() {
        await this.page.locator("#switchPlayerBtn").click();
        await this.page.locator("#hamburgerBtn").click();
        await this.page.getByRole("button", { name: "Login", exact: true }).click();
        await this.guestLogin();
    }

    // Refresh re-reads the shared local game so the incoming player sees the other's changes
    // Returns what the server sent the incoming player
    async switchPlayer(): Promise<IWireGameState> {
        await this.page.locator("#switchPlayerBtn").click();
        return await this.refresh();
    }

    async refresh(): Promise<IWireGameState> {
        const response = await this.clickAndWaitFor(/\/api\?code=/, () => this.page.locator("#refreshBtn").click());
        await this.waitForReplay();

        return (await response.json()).gameState;
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

    // A click off the board ends whatever selection is open
    async dismissSelection() {
        await this.page.mouse.click(1, 1);
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

    // Notes which effects and ships are drawn on the board each time a ship starts moving, from here on
    async recordBoardAtMoveStart() {
        await this.page.evaluate(() => {
            window.__boardAtMoveStart = [];
            if (document.body.dataset.boardRecorder) return;
            document.body.dataset.boardRecorder = "on";

            document.addEventListener(
                "transitionrun",
                (event) => {
                    const target = event.target;
                    if (!(target instanceof HTMLElement) || !target.closest("#gameBoardContainer")) return;
                    if (event.propertyName !== "transform" || !target.firstElementChild?.id) return;

                    const layer = "#gameBoardStaticLayer";
                    const effects = Array.from(document.querySelectorAll<HTMLElement>(`${layer} > *`))
                        .map((sprite) => sprite.style.backgroundImage || (sprite.getAttribute("alt") ?? ""))
                        .map((label) => /flare|airstrike/.exec(label)?.[0] ?? "")
                        .filter((label) => label !== "");
                    const shipIds = Array.from(document.querySelectorAll(`${layer} img[alt]`)).map(
                        (sprite) => sprite.getAttribute("alt") ?? "",
                    );
                    window.__boardAtMoveStart?.push({
                        movingShipId: target.firstElementChild.id,
                        effects,
                        shipIds: Array.from(new Set(shipIds)),
                    });
                },
                true,
            );
        });
    }

    async boardAtMoveStart(): Promise<IBoardAtMoveStart[]> {
        return await this.page.evaluate(() => window.__boardAtMoveStart ?? []);
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

    // Hands are shuffled, so swap the wanted support cards in from the draw pile.
    // Local mode posts the stored game with every request, so the server plays along.
    async stackHand(refNos: (TSupportRefNo | TShipCardRefNo)[]) {
        await this.page.evaluate(
            ({ wanted, flagshipRefNo }) => {
                const playerId = sessionStorage.getItem("fp-current-player") ?? "";
                const state = JSON.parse(sessionStorage.getItem("fp-game-state") ?? "{}");
                const player = state.players.find((p: { id: string }) => p.id === playerId);
                const deck = state.decks.find((d: { playerId: string }) => d.playerId === playerId);
                const refNoOf = (cardId: string): string =>
                    state.cards.find((card: { id: string }) => card.id === cardId)?.refNo ?? "";
                const isKept = (cardId: string) => [flagshipRefNo, ...wanted].includes(refNoOf(cardId));

                for (const refNo of wanted) {
                    if (player.hand.some((cardId: string) => refNoOf(cardId) === refNo)) continue;

                    const deckIndex = deck.cards.findIndex((cardId: string) => refNoOf(cardId) === refNo);
                    const handIndex = player.hand.findIndex((cardId: string) => !isKept(cardId));
                    if (deckIndex < 0 || handIndex < 0) throw new Error(`Cannot stack ${refNo} into the hand`);

                    [deck.cards[deckIndex], player.hand[handIndex]] = [player.hand[handIndex], deck.cards[deckIndex]];
                }

                sessionStorage.setItem("fp-game-state", JSON.stringify(state));
            },
            { wanted: refNos, flagshipRefNo: FLAGSHIP_REF_NO },
        );
        await this.refresh();
    }

    // Ship cards are labelled by ship id, so look up the current player's undeployed ships of that type.
    // Selects the card, then deploys on the given tile (or the first one offered) and returns it.
    async deployShipCard(refNo: TShipCardRefNo, tileId?: string) {
        const shipIds = await this.page.evaluate((wanted) => {
            const playerId = sessionStorage.getItem("fp-current-player") ?? "";
            const { gameState } = JSON.parse(sessionStorage.getItem("fp-player-states") ?? "{}")[playerId];
            return gameState.ships
                .filter(
                    (ship: { refNo: string; playerId: string; deployed?: boolean }) =>
                        ship.refNo === wanted && ship.playerId === playerId && !ship.deployed,
                )
                .map((ship: { id: string }) => ship.id);
        }, refNo);
        const staged = await this.pendingActionCount();

        await this.page
            .locator(shipIds.map((id: string) => `.card-row img[alt="${id}"]`).join(", "))
            .first()
            .click();
        await expect.poll(async () => (await this.highlightedTiles()).length).toBeGreaterThan(0);
        const target = tileId ?? (await this.highlightedTiles())[0];
        await this.clickTile(target);
        await expect.poll(() => this.pendingActionCount()).toBe(staged + 1);

        return target;
    }

    // The deck holds duplicates (e.g. two Flares), so take the first copy in hand
    supportCard(refNo: TSupportRefNo) {
        return this.page.locator(`.card-row img[alt="${refNo}"]`).first();
    }

    private async pickSupportTarget(refNo: TSupportRefNo, tileId: string) {
        await this.supportCard(refNo).click();
        await expect.poll(async () => (await this.highlightedTiles()).length).toBeGreaterThan(0);
        await this.clickTile(tileId);
    }

    async playFlare(tileId: string) {
        const staged = await this.pendingActionCount();
        await this.pickSupportTarget("flare", tileId);
        await expect.poll(() => this.pendingActionCount()).toBe(staged + 1);
    }

    // Inspire has no target; any board click confirms it
    async playInspire() {
        const staged = await this.pendingActionCount();
        await this.pickSupportTarget("inspire", "0/3");
        await expect.poll(() => this.pendingActionCount()).toBe(staged + 1);
    }

    async playAirstrike(centerTileId: string, orientation: TLineOrientation) {
        const staged = await this.pendingActionCount();
        await this.pickSupportTarget("airstrike", centerTileId);
        await expect(this.pathMenu).toBeVisible();
        if ((await this.drawnLineOrientation()) !== orientation) {
            await this.page.locator("#path-menu-right").click();
            await expect.poll(() => this.drawnLineOrientation()).toBe(orientation);
        }
        await this.page.locator("#path-menu-confirm").click();
        await expect.poll(() => this.pendingActionCount()).toBe(staged + 1);
    }

    // A vertical line keeps one x across all of its drawn points
    private async drawnLineOrientation(): Promise<TLineOrientation | null> {
        const points = await this.drawnRoute();
        if (!points) return null;

        const xs = points
            .trim()
            .split(/\s+/)
            .map((point) => Number(point.split(",")[0]));
        return xs.every((x) => x === xs[0]) ? "vertical" : "horizontal";
    }

    async handRefNos(): Promise<string[]> {
        return await this.page.evaluate(() => {
            const playerId = sessionStorage.getItem("fp-current-player") ?? "";
            const { gameState } = JSON.parse(sessionStorage.getItem("fp-player-states") ?? "{}")[playerId];
            const hand: string[] = gameState.players.find((p: { id: string }) => p.id === playerId)?.hand ?? [];

            return hand.map(
                (cardId) => gameState.cards.find((card: { id: string }) => card.id === cardId)?.refNo ?? "",
            );
        });
    }

    // The whole local game, as the server would hold it — not what any one player is sent
    async storedCardIds(playerId: string): Promise<string[]> {
        return await this.page.evaluate((ownerId) => {
            const state = JSON.parse(sessionStorage.getItem("fp-game-state") ?? "{}");
            const hand: string[] = state.players.find((p: { id: string }) => p.id === ownerId)?.hand ?? [];
            const deck = state.decks.find((d: { playerId: string }) => d.playerId === ownerId);

            return [...hand, ...(deck?.cards ?? []), ...(deck?.played ?? [])];
        }, playerId);
    }

    get pathMenu() {
        return this.page.locator("#path-menu");
    }

    // The dashed line the route picker draws over the board
    async drawnRoute(): Promise<string | null> {
        const route = this.page.locator("#gameBoardContainer polyline");
        if ((await route.count()) === 0) return null;
        return await route.getAttribute("points");
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
