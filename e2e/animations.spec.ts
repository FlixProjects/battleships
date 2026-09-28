import { expect, test } from "@playwright/test";
import { PageHelper } from "./helpers/PageHelper";

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
