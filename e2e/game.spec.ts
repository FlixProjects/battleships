import { expect, type Page, test } from "@playwright/test";
import { deployedFlagships, type IPlainShip, PageHelper, stepsBetween, tileOf } from "./helpers/PageHelper";

// Rules live in the unit tests; these probe the seams between the frontend, the
// lambdas, sessionStorage and the rendered board. Ship stats are read from state
// rather than hard-coded, so they hold for any flagship.

const ALICE_FRONT = "2/1";
const ALICE_REAR = "2/0";
const BOB_FRONT = "2/5";
const BOB_REAR = "2/6";

test.describe.configure({ timeout: 240_000 });

let helper: PageHelper;

const startJoinedGame = async () => {
    const gameCode = await helper.createGame("Alice");
    await helper.handOverToNewPlayer();
    await helper.joinGame("Bob", gameCode);

    return gameCode;
};

const canAttack = (ship: IPlainShip, commandPoints: number) =>
    ship.remainingAttacks > 0 && ship.attackCommandPointCost <= commandPoints;

const canMove = (ship: IPlainShip, commandPoints: number) =>
    ship.remainingMovement > 0 && ship.movementCommandPointCost <= commandPoints;

const expectMenuToMatchShip = async () => {
    const [ship, commandPoints] = await Promise.all([helper.ownFlagship(), helper.ownCommandPoints()]);

    await helper.selectShip(await helper.ownFrontTile());
    await expect(helper.attackButton).toBeEnabled({ enabled: canAttack(ship, commandPoints) });
    await expect(helper.moveButton).toBeEnabled({ enabled: canMove(ship, commandPoints) });
    await helper.dismissSelection();
};

// Every live hull tile of the current player has one of its ship's sprites drawn over it
const expectSpritesOverOwnHulls = async (page: Page) => {
    const view = await helper.readPlayerView();
    const ownShipIds = view.ships.filter((ship) => ship.playerId === view.playerId).map((ship) => ship.id);
    const hulls = view.hulls.filter((hull) => ownShipIds.includes(hull.shipId) && !hull.destroyed);
    expect(hulls.length).toBeGreaterThan(0);

    for (const hull of hulls) {
        const isCovered = await page.evaluate(
            ({ shipId, tileId }) => {
                const tile = document.getElementById(tileId)?.getBoundingClientRect();
                if (!tile) return false;

                const x = tile.left + tile.width / 2;
                const y = tile.top + tile.height / 2;
                return Array.from(document.querySelectorAll(`#gameBoardStaticLayer img[alt="${shipId}"]`)).some(
                    (sprite) => {
                        const rect = sprite.getBoundingClientRect();
                        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
                    },
                );
            },
            { shipId: hull.shipId, tileId: tileOf(hull) },
        );
        expect(isCovered, `a sprite covers ${tileOf(hull)}`).toBe(true);
    }
};

// Alice fires first, then Bob fires and resolves the round; leaves Bob current
const exchangeFire = async (aliceTarget: string, bobTarget: string) => {
    await helper.attack(ALICE_FRONT, aliceTarget);
    await helper.submitTurn();

    await helper.switchPlayer();
    await helper.attack(BOB_FRONT, bobTarget);
    await helper.submitTurn();
};

test.beforeEach(async ({ page }) => {
    helper = new PageHelper(page);
    await page.goto("/");
    await helper.guestLogin();
});

test.describe("joining", () => {
    test("a second player can join a created game", async ({ page }) => {
        const gameCode = await helper.createGame("Alice");
        expect(gameCode).toMatch(/^[A-Z0-9]{4}$/);

        await helper.handOverToNewPlayer();
        await helper.joinGame("Bob", gameCode);

        await expect(page.getByText("Alice", { exact: true }).first()).toBeVisible();
        await expect(page.getByText("Bob", { exact: true }).first()).toBeVisible();
    });

    test("an unknown game code is refused and the player stays in the lobby", async () => {
        await helper.createGame("Alice");
        await helper.handOverToNewPlayer();

        expect(await helper.attemptJoinGame("Bob", "ZZZZ")).toBe(404);
        await helper.expectScreen("Lobby");
    });

    test("the creator cannot join their own game", async () => {
        const gameCode = await helper.createGame("Alice");
        await helper.openMenuItem("Lobby");

        expect(await helper.attemptJoinGame("Alice again", gameCode)).toBe(409);
        await helper.expectScreen("Lobby");
    });

    test("a third player cannot join a full game", async () => {
        // Known gap: join-game never checks the player count
        test.fail();
        const gameCode = await startJoinedGame();
        await helper.handOverToNewPlayer();

        expect(await helper.attemptJoinGame("Carol", gameCode)).not.toBe(200);
        await helper.expectScreen("Lobby");
    });
});

test.describe("deploying", () => {
    test("the server places the flagship on the tile the board offered", async () => {
        await startJoinedGame();
        await expect(helper.turnButton).toBeDisabled();

        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
        const offered = await helper.highlightedTiles();
        const chosen = offered[offered.length - 1];
        await helper.deployFlagship(chosen);
        await helper.submitTurn();

        await helper.switchPlayer();
        await helper.deployFlagship(ALICE_REAR);
        await helper.submitTurn();
        await helper.switchPlayer();

        const view = await helper.readPlayerView();
        const flagshipId = await helper.ownFlagshipId();
        const tiles = view.hulls.filter((hull) => hull.shipId === flagshipId).map(tileOf);
        expect(tiles).toContain(chosen);
    });

    test("a click off the offered tiles drops the deploy until the flagship is picked again", async ({ page }) => {
        await startJoinedGame();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
        const offered = await helper.highlightedTiles();
        const notOffered = await page
            .locator(".tile")
            .evaluateAll((tiles, skip) => tiles.map((tile) => tile.id).find((id) => !skip.includes(id)), offered);

        await helper.clickTile(notOffered ?? "");
        await expect.poll(() => helper.highlightedTiles()).toEqual([]);
        await expect(helper.turnButton).toBeDisabled();

        await page.locator(`.card-row:has(img[alt="${await helper.ownFlagshipId()}"])`).click();
        await expect.poll(() => helper.highlightedTiles()).toEqual(offered);
    });

    test("other cards are held back until the flagship is deployed", async ({ page }) => {
        await startJoinedGame();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
        const offered = await helper.highlightedTiles();

        await page
            .locator(`.card-row:not(:has(img[alt="${await helper.ownFlagshipId()}"]))`)
            .first()
            .click();

        await expect(page.getByText("Deploy flagship first!")).toBeVisible();
        expect(await helper.highlightedTiles()).toEqual(offered);
    });
});

test.describe("submitting", () => {
    test("a submitted turn stays locked across a reload", async ({ page }) => {
        await startJoinedGame();
        await helper.deployFlagship(BOB_REAR);
        await helper.submitTurn();

        await expect(helper.turnButton).toHaveText("Awaiting other player");
        await expect(helper.turnButton).toBeDisabled();

        await page.reload();
        await helper.waitForReplay();
        await expect(helper.turnButton).toHaveText("Awaiting other player");
        await expect(helper.turnButton).toBeDisabled();
    });

    test("a double click submits once", async ({ page }) => {
        await helper.startGameWithFlagships();
        let submits = 0;
        page.on("request", (request) => {
            if (request.url().includes("/api/submit")) submits++;
        });

        await Promise.all([page.waitForResponse(/\/api\/submit/), helper.turnButton.dblclick()]);
        await helper.waitForReplay();
        await page.waitForTimeout(1000);

        expect(submits).toBe(1);
    });

    test("a failed submit keeps the orders so they can be sent again", async ({ page }) => {
        await helper.startGameWithFlagships();
        await helper.attack(ALICE_FRONT, BOB_REAR);
        await page.route(/\/api\/submit/, (route) => route.fulfill({ status: 500, body: "{}" }), { times: 1 });

        await helper.turnButton.click();

        await expect(page.locator("#status-value")).toHaveText("Error");
        await expect(helper.turnButton).toBeEnabled();
        expect(await helper.pendingActionCount()).toBe(1);

        await helper.submitTurn();
        await expect(helper.turnButton).toHaveText("Awaiting other player");
    });

    test("staged orders survive a reload", async ({ page }) => {
        await helper.startGameWithFlagships();
        await helper.attackFirstTarget(ALICE_FRONT);
        const staged = await helper.ownFlagship();

        await page.reload();
        await helper.waitForReplay();

        expect(await helper.pendingActionCount()).toBe(1);
        expect((await helper.ownFlagship()).remainingAttacks).toBe(staged.remainingAttacks);
    });
});

test.describe("gameplay loop", () => {
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
});

test.describe("the ship menu", () => {
    test("mirrors the ship's remaining actions, then the server's reset next round", async () => {
        await helper.startGameWithFlagships();
        await helper.recordAnimations();
        const fresh = await helper.ownFlagship();
        await expectMenuToMatchShip();

        await helper.attackFirstTarget(ALICE_FRONT);
        await helper.waitForAnimationsToSettle();
        expect((await helper.ownFlagship()).remainingAttacks).toBe(fresh.remainingAttacks - 1);
        await expectMenuToMatchShip();

        await helper.moveToFirstDestination(await helper.ownFrontTile());
        await helper.waitForAnimationsToSettle();
        expect((await helper.ownFlagship()).remainingMovement).toBeLessThan(fresh.remainingMovement);
        await expectMenuToMatchShip();

        await helper.submitTurn();
        await helper.switchPlayer();
        await helper.submitTurn();
        await helper.switchPlayer();

        const nextRound = await helper.ownFlagship();
        expect(nextRound.remainingAttacks).toBe(fresh.remainingAttacks);
        expect(nextRound.remainingMovement).toBe(fresh.remainingMovement);
        await expectMenuToMatchShip();
    });

    test("offers attack targets exactly within the ship's range", async () => {
        await helper.startGameWithFlagships();
        const ship = await helper.ownFlagship();
        const front = await helper.ownFrontTile();

        await helper.selectShip(front);
        await helper.attackButton.click();
        await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);

        for (const tileId of await helper.highlightedTiles()) {
            const steps = stepsBetween(front, tileId);
            expect(steps, tileId).toBeGreaterThanOrEqual(ship.attackMinRange ?? 1);
            expect(steps, tileId).toBeLessThanOrEqual(ship.attackRange);
        }
    });

    test("ignores a click on a tile it didn't offer", async ({ page }) => {
        await helper.startGameWithFlagships();
        const front = await helper.ownFrontTile();

        for (const openMode of [() => helper.attackButton.click(), () => helper.moveButton.click()]) {
            await helper.selectShip(front);
            await openMode();
            await expect.poll(async () => (await helper.highlightedTiles()).length).toBeGreaterThan(0);
            const offered = await helper.highlightedTiles();
            const notOffered = await page
                .locator(".tile")
                .evaluateAll(
                    (tiles, skip) => tiles.map((tile) => tile.id).find((id) => !skip.includes(id)),
                    [...offered, front],
                );

            await helper.clickTile(notOffered ?? "");

            await expect.poll(() => helper.highlightedTiles()).toEqual([]);
            await expect(page.locator("#path-menu-confirm")).toBeHidden();
            expect(await helper.pendingActionCount()).toBe(0);
        }
    });
});

test.describe("the board", () => {
    test("draws each ship over the tiles the server placed it on, across a reload", async ({ page }) => {
        await helper.startGameWithFlagships();
        await expectSpritesOverOwnHulls(page);

        await helper.moveToFirstDestination(ALICE_FRONT);
        await helper.submitTurn();
        await helper.switchPlayer();
        await helper.submitTurn();
        await helper.switchPlayer();

        await expectSpritesOverOwnHulls(page);
        await page.reload();
        await helper.waitForReplay();
        await expectSpritesOverOwnHulls(page);
    });

    test("re-watching or skipping the replay lands back on the same state", async ({ page }) => {
        await helper.startGameWithFlagships();
        await helper.attack(ALICE_FRONT, BOB_FRONT);
        await helper.submitTurn();
        await helper.switchPlayer();
        await helper.submitTurn();

        const readStates = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("fp-player-states") ?? "{}"));
        const settled = await readStates();
        const playback = page.getByRole("button", { name: "Playback" });

        await playback.click();
        await expect.poll(readStates).toEqual(settled);
        await expect(playback).toBeEnabled();

        await playback.click();
        await page.mouse.click(1, 1);
        await expect.poll(readStates).toEqual(settled);
        await expect(playback).toBeEnabled();
        await expectSpritesOverOwnHulls(page);
    });

    test.describe("at phone width", () => {
        test.use({ viewport: { width: 390, height: 844 } });

        // Scoped to the board: the local-only Switch Player control is wider than a phone
        test("the whole board fits without sideways scrolling", async ({ page }) => {
            await startJoinedGame();

            const gameArea = await page.locator("#gameArea").boundingBox();
            expect((gameArea?.x ?? 0) + (gameArea?.width ?? 0)).toBeLessThanOrEqual(390);
            for (const tile of await page.locator(".tile").all()) {
                const box = await tile.boundingBox();
                expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
                expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
            }
        });

        test("targeting slides the action panel out of the board's way", async () => {
            await startJoinedGame();

            // Joining pre-selects the flagship card, which starts targeting
            await expect(helper.turnButton).not.toBeInViewport();

            await helper.deployFlagship(BOB_REAR);
            await expect(helper.turnButton).toBeInViewport();
        });
    });
});

test.describe("fog of war", () => {
    // Bob sits 4 steps from Alice with vision 2, so he is hidden from her; leaves Bob current in round 2
    const switchToHiddenBob = async () => {
        await helper.startGameWithFlagships();
        await helper.switchPlayer();
        const view = await helper.readPlayerView();

        return {
            bobId: view.playerId,
            bobShipIds: view.ships.filter((ship) => ship.playerId === view.playerId).map((ship) => ship.id),
        };
    };

    test("a hidden opponent is neither sent nor drawn", async ({ page }) => {
        const { bobShipIds } = await switchToHiddenBob();
        await helper.submitTurn();
        const wire = await helper.switchPlayer();

        expect(wire.ships.filter((ship) => bobShipIds.includes(ship.id))).toEqual([]);
        expect((wire.hulls ?? []).filter((hull) => bobShipIds.includes(hull.shipId))).toEqual([]);
        for (const shipId of bobShipIds) {
            await expect(page.locator(`#gameBoardStaticLayer img[alt="${shipId}"]`)).toHaveCount(0);
        }
    });

    test("the opponent's orders stay private", async () => {
        // Known leak: obscureOtherPlayer never prunes actions, so submitted orders (and past deploys) are sent
        test.fail();
        const { bobId } = await switchToHiddenBob();
        await helper.attack(BOB_FRONT, ALICE_REAR);
        await helper.submitTurn();

        const wire = await helper.switchPlayer();

        expect((wire.actions ?? []).filter((action) => action.playerId === bobId)).toEqual([]);
    });

    test("the opponent's hand and draw pile stay private", async () => {
        // Known leak: obscureOtherPlayer never prunes cards, hands or decks
        test.fail();
        const { bobId } = await switchToHiddenBob();
        await helper.submitTurn();

        const wire = await helper.switchPlayer();
        const bob = wire.players.find((player) => player.id === bobId);
        const bobDeck = wire.decks.find((deck) => deck.playerId === bobId);
        const secretCardIds = [...(bob?.hand ?? []), ...(bobDeck?.cards ?? [])];

        expect(wire.cards.filter((card) => secretCardIds.includes(card.id))).toEqual([]);
    });
});

test.describe("game over", () => {
    test("reaches both players with the server's outcome and locks the controls", async ({ page }) => {
        // Enough rounds of mutual fire for one flagship to sink
        test.setTimeout(600_000);
        await helper.startGameWithFlagships();

        const volleys: [string, string][] = [
            [BOB_REAR, ALICE_REAR],
            [BOB_REAR, ALICE_REAR],
            [BOB_FRONT, ALICE_FRONT],
            [BOB_FRONT, ALICE_FRONT],
        ];
        for (const [round, [aliceTarget, bobTarget]] of volleys.entries()) {
            if (round > 0) await helper.switchPlayer();
            await exchangeFire(aliceTarget, bobTarget);
        }

        for (const viewer of ["Bob", "Alice"]) {
            if (viewer === "Alice") await helper.switchPlayer();
            const view = await helper.readPlayerView();
            expect(view.isOver, viewer).toBe(true);

            const outcome = view.winners.includes(view.playerId) ? "You won!" : "You lost!";
            await expect(page.getByText(outcome)).toBeVisible();
            await expect(helper.turnButton).toHaveText("Game Over");
            await expect(helper.turnButton).toBeDisabled();

            if (view.winners.includes(view.playerId)) {
                await helper.selectShip(await helper.ownFrontTile());
                await expect(helper.attackButton).toBeDisabled();
                await expect(helper.moveButton).toBeDisabled();
            }
        }
    });
});
