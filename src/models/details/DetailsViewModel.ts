import { ASSET_PATHS, TColor } from "@shared/constants";
import { EffectKind, IEffect, IShip, IVisionEffectPayload } from "@shared/types";

export interface DetailsStat {
    iconSrc: string;
    label: string;
    value: string | number;
}

export interface DetailsHealthRow {
    label: string;
    current: number;
    max: number;
}

/**
 * Presentation-only shape consumed by DetailsPanel. The panel never imports a
 * domain type — per-kind builders below adapt a live Ship / Effect into this.
 */
export interface DetailsViewModel {
    title: string;
    color: TColor;
    description: string;
    stats: DetailsStat[];
    healthRows?: DetailsHealthRow[];
}

/** Per-hull health: live hull values when deployed, otherwise hull-template maxes. */
const shipHealthRows = (ship: IShip): DetailsHealthRow[] => {
    const hulls = ship.hulls ?? [];
    if (hulls.length > 0) {
        return hulls.map((h, i) => ({ label: `Hull ${i + 1}`, current: h.remainingHealth, max: h.maxHealth }));
    }
    return ship.hullTemplates.map((ht, i) => ({ label: `Hull ${i + 1}`, current: ht.maxHealth, max: ht.maxHealth }));
};

/** Summed current health across a ship's hulls (template maxes when undeployed). */
export const sumShipHealth = (ship: IShip): number =>
    shipHealthRows(ship).reduce((total, row) => total + row.current, 0);

export const buildShipDetails = (ship: IShip, color: TColor): DetailsViewModel => ({
    title: ship.name,
    color,
    description: ship.description,
    stats: [
        { iconSrc: ASSET_PATHS.TARGET_ICON, label: "Attack", value: ship.attackDamage },
        { iconSrc: ASSET_PATHS.MOVE_ICON, label: "Move", value: ship.movementRange },
    ],
    healthRows: shipHealthRows(ship),
});

export const buildEffectDetails = (
    effect: IEffect,
    color: TColor,
    source: { name: string; description: string },
): DetailsViewModel => {
    const stats: DetailsStat[] = [];
    if (effect.kind === EffectKind.Vision) {
        const payload = effect.payload as IVisionEffectPayload;
        stats.push({ iconSrc: ASSET_PATHS.INFO_ICON, label: "Vision range", value: payload.range });
    }
    stats.push({ iconSrc: ASSET_PATHS.INFO_ICON, label: "Duration", value: `${effect.duration} rounds` });

    return {
        title: source.name,
        color,
        description: source.description,
        stats,
    };
};
