import type { TCardRefNo } from "./constants";
import { CardKind, TCardKind } from "./types";

export const Faction = {
    THE_UNITED_FLEET: "THE_UNITED_FLEET",
} as const;

export type TFaction = (typeof Faction)[keyof typeof Faction];

export const MAX_HAND_SIZE = 4;

export interface IDeckTemplateEntry {
    kind: TCardKind;
    refNo: TCardRefNo;
    count: number;
}

export type DeckTemplate = IDeckTemplateEntry[];

export const FACTION_CONFIG: Record<TFaction, DeckTemplate> = {
    [Faction.THE_UNITED_FLEET]: [
        // Ships
        { kind: CardKind.Ship, refNo: "flagship0", count: 1 },
        { kind: CardKind.Ship, refNo: "frigate0", count: 4 },
        // Supports
        { kind: CardKind.Support, refNo: "flare", count: 2 },
    ],
};
