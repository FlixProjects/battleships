import { expect, type Page, test } from "@playwright/test";
import {
    DESTROYER_REF_NO,
    FLAGSHIP_REF_NO,
    FRIGATE_REF_NO,
    hullAt,
    type IPlayerView,
    PageHelper,
} from "./helpers/PageHelper";

// Whole games played through the UI, from the opening deploys to a winner.
// Each round Alice gives her orders and submits, then Bob; Bob's submit resolves it.

const ALICE_FRONT = "2/1";
const ALICE_REAR = "2/0";
const BOB_FRONT = "2/5";
const BOB_REAR = "2/6";

test.describe.configure({ timeout: 600_000 });

let helper: PageHelper;

type TOrders = () => Promise<void>;

// Starts with Alice current and leaves Bob current, looking at the resolved round
const playRound = async (aliceOrders: TOrders, bobOrders: TOrders) => {
    await aliceOrders();
    await helper.submitTurn();

    await helper.switchPlayer();
    await bobOrders();
    await helper.submitTurn();
};

// A deck holds several ships of a type, so take the one that is on the board
const ownShip = (view: IPlayerView, refNo: string) =>
    view.ships.find((ship) => ship.refNo === refNo && ship.playerId === view.playerId && ship.deployed);

const enemyShips = (view: IPlayerView) => view.ships.filter((ship) => ship.playerId !== view.playerId);

const healthAt = (view: IPlayerView, tileId: string) => hullAt(view, tileId)?.remainingHealth;

const expectGameOver = async (page: Page, winnerId: string) => {
    const view = await helper.readPlayerView();
    expect(view.isOver).toBe(true);
    expect(view.winners).toEqual([winnerId]);

    await expect(page.getByText(view.playerId === winnerId ? "You won!" : "You lost!")).toBeVisible();
    await expect(helper.turnButton).toHaveText("Game Over");
    await expect(helper.turnButton).toBeDisabled();
};

test.beforeEach(async ({ page }) => {
    helper = new PageHelper(page);
    await page.goto("/");
    await helper.guestLogin();
    await helper.startGameWithFlagships();
});

test("Alice out-shoots Bob's flagship while his frigate hunts hers down", async ({ page }) => {
    const ALICE_FRIGATE_DEPLOY = "1/0";
    const ALICE_FRIGATE_STATION = "1/3";
    const BOB_FRIGATE_DEPLOY = "3/6";
    const BOB_FRIGATE_STATION = "3/3";

    const aliceId = (await helper.readPlayerView()).playerId;
    const freshHealth = healthAt(await helper.readPlayerView(), ALICE_REAR) ?? 0;

    // Round 2: both bring out a frigate and open fire on the enemy flagship's rear
    await playRound(
        async () => {
            await helper.stackHand(["inspire", FRIGATE_REF_NO]);
            const commandPoints = await helper.ownCommandPoints();

            await helper.playInspire();
            await helper.deployShipCard(FRIGATE_REF_NO, ALICE_FRIGATE_DEPLOY);
            await helper.attack(ALICE_FRONT, BOB_REAR);

            // Inspire's extra point leaves one over after a deploy and a shot
            expect(await helper.ownCommandPoints()).toBe(commandPoints + 1 - 2);
        },
        async () => {
            await helper.stackHand([FRIGATE_REF_NO]);
            await helper.deployShipCard(FRIGATE_REF_NO, BOB_FRIGATE_DEPLOY);
            await helper.attack(BOB_FRONT, ALICE_REAR);
        },
    );

    let bob = await helper.readPlayerView();
    expect(bob.currentRound).toBe(3);
    expect(hullAt(bob, BOB_FRIGATE_DEPLOY)?.shipId).toBe(ownShip(bob, FRIGATE_REF_NO)?.id);
    expect(hullAt(bob, BOB_REAR)?.destroyed).toBeFalsy();
    expect(healthAt(bob, BOB_REAR)).toBeLessThan(freshHealth);

    await helper.switchPlayer();
    let alice = await helper.readPlayerView();
    expect(hullAt(alice, ALICE_FRIGATE_DEPLOY)?.shipId).toBe(ownShip(alice, FRIGATE_REF_NO)?.id);
    expect(healthAt(alice, ALICE_REAR)).toBeLessThan(freshHealth);
    expect(await helper.handRefNos()).not.toContain("inspire");

    // Round 3: the frigates close on each other; a second shot sinks each flagship's rear hull
    await playRound(
        async () => {
            await helper.moveShip(ALICE_FRIGATE_DEPLOY, ALICE_FRIGATE_STATION);
            await helper.attack(ALICE_FRONT, BOB_REAR);
        },
        async () => {
            await helper.moveShip(BOB_FRIGATE_DEPLOY, BOB_FRIGATE_STATION);
            await helper.attack(BOB_FRONT, ALICE_REAR);
        },
    );

    bob = await helper.readPlayerView();
    expect(hullAt(bob, BOB_REAR)?.destroyed).toBe(true);
    expect(ownShip(bob, FLAGSHIP_REF_NO)?.destroyed).toBeFalsy();
    expect(hullAt(bob, BOB_FRIGATE_STATION)?.shipId).toBe(ownShip(bob, FRIGATE_REF_NO)?.id);
    // The frigates have sailed into each other's sight
    expect(enemyShips(bob).map((ship) => ship.refNo)).toEqual([FRIGATE_REF_NO]);

    await helper.switchPlayer();
    alice = await helper.readPlayerView();
    expect(hullAt(alice, ALICE_REAR)?.destroyed).toBe(true);
    expect(ownShip(alice, FLAGSHIP_REF_NO)?.destroyed).toBeFalsy();
    expect(hullAt(alice, ALICE_FRIGATE_STATION)?.shipId).toBe(ownShip(alice, FRIGATE_REF_NO)?.id);
    expect(enemyShips(alice).map((ship) => ship.refNo)).toEqual([FRIGATE_REF_NO]);

    // Round 4: Alice lights up Bob's flagship and hits its front; Bob's frigate sinks hers
    await playRound(
        async () => {
            await helper.stackHand(["flare"]);
            await helper.playFlare(BOB_FRONT);
            await helper.attack(ALICE_FRONT, BOB_FRONT);
        },
        async () => {
            await helper.attack(BOB_FRIGATE_STATION, ALICE_FRIGATE_STATION);
        },
    );

    bob = await helper.readPlayerView();
    expect(hullAt(bob, BOB_FRONT)?.destroyed).toBeFalsy();
    expect(healthAt(bob, BOB_FRONT)).toBeLessThan(freshHealth);

    await helper.switchPlayer();
    alice = await helper.readPlayerView();
    expect(ownShip(alice, FRIGATE_REF_NO)?.destroyed).toBe(true);
    expect(enemyShips(alice).map((ship) => ship.refNo)).toContain(FLAGSHIP_REF_NO);
    expect(alice.isOver).toBe(false);

    // Round 5: a second hit on the front finishes Bob's flagship; his reply only wounds hers
    await playRound(
        async () => {
            await helper.attack(ALICE_FRONT, BOB_FRONT);
        },
        async () => {
            await helper.attack(BOB_FRONT, ALICE_FRONT);
        },
    );

    bob = await helper.readPlayerView();
    expect(ownShip(bob, FLAGSHIP_REF_NO)?.destroyed).toBe(true);
    await expectGameOver(page, aliceId);

    await helper.switchPlayer();
    alice = await helper.readPlayerView();
    expect(ownShip(alice, FLAGSHIP_REF_NO)?.destroyed).toBeFalsy();
    expect(hullAt(alice, ALICE_FRONT)?.destroyed).toBeFalsy();
    await expectGameOver(page, aliceId);
});

test("Bob strips the armour off Alice's flagship with a Flare-guided Airstrike and sinks it", async ({ page }) => {
    const DESTROYER_DEPLOY = "1/0";
    const DESTROYER_ADVANCE = "1/2";

    const freshHealth = healthAt(await helper.readPlayerView(), ALICE_FRONT) ?? 0;

    // Round 2: Alice brings out a destroyer; Bob lights up her flagship. Both fire on the rear hull
    await playRound(
        async () => {
            await helper.stackHand([DESTROYER_REF_NO]);
            await helper.deployShipCard(DESTROYER_REF_NO, DESTROYER_DEPLOY);
            await helper.attack(ALICE_FRONT, BOB_REAR);
        },
        async () => {
            expect(enemyShips(await helper.readPlayerView())).toEqual([]);
            await helper.stackHand(["flare"]);
            await helper.playFlare(ALICE_FRONT);
            await helper.attack(BOB_FRONT, ALICE_REAR);
        },
    );

    let bob = await helper.readPlayerView();
    const bobId = bob.playerId;
    // The Flare shows Bob the flagship he could not see before
    expect(enemyShips(bob).map((ship) => ship.refNo)).toContain(FLAGSHIP_REF_NO);

    await helper.switchPlayer();
    let alice = await helper.readPlayerView();
    expect(hullAt(alice, DESTROYER_DEPLOY)?.shipId).toBe(ownShip(alice, DESTROYER_REF_NO)?.id);

    // Round 3: Bob calls an Airstrike down the flagship's column and sinks its rear hull
    await playRound(
        async () => {
            await helper.moveShip(DESTROYER_DEPLOY, DESTROYER_ADVANCE);
            await helper.attack(ALICE_FRONT, BOB_REAR);
        },
        async () => {
            await helper.stackHand(["airstrike"]);
            await helper.playAirstrike(ALICE_FRONT, "vertical");
            await helper.attack(BOB_FRONT, ALICE_REAR);
        },
    );

    bob = await helper.readPlayerView();
    expect(hullAt(bob, BOB_REAR)?.destroyed).toBe(true);
    expect(ownShip(bob, FLAGSHIP_REF_NO)?.destroyed).toBeFalsy();

    await helper.switchPlayer();
    alice = await helper.readPlayerView();
    expect(hullAt(alice, ALICE_REAR)?.destroyed).toBe(true);
    expect(hullAt(alice, DESTROYER_ADVANCE)?.shipId).toBe(ownShip(alice, DESTROYER_REF_NO)?.id);
    // The Airstrike has not landed yet
    expect(healthAt(alice, ALICE_FRONT)).toBe(freshHealth);
    expect(hullAt(alice, ALICE_FRONT)?.armor).toBeGreaterThan(0);

    // Round 4: the Airstrike lands first, so Bob's single shot at the front hull is enough
    await playRound(
        async () => {
            await helper.attack(ALICE_FRONT, BOB_FRONT);
        },
        async () => {
            await helper.attack(BOB_FRONT, ALICE_FRONT);
        },
    );

    bob = await helper.readPlayerView();
    expect(ownShip(bob, FLAGSHIP_REF_NO)?.destroyed).toBeFalsy();
    expect(hullAt(bob, BOB_FRONT)?.destroyed).toBeFalsy();
    await expectGameOver(page, bobId);

    await helper.switchPlayer();
    alice = await helper.readPlayerView();
    expect(hullAt(alice, ALICE_FRONT)?.destroyed).toBe(true);
    expect(ownShip(alice, FLAGSHIP_REF_NO)?.destroyed).toBe(true);
    // The destroyer outlives the flagship, but the game is lost with it
    expect(ownShip(alice, DESTROYER_REF_NO)?.destroyed).toBeFalsy();
    await expectGameOver(page, bobId);
});
