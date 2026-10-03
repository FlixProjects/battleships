import { DEFAULT_CONFIG, Faction, PLAYER_REF_NO } from "@shared/config/constants";
import { IGameConfig } from "@shared/types/config-types";
import { IFactionConfig, IPlainGameState, IPlainPlayer, TFaction, TPlayerRefNo } from "@shared/types/types";
import { mergician } from "mergician";
import { v7 as uuidv7 } from "uuid";
import { resolveEffectTemplate } from "../effect-helper";

interface ILoadPlayerFactionParams {
    playerId: string;
    faction: TFaction;
}

interface ILoadFreshGameStateParams {
    code?: string;
}

interface ILoadEmptyNewPlayerParams {
    name: string;
    id?: string;
    order?: number;
    playerConfigRefNo?: TPlayerRefNo;
}

interface ILoadShipParams {
    refNo: TShipRefNo;
    deckId: string;
}

interface ILoadSupportParams {
    refNo: TSupportRefNo;
    deckId: string;
}

// separate from GameStateBuild in /factories which is only for tests
export class GameStateBuilder {
    private gameState: IPlainGameState;
    private config: IGameConfig = DEFAULT_CONFIG;

    private currentPlayerId: string = "";

    constructor(existingGameState?: IPlainGameState) {
        if (existingGameState) {
            this.gameState = existingGameState;
        }
    }

    public loadCode(code: string) {
        this.gameState.code = code;
    }

    public loadMap() {}

    public loadPlayerFaction(_params: ILoadPlayerFactionParams, overrideFaction: Partial<IFactionConfig> = {}) {
        return this;
    }

    public loadEmptyNewPlayer(_params: ILoadEmptyNewPlayerParams) {
        const params = this.loadParams(
            {
                id: uuidv7(),
                name: "UnknownPlayer",
                order: 1,
                playerConfigRefNo: PLAYER_REF_NO.default,
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
        if (this.gameState.players.length < 2) {
            this.gameState.players.push(newPlayer);
        }
    public setCurrentPlayerId(playerId: string) {
        this.currentPlayerId = playerId;
        return this;
    }

    public build(override: Partial<IPlainGameState> = {}): IPlainGameState {
        return mergician(override, this.gameState) as IPlainGameState;
    }
    // TODO: do we need playerId?
    private loadShipCard({ refNo, deckId }: ILoadShipParams) {
        const shipTemplate = this.config.shipsConfig[refNo];
        this.gameState.cards.push({
            id: uuidv7(),
            deckId,
            instanceId: uuidv7(), // new implementation: we try to avoid pre-creation of ships
            kind: CardKind.Ship,
            refNo: shipTemplate.refNo,
            name: shipTemplate.name,
        });
    }

    private loadSupportCard({ refNo, deckId }: ILoadSupportParams) {
        const supportTemplate = this.config.supportsConfig[refNo];
        this.gameState.cards.push({
            id: uuidv7(),
            deckId,
            instanceId: uuidv7(),
            kind: CardKind.Support,
            refNo,
            name: supportTemplate.name,
            description: supportTemplate.description,
            commandPointCost: supportTemplate.commandPointCost,
            effectTemplates: supportTemplate.effectTemplates.map(resolveEffectTemplate),
            imgSrc: supportTemplate.imgSrc,
        });
    }

    private loadParams<T>(defaults: T, _param: Partial<T>): T {
        return { ...defaults, ..._param };
    }

    private loadFreshGameState(params: ILoadFreshGameStateParams) {
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
