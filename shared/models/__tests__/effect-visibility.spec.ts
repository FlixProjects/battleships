import { EFFECT_REF_NO } from "../../config/constants";
import { GameStateBuilder } from "../../factories/game-state-builder";
import { HullBuilder } from "../../factories/hull-builder";
import { PlayerBuilder } from "../../factories/player-builder";
import { ShipBuilder } from "../../factories/ship-builder";
import { EffectKind, ICellLoc, IEffect } from "../../types";
import { ActionResolver } from "../../utils/action-handler/ActionResolver";

const shipBuilder = new ShipBuilder({ refNo: "frigate0", name: "Frigate", deployed: true });
const hullBuilder = new HullBuilder({ visionRange: 1 });

const armorPiercingOn = (shipId: string): IEffect & { attachedEntityId: string } => ({
    id: `ap-${shipId}`,
    refNo: EFFECT_REF_NO.armorPiercingRounds,
    kind: EffectKind.AttackBuff,
    playerId: "player1",
    isActive: true,
    createdOnRound: 1,
    existsOnBoard: false,
    attachedEntityId: shipId,
});

const airstrikeAt = (location: ICellLoc): IEffect & { location: ICellLoc; damage: number } => ({
    id: "airstrike",
    refNo: EFFECT_REF_NO.airstrike,
    kind: EffectKind.Damage,
    playerId: "player1",
    duration: 1,
    isActive: true,
    createdOnRound: 1,
    expiresAfterRound: 2,
    existsOnBoard: true,
    location,
    damage: 1,
});

// player2's only ship watches from [2,6] with vision 1
const effectsSentToPlayer2 = (opts: { player1ShipAt: ICellLoc; effects: IEffect[] }) => {
    const buffedHull = hullBuilder.build({ id: "buffedHull", shipId: "buffed", location: opts.player1ShipAt });
    const buffed = shipBuilder.build({ id: "buffed", playerId: "player1", hulls: [buffedHull] });
    const watcherHull = hullBuilder.build({ id: "watcherHull", shipId: "watcher", location: [2, 6] });
    const watcher = shipBuilder.build({ id: "watcher", playerId: "player2", hulls: [watcherHull] });

    const gameState = new GameStateBuilder().build({
        players: [
            new PlayerBuilder({ id: "player1", name: "P1" }).build({ ships: [buffed] }),
            new PlayerBuilder({ id: "player2", name: "P2", order: 1 }).build({ ships: [watcher] }),
        ],
        ships: [buffed, watcher],
        hulls: [buffedHull, watcherHull],
        effects: opts.effects,
    });

    const { obscuredGameState } = new ActionResolver("player2", gameState).resolveVisibility();
    return obscuredGameState.effects.map((e) => e.id);
};

describe("which of the opponent's effects a player is sent", () => {
    it("sends an effect on a ship the player can see", () => {
        expect(effectsSentToPlayer2({ player1ShipAt: [2, 5], effects: [armorPiercingOn("buffed")] })).toEqual([
            "ap-buffed",
        ]);
    });

    it("withholds an effect on a ship the player cannot see", () => {
        expect(effectsSentToPlayer2({ player1ShipAt: [2, 0], effects: [armorPiercingOn("buffed")] })).toEqual([]);
    });

    it("sends an effect placed on a tile the player can see", () => {
        expect(effectsSentToPlayer2({ player1ShipAt: [2, 0], effects: [airstrikeAt([2, 5])] })).toEqual(["airstrike"]);
    });

    it("withholds an effect placed on a tile the player cannot see", () => {
        expect(effectsSentToPlayer2({ player1ShipAt: [2, 0], effects: [airstrikeAt([2, 2])] })).toEqual([]);
    });
});
