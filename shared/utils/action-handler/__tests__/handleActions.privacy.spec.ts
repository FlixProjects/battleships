import { handleActions } from "..";
import { CardKind, EFFECT_REF_NO, Faction } from "../../../config/constants";
import { GameStateBuilder } from "../../../factories/game-state-builder";
import { HullBuilder } from "../../../factories/hull-builder";
import { PlayerBuilder } from "../../../factories/player-builder";
import { ShipBuilder } from "../../../factories/ship-builder";
import { Action } from "../../../models/actions/Action";
import { ActionTypes, EffectKind, ICard, IDeck, IShipAttackAction, IVisionEffect } from "../../../types";
import { ActionResolver } from "../ActionResolver";

const gameStateBuilder = new GameStateBuilder();

const makeCard = (id: string, deckId: string): ICard => ({
    id,
    deckId,
    instanceId: `${id}-instance`,
    kind: CardKind.Ship,
    refNo: "frigate0",
    name: id,
});

const makeDeck = (id: string, playerId: string, cards: ICard[], played: ICard[]): IDeck => ({
    id,
    playerId,
    faction: Faction.THE_UNITED_DEFENSE_FLEET,
    cards,
    played,
});

const makeAttack = (id: string, playerId: string): IShipAttackAction => ({
    id,
    type: ActionTypes.ATTACK,
    playerId,
    round: 1,
    order: 0,
    commandPointCost: 1,
    shipId: `${playerId}-ship`,
    attackLocations: [[2, 3]],
});

const flareBy = (playerId: string, sourceCardId: string, location: [number, number]): IVisionEffect => ({
    id: `flare-${sourceCardId}`,
    refNo: EFFECT_REF_NO.flare,
    kind: EffectKind.Vision,
    playerId,
    sourceCardId,
    duration: 2,
    isActive: true,
    createdOnRound: 1,
    expiresAfterRound: 3,
    existsOnBoard: true,
    location,
    range: 1,
});

const buildState = () => {
    const p1Cards = ["p1-hand", "p1-draw", "p1-played", "p1-flare"].map((id) => makeCard(id, "deck-1"));
    const p2Cards = ["p2-hand", "p2-draw"].map((id) => makeCard(id, "deck-2"));
    const [p1Hand, p1Draw, p1Played, p1Flare] = p1Cards;
    const [, p2Draw] = p2Cards;
    // player2's spotter sits beside player1's flare, so the flare is in view
    const spotterHull = new HullBuilder().build({
        id: "spotterHull",
        shipId: "spotter",
        location: [2, 4],
        front: true,
    });
    const spotter = new ShipBuilder({ refNo: "frigate0", name: "Frigate", deployed: true }).build({
        id: "spotter",
        playerId: "player2",
        hulls: [spotterHull],
    });

    return gameStateBuilder.build({
        players: [
            new PlayerBuilder({ id: "player1", name: "P1", hand: [p1Hand.id], deck: "deck-1" }).build(),
            new PlayerBuilder({ id: "player2", name: "P2", order: 1, hand: ["p2-hand"], deck: "deck-2" }).build({
                ships: [spotter],
            }),
        ],
        ships: [spotter],
        hulls: [spotterHull],
        cards: [...p1Cards, ...p2Cards],
        decks: [
            makeDeck("deck-1", "player1", [p1Draw], [p1Played, p1Flare]),
            makeDeck("deck-2", "player2", [p2Draw], []),
        ],
        actions: [makeAttack("p1-past-action", "player1"), makeAttack("p2-past-action", "player2")],
        effects: [flareBy("player1", p1Flare.id, [2, 3])],
    });
};

const viewFor = (playerId: string, gameState: ReturnType<typeof buildState>) =>
    new ActionResolver(playerId, gameState).resolveVisibility().obscuredGameState.toPlain();

describe("handleActions — what the second player is sent about the first submitter", () => {
    const submitAsPlayer1 = () =>
        handleActions("player1", buildState(), [Action.toDomain(makeAttack("p1-order", "player1"))]);

    it("keeps the first submitter's orders on the authoritative state", () => {
        const { newGameState } = submitAsPlayer1();

        expect(newGameState.players[0].pendingActions.map((a) => a.id)).toEqual(["p1-order"]);
        expect(newGameState.actions?.map((a) => a.id)).toContain("p1-order");
    });

    it("does not send the first submitter's orders to the second player", () => {
        const { newGameState } = submitAsPlayer1();

        const player2View = viewFor("player2", newGameState as ReturnType<typeof buildState>);
        const player1 = player2View.players.find((p) => p.id === "player1");

        expect(player1?.pendingActions).toEqual([]);
        expect((player2View.actions ?? []).filter((a) => a.playerId === "player1")).toEqual([]);
        expect(player1?.ready).toBe(true);
    });

    it("does not send the first submitter's hand or draw pile to the second player", () => {
        const { newGameState } = submitAsPlayer1();

        const player2View = viewFor("player2", newGameState as ReturnType<typeof buildState>);
        const player1 = player2View.players.find((p) => p.id === "player1");
        const player1Deck = player2View.decks.find((d) => d.playerId === "player1");
        const sentCardIds = player2View.cards.map((c) => c.id);

        expect(player1?.hand).toEqual([]);
        expect(player1Deck?.cards).toEqual([]);
        expect(sentCardIds).not.toEqual(expect.arrayContaining(["p1-hand"]));
        expect(sentCardIds).not.toContain("p1-draw");
    });

    it("does not send the cards the first submitter has played, even behind an effect in view", () => {
        const { newGameState } = submitAsPlayer1();

        const player2View = viewFor("player2", newGameState as ReturnType<typeof buildState>);
        const player1Deck = player2View.decks.find((d) => d.playerId === "player1");

        expect(player2View.effects.map((e) => e.id)).toEqual(["flare-p1-flare"]);
        expect(player1Deck?.played).toEqual([]);
        expect(player2View.cards.map((c) => c.id)).toEqual(["p2-hand", "p2-draw"]);
    });

    it("leaves the viewer's own hand, deck and orders intact", () => {
        const { newGameState, obscuredGameState } = submitAsPlayer1();

        const player1View = obscuredGameState?.toPlain();
        const player1 = player1View?.players.find((p) => p.id === "player1");
        const player1Deck = player1View?.decks.find((d) => d.playerId === "player1");

        expect(player1?.hand).toEqual(["p1-hand"]);
        expect(player1?.pendingActions).toEqual(["p1-order"]);
        expect(player1Deck?.cards).toEqual(["p1-draw"]);
        expect(player1Deck?.played).toEqual(["p1-played", "p1-flare"]);
        expect(player1View?.actions?.map((a) => a.id)).toEqual(["p1-past-action", "p1-order"]);

        const player2View = viewFor("player2", newGameState as ReturnType<typeof buildState>);
        expect(player2View.players.find((p) => p.id === "player2")?.hand).toEqual(["p2-hand"]);
        expect(player2View.decks.find((d) => d.playerId === "player2")?.cards).toEqual(["p2-draw"]);
        expect(player2View.actions?.map((a) => a.id)).toEqual(["p2-past-action"]);
    });

    it("does not mutate the authoritative state when obscuring", () => {
        const { newGameState } = submitAsPlayer1();
        viewFor("player2", newGameState as ReturnType<typeof buildState>);

        expect(newGameState.players[0].hand).toEqual(["p1-hand"]);
        expect(newGameState.cards).toHaveLength(6);
        expect(newGameState.decks[0].cards.map((c) => c.id)).toEqual(["p1-draw"]);
    });
});
