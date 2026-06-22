import { CardKind } from "../../config/constants";
import { GameStateBuilder } from "../../factories/game-state-builder";
import { HullBuilder } from "../../factories/hull-builder";
import { PlayerBuilder } from "../../factories/player-builder";
import { ShipBuilder } from "../../factories/ship-builder";
import { EffectAnchor, ICellLoc, IHullTemplate } from "../../types";
import { locationToKey } from "../../utils/helpers";
import { GameEngine as GameEngineV2 } from "../GameEngineV2";
import { GameStateManager } from "../GameStateManager";
import { SupportCard } from "../SupportCard";
import { GetValidAttackCellsSignal } from "../signals/GetValidAttackCellsSignal";
import { GetValidDeployCellsSignal } from "../signals/GetValidDeployCellsSignal";
import { GetValidMoveCellsSignal } from "../signals/GetValidMoveCellsSignal";
import { GetValidMoveRoutesSignal } from "../signals/GetValidMoveRoutesSignal";
import { GetValidSupportCellsSignal } from "../signals/GetValidSupportCellsSignal";

// Expected cell sets were frozen from the legacy GameEngine.prime.* output at
// migration time (proven equal), so they double as a regression guard now that
// the read path lives on Ship/SupportCard via the query signal cascade.
const frigateTemplate: IHullTemplate = {
    templateLocation: [0, 0],
    maxHealth: 1,
    armor: 0,
    visionRange: 2,
    orientation: 0,
    front: true,
};

const sortKeys = (cells: ICellLoc[]) => [...cells].map(locationToKey).sort();

const buildMoverState = () => {
    const movingHull = new HullBuilder({ visionRange: 2, remainingHealth: 1, maxHealth: 1 }).build({
        id: "hullM",
        shipId: "shipM",
        location: [0, 1],
        front: true,
    });
    const movingShip = new ShipBuilder({ refNo: "frigate0", deployed: true }).build({
        id: "shipM",
        playerId: "player1",
        hulls: [movingHull],
    });
    const player1 = new PlayerBuilder({ id: "player1", name: "P1" }).build({ ships: [movingShip] });
    const player2 = new PlayerBuilder({ id: "player2", name: "P2", order: 1 }).build({ ships: [] });

    return new GameStateBuilder().build({ players: [player1, player2], ships: [movingShip], hulls: [movingHull] });
};

describe("GameEngineV2 query path", () => {
    it("GetValidMoveCells returns the reachable cells (range 3 from [0,1])", () => {
        const result = new GameEngineV2(buildMoverState(), GameStateManager).query(
            new GetValidMoveCellsSignal({ targetId: "shipM", payload: { shipId: "shipM", playerId: "player1" } }),
        );

        expect(result?.origin).toEqual([0, 1]);
        expect(sortKeys(result?.validCells ?? [])).toEqual([
            "0/0",
            "0/2",
            "0/3",
            "0/4",
            "1/0",
            "1/1",
            "1/2",
            "1/3",
            "2/0",
            "2/1",
            "3/1",
        ]);
    });

    it("GetValidMoveRoutes returns the path to the destination tile", () => {
        const result = new GameEngineV2(buildMoverState(), GameStateManager).query(
            new GetValidMoveRoutesSignal({
                targetId: "shipM",
                payload: { shipId: "shipM", playerId: "player1", destinationTileId: locationToKey([2, 1]) },
            }),
        );

        expect(result?.routes).toEqual([
            [
                [0, 1],
                [1, 1],
                [2, 1],
            ],
        ]);
    });

    it("GetValidAttackCells returns in-range cells excluding the firing ship's own tile", () => {
        const result = new GameEngineV2(buildMoverState(), GameStateManager).query(
            new GetValidAttackCellsSignal({ targetId: "shipM", payload: { shipId: "shipM", playerId: "player1" } }),
        );

        expect(result?.origin).toEqual([0, 1]);
        expect(sortKeys(result?.validCells ?? [])).toEqual(["0/0", "0/2", "1/1"]);
    });

    it("GetValidDeployCells returns the player's deployment row", () => {
        const undeployedShip = new ShipBuilder({ refNo: "frigate0", deployed: false }).build({
            id: "shipD",
            playerId: "player1",
            hulls: [],
            hullTemplates: [frigateTemplate],
        });
        const player1 = new PlayerBuilder({ id: "player1", name: "P1" }).build({ ships: [undeployedShip] });
        const player2 = new PlayerBuilder({ id: "player2", name: "P2", order: 1 }).build({ ships: [] });
        const gameState = new GameStateBuilder().build({ players: [player1, player2], ships: [undeployedShip], hulls: [] });

        const result = new GameEngineV2(gameState, GameStateManager).query(
            new GetValidDeployCellsSignal({ targetId: "shipD", payload: { shipId: "shipD", playerId: "player1" } }),
        );

        expect(sortKeys(result?.validCells ?? [])).toEqual(["0/0", "1/0", "2/0", "3/0", "4/0"]);
    });

    it("GetValidSupportCells returns the anchored cells and flags that a target is required", () => {
        const supportCard = new SupportCard({
            id: "card-flare",
            deckId: "deck-1",
            instanceId: "eff-1",
            kind: CardKind.Support,
            refNo: "flare",
            name: "Flare",
            description: "Reveal a target area.",
            commandPointCost: 1,
            effects: [
                {
                    refNo: "flare_persistent",
                    kind: "vision",
                    anchor: EffectAnchor.DeploymentRow,
                    range: 1,
                    duration: 2,
                    existsOnBoard: true,
                },
            ],
        });
        const player1 = new PlayerBuilder({ id: "player1", name: "P1" }).build({ ships: [] });
        const player2 = new PlayerBuilder({ id: "player2", name: "P2", order: 1 }).build({ ships: [] });
        const gameState = new GameStateBuilder().build({ players: [player1, player2], cards: [supportCard] });

        const result = new GameEngineV2(gameState, GameStateManager).query(
            new GetValidSupportCellsSignal({
                targetId: "card-flare",
                payload: { cardId: "card-flare", playerId: "player1", effectIndex: 0 },
            }),
        );

        expect(result?.requiresTarget).toBe(true);
        expect(sortKeys(result?.validCells ?? [])).toEqual([
            "0/0",
            "0/1",
            "1/0",
            "1/1",
            "2/0",
            "2/1",
            "3/0",
            "3/1",
            "4/0",
            "4/1",
        ]);
    });

    it("is read-only — gameState is structurally unchanged after a query", () => {
        const gameState = buildMoverState();
        const before = JSON.stringify(gameState.toPlain());

        new GameEngineV2(gameState, GameStateManager).query(
            new GetValidMoveCellsSignal({ targetId: "shipM", payload: { shipId: "shipM", playerId: "player1" } }),
        );

        expect(JSON.stringify(gameState.toPlain())).toEqual(before);
    });
});
