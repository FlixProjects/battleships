import { EFFECT_REF_NO, SUPPORT_REF_NO, Faction, CardKind } from "../../config/constants";
import { GameStateBuilder } from "../../factories/game-state-builder";
import { HullBuilder } from "../../factories/hull-builder";
import { PlayerBuilder } from "../../factories/player-builder";
import { ShipBuilder } from "../../factories/ship-builder";
import { EffectAnchor, EffectKind, ICard, IDeck, IEffect, IPlayCardAction, IPlayer, isDamageEffect } from "../../types";
import { ActionTypes } from "../../types/action-types";
import { ActionResolver } from "../../utils/action-handler/ActionResolver";
import { createCard } from "../../utils/card-helper";
import { AirstrikeCard } from "../support-cards/AirstrikeCard";
import { AirstrikeEffect } from "../effects/AirstrikeEffect";

const buildPlayer1 = (overrides?: Partial<IPlayer>) => new PlayerBuilder({ id: "player1", name: "Player 1" }).build(overrides);
const buildPlayer2 = (overrides?: Partial<IPlayer>) =>
    new PlayerBuilder({ id: "player2", name: "Player 2", order: 1 }).build(overrides);

const shipBuilder = new ShipBuilder({ refNo: "frigate0", name: "Frigate", deployed: true });
const hullBuilder = new HullBuilder({ remainingHealth: 1, maxHealth: 1, armor: 0 });
const gameStateBuilder = new GameStateBuilder();

const AIRSTRIKE_TEMPLATE = {
    refNo: EFFECT_REF_NO.airstrike,
    kind: EffectKind.Damage,
    anchor: EffectAnchor.AnyTile,
    range: 1,
    damage: 1,
    duration: 1,
    existsOnBoard: true,
} as const;

const buildAirstrikeCardEntities = () => {
    const card: ICard = {
        id: "card-airstrike",
        deckId: "deck-1",
        instanceId: "card-airstrike",
        kind: CardKind.Support,
        refNo: SUPPORT_REF_NO.airstrike,
        name: "Airstrike",
        description: "Bombard a line.",
        commandPointCost: 1,
        effectTemplates: [AIRSTRIKE_TEMPLATE],
    };
    const deck: IDeck = {
        id: "deck-1",
        playerId: "player1",
        faction: Faction.THE_UNITED_DEFENSE_FLEET,
        cards: [],
        played: [],
    };
    return { card, deck };
};

const buildPlayAction = (payload: IPlayCardAction["payload"]): IPlayCardAction => ({
    id: "play-airstrike-1",
    type: ActionTypes.PLAY_CARD,
    playerId: "player1",
    round: 1,
    order: 0,
    commandPointCost: 1,
    cardId: "card-airstrike",
    payload,
});

const locKeys = (locs: (readonly number[])[]) => locs.map((l) => `${l[0]}/${l[1]}`).sort();

const effectLocations = (effects: IEffect[]) => effects.filter(isDamageEffect).map((e) => e.location);

describe("Airstrike — card hydration & effect creation", () => {
    it("hydrates the airstrike refNo into an AirstrikeCard", () => {
        const card = createCard({
            id: "c",
            deckId: "d",
            instanceId: "c",
            kind: CardKind.Support,
            refNo: SUPPORT_REF_NO.airstrike,
            name: "Airstrike",
            effectTemplates: [AIRSTRIKE_TEMPLATE],
        });
        expect(card).toBeInstanceOf(AirstrikeCard);
    });

    it("mints one damage Effect per tile of a horizontal line (center ± 1)", () => {
        const { card, deck } = buildAirstrikeCardEntities();
        const player1 = buildPlayer1({ hand: ["card-airstrike"], deck: "deck-1", commandPoints: 2, maxCommandPoints: 2 });
        const gameState = gameStateBuilder.build({ players: [player1, buildPlayer2()], cards: [card], decks: [deck] });

        const next = new ActionResolver("player1", gameState).resolveAction(
            buildPlayAction({ kind: "Support", targetCell: [2, 3], orientation: "horizontal" }),
        );

        expect(next.effects).toHaveLength(3);
        expect(locKeys(effectLocations(next.effects))).toEqual(locKeys([[1, 3], [2, 3], [3, 3]]));
        next.effects.forEach((e) => {
            expect(e.kind).toBe(EffectKind.Damage);
            expect(e.refNo).toBe(EFFECT_REF_NO.airstrike);
            expect(e.playerId).toBe("player1");
            expect(e.createdOnRound).toBe(1);
            expect(e.expiresAfterRound).toBe(2);
        });
        // CP spent, card moved hand → played
        expect(next.players.find((p) => p.id === "player1")?.commandPoints).toBe(1);
        expect(next.players.find((p) => p.id === "player1")?.hand).toEqual([]);
        expect(next.decks.find((d) => d.id === "deck-1")?.played.map((c) => c.id)).toEqual(["card-airstrike"]);
    });

    it("mints a vertical line when orientation is vertical", () => {
        const { card, deck } = buildAirstrikeCardEntities();
        const player1 = buildPlayer1({ hand: ["card-airstrike"], deck: "deck-1", commandPoints: 2, maxCommandPoints: 2 });
        const gameState = gameStateBuilder.build({ players: [player1, buildPlayer2()], cards: [card], decks: [deck] });

        const next = new ActionResolver("player1", gameState).resolveAction(
            buildPlayAction({ kind: "Support", targetCell: [2, 3], orientation: "vertical" }),
        );

        expect(locKeys(effectLocations(next.effects))).toEqual(locKeys([[2, 2], [2, 3], [2, 4]]));
    });

    it("clamps the line to the board — a center on the edge yields only on-board tiles", () => {
        const { card, deck } = buildAirstrikeCardEntities();
        const player1 = buildPlayer1({ hand: ["card-airstrike"], deck: "deck-1", commandPoints: 2, maxCommandPoints: 2 });
        const gameState = gameStateBuilder.build({ players: [player1, buildPlayer2()], cards: [card], decks: [deck] });

        const next = new ActionResolver("player1", gameState).resolveAction(
            buildPlayAction({ kind: "Support", targetCell: [0, 3], orientation: "horizontal" }),
        );

        // [-1,3] falls off the board and is dropped.
        expect(locKeys(effectLocations(next.effects))).toEqual(locKeys([[0, 3], [1, 3]]));
    });

    it("does not detonate on the turn it is played (no tick runs during the play action)", () => {
        const { card, deck } = buildAirstrikeCardEntities();
        const victimHull = hullBuilder.build({ id: "victim", shipId: "victimShip", location: [2, 3], front: true });
        const victimShip = shipBuilder.build({ id: "victimShip", playerId: "player2", hulls: [victimHull] });

        const player1 = buildPlayer1({ hand: ["card-airstrike"], deck: "deck-1", commandPoints: 2, maxCommandPoints: 2 });
        const player2 = buildPlayer2({ ships: [victimShip] });

        const gameState = gameStateBuilder.build({
            players: [player1, player2],
            ships: [victimShip],
            hulls: [victimHull],
            cards: [card],
            decks: [deck],
        });

        const next = new ActionResolver("player1", gameState).resolveAction(
            buildPlayAction({ kind: "Support", targetCell: [2, 3], orientation: "horizontal" }),
        );

        const hullAfter = next.hulls?.find((h) => h.id === "victim");
        expect(hullAfter?.remainingHealth).toBe(1);
        expect(hullAfter?.destroyed).toBe(false);
        expect(next.effects).toHaveLength(3);
    });
});

describe("Airstrike — delayed detonation on the persistent-effects tick", () => {
    const airstrikeEffectAt = (location: [number, number], playerId: string) => ({
        id: `airstrike-${location.join("-")}`,
        refNo: EFFECT_REF_NO.airstrike,
        kind: EffectKind.Damage,
        playerId,
        duration: 1,
        isActive: true,
        createdOnRound: 1,
        expiresAfterRound: 2,
        existsOnBoard: true,
        location,
        damage: 1,
    });

    it("deals 1 damage to a hull on a warning tile, then consumes the effect", () => {
        const victimHull = hullBuilder.build({ id: "victim", shipId: "victimShip", location: [2, 3], front: true });
        const victimShip = shipBuilder.build({ id: "victimShip", playerId: "player2", hulls: [victimHull] });

        const gameState = gameStateBuilder.build({
            currentRound: 2,
            players: [buildPlayer1(), buildPlayer2({ ships: [victimShip] })],
            ships: [victimShip],
            hulls: [victimHull],
            effects: [airstrikeEffectAt([2, 3], "player1")],
        });

        const resolver = new ActionResolver("player1", gameState);
        resolver["resolvePersistentEffectsTick"]();

        const hullAfter = resolver.gameState.hulls?.find((h) => h.id === "victim");
        expect(hullAfter?.remainingHealth).toBe(0);
        expect(hullAfter?.destroyed).toBe(true);
        // consumed → cannot fire twice
        expect(resolver.gameState.effects).toHaveLength(0);
    });

    it("hits the caster's own hull on a warning tile (ownership-agnostic)", () => {
        const ownHull = hullBuilder.build({ id: "own", shipId: "ownShip", location: [2, 3], front: true });
        const ownShip = shipBuilder.build({ id: "ownShip", playerId: "player1", hulls: [ownHull] });

        const gameState = gameStateBuilder.build({
            currentRound: 2,
            players: [buildPlayer1({ ships: [ownShip] }), buildPlayer2()],
            ships: [ownShip],
            hulls: [ownHull],
            effects: [airstrikeEffectAt([2, 3], "player1")],
        });

        const resolver = new ActionResolver("player1", gameState);
        resolver["resolvePersistentEffectsTick"]();

        expect(resolver.gameState.hulls?.find((h) => h.id === "own")?.destroyed).toBe(true);
    });

    it("leaves hulls that are not under a warning tile untouched", () => {
        const safeHull = hullBuilder.build({ id: "safe", shipId: "safeShip", location: [0, 0], front: true });
        const safeShip = shipBuilder.build({ id: "safeShip", playerId: "player2", hulls: [safeHull] });

        const gameState = gameStateBuilder.build({
            currentRound: 2,
            players: [buildPlayer1(), buildPlayer2({ ships: [safeShip] })],
            ships: [safeShip],
            hulls: [safeHull],
            effects: [airstrikeEffectAt([2, 3], "player1")],
        });

        const resolver = new ActionResolver("player1", gameState);
        resolver["resolvePersistentEffectsTick"]();

        expect(resolver.gameState.hulls?.find((h) => h.id === "safe")?.remainingHealth).toBe(1);
        expect(resolver.gameState.effects).toHaveLength(0);
    });

    it("destroying a flagship via the strike is detected by the winner check in resolve()", () => {
        const flagHull = hullBuilder.build({ id: "flag", shipId: "flagShip", location: [2, 3], front: true });
        const flagship = shipBuilder.build({ id: "flagShip", playerId: "player2", isFlagship: true, hulls: [flagHull] });

        const gameState = gameStateBuilder.build({
            currentRound: 2,
            players: [buildPlayer1(), buildPlayer2({ ships: [flagship] })],
            ships: [flagship],
            hulls: [flagHull],
            effects: [airstrikeEffectAt([2, 3], "player1")],
        });

        const { gameState: resolved } = new ActionResolver("player1", gameState).resolve();

        expect(resolved.ships.find((s) => s.id === "flagShip")?.destroyed).toBe(true);
        expect(resolved.winners).toEqual(["player1"]);
        expect(resolved.isOver).toBe(true);
    });
});

describe("AirstrikeEffect.toPlain", () => {
    it("round-trips location, kind, and damage", () => {
        const effect = new AirstrikeEffect({
            id: "e1",
            refNo: EFFECT_REF_NO.airstrike,
            kind: EffectKind.Damage,
            playerId: "player1",
            duration: 1,
            isActive: true,
            createdOnRound: 1,
            expiresAfterRound: 2,
            existsOnBoard: true,
            location: [2, 3],
            damage: 1,
        });
        const plain = effect.toPlain();
        expect(plain.kind).toBe(EffectKind.Damage);
        expect(plain.location).toEqual([2, 3]);
        expect(plain.damage).toBe(1);
    });
});
