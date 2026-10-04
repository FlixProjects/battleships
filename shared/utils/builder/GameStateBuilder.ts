import {
    CardKind,
    CELL_NODE_REF_NO,
    DEFAULT_CONFIG,
    Faction,
    MAP_REF_NO,
    PLAYER_REF_NO,
    SHIP_REF_NO,
} from "@shared/config/constants";
import { Deck, RandomFn } from "@shared/models/Deck";
import { IGameConfig } from "@shared/types/config-types";
import {
    IBoard,
    ICellNode,
    IEffectTemplate,
    IPlainCard,
    IPlainGameState,
    IPlainPlayer,
    IPlainShip,
    TEffectRefNo,
    TFaction,
    TPlayerRefNo,
    TShipRefNo,
} from "@shared/types/types";
import { mergician } from "mergician";
import { v7 as uuidv7 } from "uuid";
import { locationToKey } from "../helpers";
import { ShipCard } from "@shared/models";
import {
    ILoadPlayerFactionParams,
    ILoadFreshGameStateParams,
    ILoadEmptyNewPlayerParams,
    ILoadHandParams,
    ILoadCardParams,
    ILoadShipCardParams,
    ILoadSupportCardParams,
    ILoadEmptyDeckParams,
    ILoadCardsParams,
    ILoadCardsToDeckParams,
    ILoadShipsParams,
    ILoadShipParams,
    ILoadEffectTemplateParams,
    ILoadMapParams,
    ILoadCellNodeParams,
} from "./types";

// separate from GameStateBuild in /factories which is only for tests
export class GameStateBuilder {
    private gameState: IPlainGameState;
    private config: IGameConfig = DEFAULT_CONFIG;

    private playerConfigRefNo: TPlayerRefNo = PLAYER_REF_NO.default;
    private currentPlayer: IPlainPlayer;

    constructor(existingGameState?: IPlainGameState) {
        if (existingGameState) {
            this.gameState = existingGameState;
            return;
        }
        this.loadFreshGameState();
    }

    public loadCode(code: string) {
        this.gameState.code = code;
        return this;
    }

    public overrideConfig(config: Partial<IGameConfig>) {
        this.config = mergician(this.config, config) as IGameConfig;
        return this;
    }

    public loadMap(_params: ILoadMapParams = {}) {
        const { mapRefNo } = this.loadParams({ mapRefNo: MAP_REF_NO.default }, _params);
        const boardConfig = this.config.boardConfig[mapRefNo];
        const board: IBoard = {};

        for (let col = 0; col < boardConfig.columns; col++) {
            for (let row = 0; row < boardConfig.rows; row++) {
                const cellNode = this.loadCellNode({ boardConfig, location: [col, row] });
                board[locationToKey(cellNode.location)] = cellNode;
            }
        }
        this.gameState.board = board;

        return this;
    }

    public loadPlayerFaction(_params: ILoadPlayerFactionParams) {
        _params.player.faction = _params.faction;
        return {
            loadDeck: () => this.loadEmptyDeck({ ..._params, faction: _params.player.faction }),
        };
    }

    public loadEmptyNewPlayer(_params: ILoadEmptyNewPlayerParams) {
        const params = this.loadParams(
            {
                id: uuidv7(),
                name: "UnknownPlayer",
                order: 1,
                playerConfigRefNo: this.playerConfigRefNo,
            },
            _params,
        );
        const { playerConfigRefNo, ...playerParams } = params;
        const newPlayer: IPlainPlayer = {
            ready: false,
            ships: [],
            pendingActions: [],
            faction: Faction.THE_UNITED_DEFENSE_FLEET, // temp default faction
            hand: [],
            deck: "",
            ...playerParams,
            ...this.config.playersConfig[playerConfigRefNo],
        };
        this.playerConfigRefNo = playerConfigRefNo;
        if (this.gameState.players.length < 2) {
            this.gameState.players.push(newPlayer);
        }

        return {
            loadFaction: (faction: TFaction) => this.loadPlayerFaction({ player: newPlayer, faction }),
        };
    }

    public setCurrentPlayer(playerId: string) {
        const player = this.gameState.players.find((p) => p.id === playerId);
        if (!player) throw new Error(`Player with id ${playerId} not found in game state`);
        this.currentPlayer = player;
        return this;
    }

    public build(override: Partial<IPlainGameState> = {}): IPlainGameState {
        return mergician(this.gameState, override) as IPlainGameState;
    }

    private loadEmptyDeck(params: ILoadEmptyDeckParams) {
        const { faction, player } = params;
        const deckId = uuidv7();
        const deckDomain = Deck.create({
            id: deckId,
            playerId: player.id,
            faction,
            cards: [],
        });
        const deck = deckDomain.toPlain();

        this.gameState.decks.push(deck);
        player.deck = deckDomain.id;

        return {
            loadCards: () => this.loadCards({ deckDomain, deck, player }),
        };
    }

    private loadCards({ deckDomain, deck, player }: ILoadCardsParams) {
        const deckConfig = this.config.factionConfig[player.faction].deck;
        const cards: IPlainCard[] = deckConfig
            .flatMap((c) =>
                Array(c.count)
                    .fill(c)
                    .map(() => this.loadCard({ cardEntry: c, deckId: deck.id, refNo: c.refNo })),
            )
            .filter((c) => c !== undefined);
        this.gameState.cards.push(...cards);
        return this.loadCardsToDeck({ deckDomain, deck, cards, player });
    }

    private loadCardsToDeck({ deckDomain, deck, cards, player }: ILoadCardsToDeckParams) {
        deck.cards = cards.map((c) => c.id);
        deckDomain.loadPlainCards(cards);
        return {
            loadShips: () => this.loadShips({ deckDomain, deck, cards, player }),
        };
    }

    private loadShips({ deckDomain, deck, cards, player }: ILoadShipsParams) {
        const ships = cards.filter((c) => c.kind === CardKind.Ship).map((card) => this.loadShip({ card, player }));
        this.gameState.ships.push(...ships);
        player.ships = ships.map((s) => s.id);
        return {
            loadHand: (rngFn: RandomFn) => this.loadHand({ rngFn, deckDomain, deck, player }),
        };
    }

    private loadShip({ card, player }: ILoadShipParams): IPlainShip {
        const shipTemplate = this.config.shipsConfig[card.refNo as TShipRefNo];
        return {
            ...shipTemplate,
            id: card.instanceId,
            playerId: player.id,
            hulls: [],
            remainingMovement: shipTemplate.movementRange,
            remainingAttacks: shipTemplate.attackCountMax,
            destroyed: false,
        };
    }

    private loadHand({ deckDomain, deck, player, playerConfigRefNo, rngFn }: ILoadHandParams) {
        const { maxHandSize } = this.config.playersConfig[playerConfigRefNo ?? this.playerConfigRefNo];

        // FIXME: we hardcode the pinned card for now
        const flagshipCardId = deckDomain.cards
            .filter((c) => c.isShipCard())
            .find((c): c is ShipCard => c.refNo === SHIP_REF_NO.tudf_flagship0)?.id;

        deckDomain.shuffleOnce(flagshipCardId, rngFn ?? Math.random);
        const drawn = deckDomain.draw(maxHandSize);
        player.hand = drawn.map((c) => c.id);
        deck.cards = deckDomain.toPlain().cards.filter((c) => !player.hand.includes(c));
        return;
    }

    private loadCard({ cardEntry, deckId }: ILoadCardParams) {
        switch (cardEntry.kind) {
            case CardKind.Ship:
                return this.loadShipCard({ refNo: cardEntry.refNo, deckId });
            case CardKind.Support:
                return this.loadSupportCard({ refNo: cardEntry.refNo, deckId });
        }
    }

    // TODO: do we need playerId?
    private loadShipCard({ refNo, deckId }: ILoadShipCardParams) {
        const shipTemplate = this.config.shipsConfig[refNo];
        const card = {
            id: uuidv7(),
            deckId,
            instanceId: uuidv7(), // the id of the ship created for this card in loadShips
            kind: CardKind.Ship,
            refNo: shipTemplate.refNo,
            name: shipTemplate.name,
        };
        return card;
    }

    private loadSupportCard({ refNo, deckId }: ILoadSupportCardParams) {
        const supportTemplate = this.config.supportsConfig[refNo];
        const card = {
            id: uuidv7(),
            deckId,
            instanceId: uuidv7(),
            kind: CardKind.Support,
            refNo,
            name: supportTemplate.name,
            description: supportTemplate.description,
            commandPointCost: supportTemplate.commandPointCost,
            effectTemplates: supportTemplate.effectTemplates.map((effectOverride) =>
                this.loadEffectTemplate({ effectOverride }),
            ),
            imgSrc: supportTemplate.imgSrc,
        };
        return card;
    }

    private loadEffectTemplate({ effectOverride }: ILoadEffectTemplateParams): IEffectTemplate {
        const effectTemplate = this.config.effectsConfig[effectOverride.refNo as TEffectRefNo];
        if (!effectTemplate) throw new Error(`Effect template with refNo ${effectOverride.refNo} not found in config`);
        return { ...effectTemplate, ...effectOverride } as IEffectTemplate;
    }

    private loadCellNode({ boardConfig, location }: ILoadCellNodeParams): ICellNode {
        const cellNodeRefNo = boardConfig.nodes[locationToKey(location)]?.refNo ?? CELL_NODE_REF_NO.default;
        return {
            ...this.config.cellConfig[cellNodeRefNo],
            id: uuidv7(),
            location,
        };
    }

    private loadParams<T>(defaults: T, _param: Partial<T>): T {
        return { ...defaults, ..._param };
    }

    private loadFreshGameState(params: ILoadFreshGameStateParams = {}) {
        this.gameState = {
            code: "",
            currentRound: 0,
            players: [],
            ships: [],
            cards: [],
            effects: [],
            decks: [],
            board: {},
            initiative: "",
            winners: [],
            isOver: false,
            actions: [],
            ...params,
        };
        return this;
    }
}
