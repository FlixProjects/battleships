import { expect, type Locator, type Page, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FRIGATE_REF_NO, PageHelper } from "./helpers/PageHelper";
import { TEST_CONFIG, type TConfigOverride } from "./helpers/test-config";

// Records one game for the How to Play clips. Skipped unless RECORD_HOW_TO_PLAY is set.
// Writes the raw video and markers.json; scripts/cut-how-to-play-clips.mjs cuts the clips.
// Alice (row 0) is recorded; Bob (row 6) only deploys and passes.

const OUT_DIR = path.resolve(".recordings/how-to-play");
const VIEWPORT = { width: 1280, height: 800 };
const BEAT = 900;
// Pause after each visible interaction so viewers can see its effect
const INTERACTION_DELAY = 500;

const ALICE_FLAGSHIP = "4/0";
const ALICE_FLAGSHIP_FRONT = "4/1";
const ALICE_FRIGATE = "3/0";
const ALICE_FRIGATE_STATION = "3/3";
const BOB_FLAGSHIP = "4/6";
const BOB_FLAGSHIP_FRONT = "4/5";

// mergician replaces arrays, so the whole hull list goes in
const weakFlagship = (): TConfigOverride => {
    const hullTemplates = TEST_CONFIG.shipsConfig?.tudf_flagship0?.hullTemplates ?? [];
    return {
        shipsConfig: {
            tudf_flagship0: { hullTemplates: hullTemplates.map((hull) => ({ ...hull, maxHealth: 1, armor: 0 })) },
        },
    };
};

// Max health of a player's flagship hulls in the shared local game
const storedFlagshipHealth = async (page: Page, playerName: string) =>
    await page.evaluate((name) => {
        const state = JSON.parse(sessionStorage.getItem("fp-game-state") ?? "{}");
        const player = state.players?.find((p: { name: string }) => p.name === name);
        const flagship = state.ships?.find(
            (s: { playerId: string; isFlagship: boolean }) => s.playerId === player?.id && s.isFlagship,
        );
        return (flagship?.hullTemplates ?? []).map((h: { maxHealth: number }) => h.maxHealth);
    }, playerName);

// Local-only controls stay clickable but don't show in the clips
const HIDE_DEV_CONTROLS = `#switchPlayerBtn, #resetLocalGameButtonContainer { opacity: 0 !important; }`;

type TActionArg = string | number | boolean | object | undefined;
type TAction = (...args: TActionArg[]) => Promise<void>;

// Wraps visible interactions (clicks, typing, key presses) so each is followed by a pause.
// fill() is left out: the helpers only use it to re-enter text already typed on screen.
// Returns a function that restores the originals.
const delayInteractions = (page: Page, ms: number) => {
    const targets: [object, string[]][] = [
        [Object.getPrototypeOf(page.locator("body")), ["click", "dblclick", "press", "pressSequentially", "check"]],
        [Object.getPrototypeOf(page.mouse), ["click", "dblclick"]],
        [Object.getPrototypeOf(page.keyboard), ["press"]],
    ];
    const originals = targets.flatMap(([proto, names]) =>
        names.map((name) => ({ proto, name, original: Reflect.get(proto, name) as TAction })),
    );

    originals.forEach(({ proto, name, original }) => {
        Reflect.set(proto, name, async function (this: object, ...args: TActionArg[]) {
            const result = await original.apply(this, args);
            await new Promise((resolve) => setTimeout(resolve, ms));
            return result;
        });
    });

    return () => originals.forEach(({ proto, name, original }) => Reflect.set(proto, name, original));
};

interface ISegment {
    start: number;
    end: number;
}

class Recorder {
    private readonly startedAt = Date.now();
    private readonly segments: Record<string, ISegment[]> = {};
    private open: { name: string; start: number } | null = null;

    constructor(private readonly page: Page) {}

    private get now() {
        return (Date.now() - this.startedAt) / 1000;
    }

    async mark(name: string) {
        this.endMark();
        this.open = { name, start: this.now };
        await this.pause();
    }

    endMark() {
        if (!this.open) return;
        const { name, start } = this.open;
        (this.segments[name] ??= []).push({ start, end: this.now });
        this.open = null;
    }

    async pause(ms = BEAT) {
        await this.page.waitForTimeout(ms);
    }

    async spotlight(target: Locator) {
        await target.evaluate((el: HTMLElement) => {
            el.dataset.spotlight = el.style.outline;
            el.style.outline = "3px solid #6ee7b7";
            el.style.outlineOffset = "4px";
        });
    }

    async clearSpotlight(target: Locator) {
        await target.evaluate((el: HTMLElement) => {
            el.style.outline = el.dataset.spotlight ?? "";
            el.style.outlineOffset = "";
        });
    }

    save(videoPath: string) {
        this.endMark();
        writeFileSync(
            path.join(OUT_DIR, "markers.json"),
            JSON.stringify({ video: videoPath, segments: this.segments }, null, 2),
        );
    }
}

test.skip(!process.env.RECORD_HOW_TO_PLAY, "set RECORD_HOW_TO_PLAY=1 to record the How to Play clips");
test.describe.configure({ timeout: 900_000 });

test("record the How to Play game", async ({ browser }) => {
    mkdirSync(OUT_DIR, { recursive: true });
    const context = await browser.newContext({
        baseURL: test.info().project.use.baseURL,
        viewport: VIEWPORT,
        recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    });
    await context.addInitScript((css) => {
        document.addEventListener("DOMContentLoaded", () => {
            const style = document.createElement("style");
            style.textContent = css;
            document.head.appendChild(style);
        });
    }, HIDE_DEV_CONTROLS);

    // Fail a stuck step quickly instead of waiting out the whole test timeout
    context.setDefaultTimeout(30_000);

    const page = await context.newPage();
    const rec = new Recorder(page);
    const restoreInteractions = delayInteractions(page, INTERACTION_DELAY);
    try {
        await recordGame(page, rec);
    } finally {
        restoreInteractions();
    }

    const videoPath = (await page.video()?.path()) ?? "";
    await context.close();
    rec.save(videoPath);
});

const recordGame = async (page: Page, rec: Recorder) => {
    const helper = new PageHelper(page);

    const showShipDetails = async (tileId: string) => {
        await helper.selectShip(tileId);
        await rec.pause(400);
        await page.locator("#select-action-tooltip").click();
        await expect(page.locator("#details-panel")).toBeInViewport();
        await rec.pause(2500);
        await page.getByRole("button", { name: "Close details" }).click();
        await rec.pause(600);
    };

    const commandPoints = page.getByText(/^Command Points:/);
    const hand = page.locator(".card-row").first().locator("..");
    const playbackButton = page.getByRole("button", { name: "Playback" });

    await page.goto("/");
    await helper.guestLogin();

    // 1: create (Alice) ... join (Bob) below
    await rec.mark("create-join");
    await page.locator("#playerName").pressSequentially("Alice", { delay: 90 });
    const gameCode = await helper.createGame("Alice");
    await rec.pause(1500);
    rec.endMark();

    // 2: the creator waits for an opponent
    await rec.mark("wait-refresh");
    await rec.pause(1200);
    rec.endMark();

    await helper.handOverToNewPlayer();
    await rec.mark("create-join");
    await page.locator("#playerName").pressSequentially("Bob", { delay: 90 });
    await page.locator("#joinCode").pressSequentially(gameCode, { delay: 120 });
    await helper.joinGame("Bob", gameCode, weakFlagship());
    await rec.pause(1500);
    rec.endMark();

    await expect.poll(() => storedFlagshipHealth(page, "Bob")).toEqual([1, 1]);
    await helper.deployFlagship(BOB_FLAGSHIP);
    await helper.submitTurn();

    // 2 (cont.): back to Alice, who refreshes to see the board
    await page.locator("#switchPlayerBtn").click();
    await rec.mark("wait-refresh");
    await helper.refresh();
    await rec.pause(1500);
    rec.endMark();

    await helper.stackHand([FRIGATE_REF_NO, "flare"]);

    // 3: flagship first, on the highlighted home row
    await rec.mark("deploy-flagship");
    await rec.pause(800);
    await helper.deployFlagship(ALICE_FLAGSHIP);
    await rec.pause(1500);
    rec.endMark();

    // 4 + 7: a ship card costs a command point
    await rec.spotlight(commandPoints);
    await rec.mark("command-points");
    await helper.deployShipCard(FRIGATE_REF_NO, ALICE_FRIGATE);
    await rec.pause(1800);
    rec.endMark();
    await rec.clearSpotlight(commandPoints);

    // 6: card details without playing the card
    const infoCell = helper.cardInfoCell("flare");
    await rec.spotlight(infoCell);
    await rec.mark("details");
    await infoCell.click();
    await rec.pause(2500);
    await page.getByRole("button", { name: "Close details" }).click();
    await rec.pause(600);
    rec.endMark();
    await rec.clearSpotlight(infoCell);

    // 5: played cards are replaced when the round resolves
    await rec.spotlight(hand);
    await rec.mark("hand");
    await helper.submitTurn();
    await rec.pause(1800);
    rec.endMark();
    await rec.clearSpotlight(hand);

    // 6 (cont.): any ship's action menu has an info button
    await rec.mark("details");
    await showShipDetails(ALICE_FLAGSHIP_FRONT);
    rec.endMark();

    // Round 2 — 8: move, 7: a support card
    await rec.mark("move");
    await helper.moveShip(ALICE_FRIGATE, ALICE_FRIGATE_STATION);
    await helper.waitForAnimationsToSettle(800);
    await rec.pause(1000);
    rec.endMark();

    await rec.mark("play-flare");
    await helper.playFlare(BOB_FLAGSHIP_FRONT);
    await rec.pause(1500);
    rec.endMark();

    // 10: submitting first waits for the other player
    const turnButton = helper.turnButton;
    await rec.spotlight(turnButton);
    await rec.mark("submit");
    await helper.submitTurn();
    await expect(turnButton).toHaveText("Awaiting other player");
    await rec.pause(2000);
    rec.endMark();
    await rec.clearSpotlight(turnButton);

    await helper.switchPlayer();
    await helper.submitTurn();

    // 11: the flare reveals the enemy flagship
    await page.locator("#switchPlayerBtn").click();
    await rec.mark("fog-of-war");
    await rec.pause(1200);
    await helper.refresh();
    await rec.pause(2500);
    rec.endMark();
    await page.screenshot({ path: path.join(OUT_DIR, "00-rules.png") });

    // 12: replay the last round on demand
    await rec.spotlight(playbackButton);
    await rec.mark("playback");
    await playbackButton.click();
    await helper.waitForReplay();
    await rec.pause(1500);
    rec.endMark();
    await rec.clearSpotlight(playbackButton);

    // 6 (cont.): an enemy ship's menu only has the info button
    await rec.mark("details");
    await showShipDetails(BOB_FLAGSHIP_FRONT);
    rec.endMark();

    // Round 3 — 9: attack
    await rec.mark("attack");
    await helper.attack(ALICE_FLAGSHIP_FRONT, BOB_FLAGSHIP);
    await expect.poll(() => helper.pendingActionCount()).toBe(1);
    await rec.pause(1500);
    rec.endMark();
    await helper.dismissSelection();
    await helper.attack(ALICE_FRIGATE_STATION, BOB_FLAGSHIP_FRONT);
    await expect.poll(() => helper.pendingActionCount()).toBe(2);
    await helper.submitTurn();

    await helper.switchPlayer();
    await helper.submitTurn();

    // 13: the shots land and the game ends
    await page.locator("#switchPlayerBtn").click();
    await rec.mark("game-end");
    await helper.refresh();
    await expect(page.getByText("You won!")).toBeVisible();
    await rec.pause(3000);
    rec.endMark();
};
