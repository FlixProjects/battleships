import { expect, test } from "@playwright/test";
import { FLAGSHIP_REF_NO, FRIGATE_REF_NO, PageHelper } from "./helpers/PageHelper";

// Flagships are the only guaranteed card, so every scenario is fought with them.
// Alice's hulls sit on 2/0 + 2/1 (front) and Bob's on 2/6 + 2/5 (front): 4 tiles apart,
// inside the flagship's 3-5 range, with islands on 2/2 and 2/4 blocking forward moves.

const ALICE_FRONT = "2/1";
const BOB_FRONT = "2/5";
const BOB_REAR = "2/6";

// Each scenario plays several rounds against local SAM, which slows down under parallel load
test.describe.configure({ timeout: 240_000 });

let helper: PageHelper;

test.beforeEach(async ({ page }) => {
    helper = new PageHelper(page);
    await page.goto("/");
    await helper.guestLogin();
});

test("ordering a move animates the ship straight away", async () => {
    await helper.startGameWithFlagships();
    const aliceShipId = await helper.ownFlagshipId();

    await helper.recordAnimations();
    await helper.moveShip(ALICE_FRONT, "3/1");
    await helper.waitForAnimationsToSettle();

    expect(await helper.recordedAnimations()).toContainEqual({ kind: "move", shipId: aliceShipId });
});

test("ordering an attack fires a projectile straight away", async () => {
    await helper.startGameWithFlagships();

    await helper.recordAnimations();
    await helper.attack(ALICE_FRONT, BOB_FRONT);
    await helper.waitForAnimationsToSettle();

    expect(await helper.recordedAnimations()).toContainEqual({ kind: "projectile" });
});

test("the round replay moves the ship", async () => {
    await helper.startGameWithFlagships();
    await helper.submitTurn();

    await helper.switchPlayer();
    const bobShipId = await helper.ownFlagshipId();
    await helper.recordAnimations();
    await helper.moveShip(BOB_FRONT, "3/5");
    await helper.waitForAnimationsToSettle();

    // Bob resolves the round, so his replay plays as the submit returns
    await helper.recordAnimations();
    await helper.submitTurn();

    expect(await helper.recordedAnimations()).toContainEqual({ kind: "move", shipId: bobShipId });
});

test("the round replay shows a played Flare from the moment it was played", async () => {
    await helper.startGameWithFlagships();
    await helper.stackHand(["flare"]);

    // The Flare is played before the move, so it must already be up when the replay moves the ship
    await helper.supportCard("flare").click();
    await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
    await helper.clickTile("2/3");
    await expect.poll(() => helper.pendingActionCount()).toBe(1);
    await helper.recordAnimations();
    await helper.moveShip(ALICE_FRONT, "3/1");
    await helper.waitForAnimationsToSettle();
    await helper.submitTurn();

    await helper.switchPlayer();
    await helper.submitTurn();

    await helper.recordBoardAtMoveStart();
    await helper.switchPlayer();

    const boards = await helper.boardAtMoveStart();
    expect(boards.length).toBeGreaterThan(0);
    boards.forEach((board) => expect(board.effects).toContain("flare"));
});

// One opening round, resolved in alternating order with P1 (the creator) holding initiative:
//   P1 deploys flagship → P2 deploys flagship → P1 plays Flare beside it → P2 deploys frigate
//   → P1 deploys frigate → P2 moves frigate
// P1 resolves the round, so the replay under test plays as P1's submit returns.
test.describe("the opening-round replay, seen by the player who lit a Flare beside the enemy flagship", () => {
    const FLARE_TILE = "1/5";
    const P2_FRIGATE_TILE = "1/6";

    const playOpeningRound = async () => {
        const gameCode = await helper.createGame("Alice");
        await helper.handOverToNewPlayer();
        await helper.joinGame("Bob", gameCode);

        // P2 (Bob): flagship, frigate, then move the frigate
        await helper.stackHand([FRIGATE_REF_NO]);
        await helper.deployFlagship(BOB_REAR);
        await helper.deployShipCard(FRIGATE_REF_NO, P2_FRIGATE_TILE);
        await helper.recordAnimations();
        await helper.moveToFirstDestination(P2_FRIGATE_TILE);
        await helper.waitForAnimationsToSettle();
        await helper.submitTurn();

        // P1 (Alice): flagship, Flare beside P2's flagship, then a frigate
        await helper.switchPlayer();
        const alice = await helper.readPlayerView();
        expect(alice.initiative).toBe(alice.playerId);
        await helper.stackHand(["flare", FRIGATE_REF_NO]);
        await helper.deployFlagship("2/0");
        await helper.supportCard("flare").click();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
        await helper.clickTile(FLARE_TILE);
        await expect.poll(() => helper.pendingActionCount()).toBe(2);
        await helper.deployShipCard(FRIGATE_REF_NO);

        await helper.recordBoardAtMoveStart();
        await helper.submitTurn();

        const view = await helper.readPlayerView();
        const theirShips = view.ships.filter((ship) => ship.playerId !== view.playerId && ship.deployed);

        return {
            boards: await helper.boardAtMoveStart(),
            theirFlagshipId: theirShips.find((ship) => ship.refNo === FLAGSHIP_REF_NO)?.id,
            theirFrigateId: theirShips.find((ship) => ship.refNo === FRIGATE_REF_NO)?.id,
        };
    };

    test("replays the enemy frigate's move with the Flare already lit", async () => {
        const { boards, theirFrigateId } = await playOpeningRound();

        expect(theirFrigateId).toBeDefined();
        // A move animates in several steps (turn, slide), each noted separately
        expect(new Set(boards.map((board) => board.movingShipId))).toEqual(new Set([theirFrigateId]));
        boards.forEach((board) => expect(board.effects).toContain("flare"));
    });

    test("shows the enemy flagship from the moment the Flare lands, though it deployed unseen", async () => {
        const { boards, theirFlagshipId } = await playOpeningRound();

        expect(theirFlagshipId).toBeDefined();
        expect(boards.length).toBeGreaterThan(0);
        expect(boards[0].shipIds).toContain(theirFlagshipId);
    });
});

test("the round replay shows the shot to the attacker and the hit to the target", async () => {
    await helper.startGameWithFlagships();

    await helper.recordAnimations();
    await helper.attack(ALICE_FRONT, BOB_FRONT);
    await helper.waitForAnimationsToSettle();
    await helper.submitTurn();
    await helper.switchPlayer();
    const bobShipId = await helper.ownFlagshipId();

    await helper.recordAnimations();
    await helper.submitTurn();
    const bobSaw = await helper.recordedAnimations();
    expect(bobSaw).toContainEqual({ kind: "hit", shipId: bobShipId });
    // fog of war: Alice fired from outside Bob's vision
    expect(bobSaw).not.toContainEqual({ kind: "projectile" });

    await helper.recordAnimations();
    await helper.switchPlayer();
    expect(await helper.recordedAnimations()).toContainEqual({ kind: "projectile" });
});

test("the round replay sinks a destroyed ship", async () => {
    // Four rounds of fire: each hull's armour soaks the first shot, the second sinks it
    test.setTimeout(480_000);
    await helper.startGameWithFlagships();
    const targets = [BOB_REAR, BOB_REAR, BOB_FRONT, BOB_FRONT];

    for (const [round, target] of targets.entries()) {
        const isFinalShot = round === targets.length - 1;

        await helper.recordAnimations();
        await helper.attack(ALICE_FRONT, target);
        await helper.waitForAnimationsToSettle();
        await helper.submitTurn();
        await helper.switchPlayer();
        const bobShipId = await helper.ownFlagshipId();

        await helper.recordAnimations();
        await helper.submitTurn();
        const bobSaw = await helper.recordedAnimations();

        if (isFinalShot) {
            expect(bobSaw).toContainEqual({ kind: "sink", shipId: bobShipId });
        } else {
            expect(bobSaw).not.toContainEqual({ kind: "sink", shipId: bobShipId });
            await helper.switchPlayer();
        }
    }
});
