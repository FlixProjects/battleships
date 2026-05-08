import type { TShipRefNo } from "./constants";

export const Faction = {
    THE_UNITED_FLEET: "THE_UNITED_FLEET",
} as const;

export type TFaction = (typeof Faction)[keyof typeof Faction];

export const MAX_HAND_SIZE = 4;

export interface IDeckTemplateEntry {
    refNo: TShipRefNo;
    count: number;
}

export type DeckTemplate = IDeckTemplateEntry[];

export const FACTION_CONFIG: Record<TFaction, DeckTemplate> = {
    [Faction.THE_UNITED_FLEET]: [
        { refNo: "flagship0", count: 1 },
        { refNo: "frigate0", count: 4 },
    ],
};
