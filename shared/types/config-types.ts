import {
    IBoardConfig,
    ICellNodeConfig,
    IEffectTemplate,
    IFactionConfig,
    IHullTemplate,
    IPlayerConfig,
    IShipTemplate,
    TCellNodeRefNo,
    TEffectRefNo,
    TFaction,
    TMapRefNo,
    TPlayerRefNo,
    TShipRefNo,
    TSupportConfig,
    TSupportRefNo,
} from "./types";

export type THullsConfig = Record<TShipRefNo, IHullTemplate[]>;
export type TShipsConfig = Record<TShipRefNo, IShipTemplate>;
export type TEffectsConfig = Record<TEffectRefNo, IEffectTemplate>;
export type TSupportsConfig = Record<TSupportRefNo, TSupportConfig>;
export type TFactionsConfig = Record<TFaction, IFactionConfig>;
export type TBoardsConfig = Record<TMapRefNo, IBoardConfig>;
export type TCellsConfig = Record<TCellNodeRefNo, ICellNodeConfig>;
export type TPlayersConfig = Record<TPlayerRefNo, IPlayerConfig>;

export interface IGameConfig {
    hullsConfig: THullsConfig;
    shipsConfig: TShipsConfig;
    factionConfig: TFactionsConfig;
    supportsConfig: TSupportsConfig;
    effectsConfig: TEffectsConfig;
    boardConfig: TBoardsConfig;
    cellConfig: TCellsConfig;
    playersConfig: TPlayersConfig;
}
