import { expect, test } from "@playwright/test";
import { type IBoardMarks, IDLE_BOARD, PageHelper, type TSupportRefNo } from "./helpers/PageHelper";

// One describe per ClickHandler: each opens its interaction, then checks the
// ways out of it (commit, cancel, back) leave the board and the staged orders
// consistent. Support cards are stacked into Alice's hand at the start of round 2.

const ALICE_FRONT = "2/1";

test.describe.configure({ timeout: 240_000 });

let helper: PageHelper;

test.beforeEach(async ({ page }) => {
    helper = new PageHelper(page);
    await page.goto("/");
    await helper.guestLogin();
    await helper.startGameWithFlagships();
});

type TFlow = "move" | "attack" | TSupportRefNo;

const SHIP_FLOWS: TFlow[] = ["move", "attack"];
const FLOWS: TFlow[] = [...SHIP_FLOWS, "flare", "airstrike", "inspire"];

const isShipFlow = (flow: TFlow) => SHIP_FLOWS.includes(flow);

const expectBoard = async (marks: IBoardMarks) => {
    await expect.poll(() => helper.boardMarks()).toEqual(marks);
};

// Only an attack paints its offered tiles red and puts a target icon on each
const marksOf = (flow: TFlow, offered: string[]): IBoardMarks => {
    const attackMarks = flow === "attack" ? offered : [];
    return { highlighted: offered, targeted: attackMarks, tinted: attackMarks };
};

const openFlow = async (flow: TFlow) => {
    if (flow === "move" || flow === "attack") {
        await helper.selectShip(ALICE_FRONT);
        await (flow === "move" ? helper.moveButton : helper.attackButton).click();
    } else {
        await helper.supportCard(flow).click();
    }
    await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);

    return await helper.highlightedTiles();
};

const expectNothingStaged = async () => {
    await expectBoard(IDLE_BOARD);
    expect(await helper.selectedCards()).toEqual([]);
    expect(await helper.pendingActionCount()).toBe(0);
};

test.describe("SelectShipClickHandler", () => {
    test("a click elsewhere closes the menu and the ship can be picked again", async () => {
        await helper.selectShip(ALICE_FRONT);
        await expect(helper.moveButton).toBeVisible();

        await helper.dismissSelection();
        await expect(helper.moveButton).toBeHidden();
        await expect(helper.attackButton).toBeHidden();

        await helper.selectShip(ALICE_FRONT);
        await expect(helper.moveButton).toBeVisible();
    });
});

test.describe("ShowShipDetailsClickHandler", () => {
    test("opens the ship's details from its menu and closes on a click outside the panel", async ({ page }) => {
        const flagship = await helper.ownFlagship();
        const panel = page.locator("#details-panel");

        await helper.selectShip(ALICE_FRONT);
        await page.locator("#select-action-tooltip").click();
        await expect(panel).toBeInViewport();
        await expect(panel).toContainText(flagship.name);

        await panel.getByText(flagship.name, { exact: true }).click();
        await expect(panel).toBeInViewport();

        await helper.dismissSelection();
        await expect(panel).not.toBeInViewport();
    });

    test("opens a card's details from its info cell without selecting the card", async ({ page }) => {
        await helper.stackHand(["flare"]);
        const panel = page.locator("#details-panel");

        await page.locator(`.card-row:has(img[alt="flare"]) > div:last-child`).first().click();
        await expect(panel).toBeInViewport();
        await expect(panel).toContainText("Flare");
        expect(await helper.highlightedTiles()).toEqual([]);

        await panel.getByRole("button", { name: "Close details" }).click();
        await expect(panel).not.toBeInViewport();
    });
});

test.describe("MoveShipClickHandler + SelectRouteClickHandler", () => {
    const pickDestination = async () => {
        await helper.selectShip(ALICE_FRONT);
        await helper.moveButton.click();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
        const offered = await helper.highlightedTiles();
        await helper.clickTile(offered[0]);
        await expect(helper.pathMenu).toBeVisible();

        return offered;
    };

    test("draws the route and stages the move on confirm", async ({ page }) => {
        await pickDestination();
        expect(await helper.drawnRoute()).not.toBeNull();

        await page.locator("#path-menu-confirm").click();

        await expect(helper.pathMenu).toBeHidden();
        await expect.poll(() => helper.drawnRoute()).toBeNull();
        await expect.poll(() => helper.pendingActionCount()).toBe(1);
    });

    test("Back returns to the destination picker with the same tiles offered", async ({ page }) => {
        const offered = await pickDestination();

        await page.locator("#path-menu-back").click();

        await expect(helper.pathMenu).toBeHidden();
        expect(await helper.drawnRoute()).toBeNull();
        await expect.poll(() => helper.highlightedTiles()).toEqual(offered);
        expect(await helper.pendingActionCount()).toBe(0);
    });

    test("a click outside the route menu drops the move", async () => {
        await pickDestination();

        await helper.dismissSelection();

        await expect(helper.pathMenu).toBeHidden();
        expect(await helper.drawnRoute()).toBeNull();
        await expectNothingStaged();
    });
});

test.describe("ShipAttackClickHandler", () => {
    test("marks every offered tile, and only those, with a red target", async () => {
        const offered = await openFlow("attack");

        await expectBoard(marksOf("attack", offered));
    });

    test("a click off the board clears every target", async () => {
        await openFlow("attack");

        await helper.dismissSelection();

        await expectNothingStaged();
    });

    test("a click on the attacking ship keeps the targets offered", async () => {
        const offered = await openFlow("attack");

        await helper.clickTile(ALICE_FRONT);

        await expectBoard(marksOf("attack", offered));
        expect(await helper.pendingActionCount()).toBe(0);
    });

    test("re-opening the attack marks every offered tile again", async () => {
        const offered = await openFlow("attack");
        await helper.dismissSelection();
        await expectBoard(IDLE_BOARD);

        expect(await openFlow("attack")).toEqual(offered);
        await expectBoard(marksOf("attack", offered));
    });

    // Tiles the attack left unoffered used to keep its "add target" hook and fire it once Move offered them
    test("Move after a dismissed attack offers plain tiles with no leftover targets", async () => {
        const offered = await openFlow("move");
        await helper.dismissSelection();
        await openFlow("attack");
        await helper.dismissSelection();
        await expectBoard(IDLE_BOARD);

        await openFlow("move");

        await expectBoard(marksOf("move", offered));
    });

    test("stages the attack on an offered tile, clears the targets and leaves Move unmarked", async () => {
        const moveOffered = await openFlow("move");
        await helper.dismissSelection();
        await helper.recordAnimations();

        const [target] = await openFlow("attack");
        await helper.clickTile(target);

        await expect.poll(() => helper.pendingActionCount()).toBe(1);
        await expectBoard(IDLE_BOARD);
        await helper.waitForAnimationsToSettle();

        await openFlow("move");
        await expectBoard(marksOf("move", moveOffered));
    });
});

// Every interaction must look the same however the previous one ended. A ship's menu can't
// be opened mid-interaction, so ship flows are reached via a click off the board; support
// cards take over straight from the hand.
test.describe("switching between interactions", () => {
    const offered = {} as Record<TFlow, string[]>;

    test.beforeEach(async () => {
        await helper.stackHand(["flare", "airstrike", "inspire"]);

        for (const flow of FLOWS) {
            offered[flow] = await openFlow(flow);
            await helper.dismissSelection();
            await expectNothingStaged();
        }
    });

    for (const first of FLOWS) {
        test(`after ${first}, each interaction marks only its own tiles`, async () => {
            for (const next of FLOWS) {
                await openFlow(first);
                await expectBoard(marksOf(first, offered[first]));

                if (isShipFlow(next)) {
                    await helper.dismissSelection();
                    await expectNothingStaged();
                }

                await openFlow(next);
                await expectBoard(marksOf(next, offered[next]));
                expect(await helper.selectedCards(), `${first} → ${next}`).toEqual(isShipFlow(next) ? [] : [next]);

                await helper.dismissSelection();
                await expectNothingStaged();
            }
        });
    }
});

test.describe("SelectTargetClickHandler (Flare)", () => {
    test.beforeEach(async () => {
        await helper.stackHand(["flare"]);
    });

    test("stages the card on an offered tile and the server accepts it", async () => {
        await helper.supportCard("flare").click();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
        const [target] = await helper.highlightedTiles();

        await helper.clickTile(target);

        await expect.poll(() => helper.pendingActionCount()).toBe(1);
        await expect.poll(() => helper.highlightedTiles()).toEqual([]);

        await helper.submitTurn();
        await expect(helper.turnButton).toHaveText("Awaiting other player");
    });

    test("a click off the board cancels targeting", async () => {
        await helper.supportCard("flare").click();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);

        await helper.dismissSelection();

        await expectNothingStaged();
    });
});

test.describe("SelectLineTargetClickHandler (Airstrike)", () => {
    test.beforeEach(async () => {
        await helper.stackHand(["airstrike"]);
    });

    const pickCenter = async () => {
        await helper.supportCard("airstrike").click();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
        const offered = await helper.highlightedTiles();
        // A middle tile keeps both the horizontal and the vertical line on the board
        const center = offered.find((tileId) => tileId === "2/3") ?? offered[0];
        await helper.clickTile(center);
        await expect(helper.pathMenu).toBeVisible();

        return offered;
    };

    test("cycles between the two orientations and stages the chosen one", async ({ page }) => {
        await pickCenter();
        const first = await helper.drawnRoute();
        expect(first).not.toBeNull();

        await page.locator("#path-menu-right").click();
        await expect.poll(() => helper.drawnRoute()).not.toBe(first);

        await page.locator("#path-menu-left").click();
        await expect.poll(() => helper.drawnRoute()).toBe(first);

        await page.locator("#path-menu-confirm").click();
        await expect(helper.pathMenu).toBeHidden();
        await expect.poll(() => helper.pendingActionCount()).toBe(1);
    });

    test("Back returns to the center picker", async ({ page }) => {
        const offered = await pickCenter();

        await page.locator("#path-menu-back").click();

        await expect(helper.pathMenu).toBeHidden();
        await expect.poll(() => helper.highlightedTiles()).toEqual(offered);
        expect(await helper.pendingActionCount()).toBe(0);
    });

    test("a click outside the orientation menu drops the airstrike", async () => {
        await pickCenter();

        await helper.dismissSelection();

        await expect(helper.pathMenu).toBeHidden();
        expect(await helper.drawnRoute()).toBeNull();
        await expectNothingStaged();
    });
});

test.describe("ConfirmEffectClickHandler (Inspire)", () => {
    test.beforeEach(async () => {
        await helper.stackHand(["inspire"]);
    });

    test("offers the whole board and stages the card on any board click", async ({ page }) => {
        await helper.supportCard("inspire").click();
        await expect
            .poll(async () => (await helper.highlightedTiles()).length)
            .toBe(await page.locator(".tile").count());

        await helper.clickTile("0/3");

        await expect.poll(() => helper.pendingActionCount()).toBe(1);
        await expect.poll(() => helper.highlightedTiles()).toEqual([]);
    });

    test("a click off the board cancels it", async () => {
        await helper.supportCard("inspire").click();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);

        await helper.dismissSelection();

        await expectNothingStaged();
    });
});
