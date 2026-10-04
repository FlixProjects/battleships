import { Deck, RandomFn } from "@shared/models/Deck";
import {
    IBoardConfig,
    ICellLoc,
    IDeckTemplateEntry,
    IEffectOverride,
    IPlainCard,
    IPlainDeck,
    IPlainPlayer,
    TFaction,
    TMapRefNo,
    TPlayerRefNo,
    TShipRefNo,
    TSupportRefNo,
} from "@shared/types/types";

export interface IPlayerContextParams {
    player: IPlainPlayer;
}

export interface IDeckDomainContextParams {
    deckDomain: Deck;
}

export interface IDeckContextParams {
    deck: IPlainDeck;
}

export interface ICardContextParams {
    deckId: string;
}

export interface ILoadPlayerFactionParams extends IPlayerContextParams {
    faction: TFaction;
}

export interface ILoadFreshGameStateParams {
    code?: string;
}

export interface ILoadEmptyNewPlayerParams {
    name: string;
    id?: string;
    order?: number;
    playerConfigRefNo?: TPlayerRefNo;
}

export interface ILoadHandParams extends IPlayerContextParams, IDeckContextParams, IDeckDomainContextParams {
    playerConfigRefNo?: TPlayerRefNo;
    rngFn?: RandomFn;
}

export interface ILoadCardParams extends ICardContextParams {
    refNo: TShipRefNo | TSupportRefNo;
    cardEntry: IDeckTemplateEntry;
}

export interface ILoadShipCardParams extends ICardContextParams {
    refNo: TShipRefNo;
}

export interface ILoadSupportCardParams extends ICardContextParams {
    refNo: TSupportRefNo;
}

export interface ILoadEmptyDeckParams {
    player: IPlainPlayer;
    faction: TFaction;
}

export interface ILoadCardsParams extends IDeckDomainContextParams, IDeckContextParams, IPlayerContextParams {}

export interface ILoadCardsToDeckParams extends IDeckDomainContextParams, IDeckContextParams, IPlayerContextParams {
    cards: IPlainCard[];
}

export interface ILoadShipsParams extends IDeckDomainContextParams, IDeckContextParams, IPlayerContextParams {
    cards: IPlainCard[];
}

export interface ILoadShipParams extends IPlayerContextParams {
    card: IPlainCard;
}

export interface ILoadEffectTemplateParams {
    effectOverride: IEffectOverride;
}

export interface ILoadMapParams {
    mapRefNo?: TMapRefNo;
}

export interface ILoadCellNodeParams {
    boardConfig: IBoardConfig;
    location: ICellLoc;
}
