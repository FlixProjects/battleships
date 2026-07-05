import { ASSET_PATHS, TColor } from "@shared/constants";
import { EffectKind, ICard, IEffect, IEffectTemplate, IShip, isVisionEffect } from "@shared/types";

export interface DetailsStat {
    iconSrc: string;
    label: string;
    value: string | number;
}

export interface DetailsHullValue {
    current: number;
    max: number;
}

/** One `Hull i/n — armor | health` line in the DetailsPanel. */
export interface DetailsHullRow {
    label: string;
    health: DetailsHullValue;
    armor: DetailsHullValue;
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
    hullRows?: DetailsHullRow[];
}

/** Per-hull health + armor: live hull values when deployed (both deplete as
 *  damage resolves — armor's max lives on the hull template, since the live
 *  `armor` field is the depleting one), otherwise hull-template maxes. */
const shipHullRows = (ship: IShip): DetailsHullRow[] => {
    const hulls = ship.hulls ?? [];
    if (hulls.length > 0) {
        return hulls.map((h, i) => ({
            label: `Hull ${i + 1}/${hulls.length}`,
            health: { current: h.remainingHealth, max: h.maxHealth },
            armor: { current: h.armor, max: ship.hullTemplates[i]?.armor ?? h.armor },
        }));
    }
    return ship.hullTemplates.map((ht, i) => ({
        label: `Hull ${i + 1}/${ship.hullTemplates.length}`,
        health: { current: ht.maxHealth, max: ht.maxHealth },
        armor: { current: ht.armor, max: ht.armor },
    }));
};

/** Summed current health across a ship's hulls (template maxes when undeployed). */
export const sumShipHealth = (ship: IShip): number =>
    shipHullRows(ship).reduce((total, row) => total + row.health.current, 0);

/** Per-hull armor soak (each hull absorbs damage independently, so armor is
 *  NOT summed like health): live value when deployed, template max otherwise. */
export const shipArmor = (ship: IShip): number => {
    const hulls = ship.hulls ?? [];
    if (hulls.length > 0) {
        return Math.max(...hulls.map((h) => h.armor), 0);
    }
    return Math.max(...ship.hullTemplates.map((ht) => ht.armor), 0);
};

export const buildShipDetails = (ship: IShip, color: TColor): DetailsViewModel => ({
    title: ship.name,
    color,
    description: ship.description,
    stats: [
        { iconSrc: ASSET_PATHS.TARGET_ICON, label: "Attack", value: ship.attackDamage },
        { iconSrc: ASSET_PATHS.MOVE_ICON, label: "Move", value: ship.movementRange },
    ],
    hullRows: shipHullRows(ship),
});

const effectTemplateStats = (template: IEffectTemplate): DetailsStat[] => {
    const stats: DetailsStat[] = [];
    if (template.kind === EffectKind.Vision) {
        stats.push({ iconSrc: ASSET_PATHS.VISION_ICON, label: "Vision range", value: template.range ?? 0 });
    }
    if (template.kind === EffectKind.Damage) {
        stats.push({ iconSrc: ASSET_PATHS.TARGET_ICON, label: "Damage", value: template.damage });
    }
    if (template.kind === EffectKind.CommandPoint) {
        stats.push({ iconSrc: ASSET_PATHS.INFO_ICON, label: "Command points", value: `+${template.commandPointAmount}` });
    }
    stats.push({ iconSrc: ASSET_PATHS.DURATION_ICON, label: "Duration", value: `${template.duration ?? 0} rounds` });
    return stats;
};

/** Details for an in-hand Support card: its Effects are minted only on play,
 *  so everything shown comes from the card's own resolved effectTemplates. */
export const buildSupportCardDetails = (card: ICard, color: TColor): DetailsViewModel => ({
    title: card.name,
    color,
    description: card.description ?? "",
    stats: (card.effectTemplates ?? []).flatMap(effectTemplateStats),
});

export const buildEffectDetails = (
    effect: IEffect,
    color: TColor,
    source: { name: string; description: string },
): DetailsViewModel => {
    const stats: DetailsStat[] = [];
    if (isVisionEffect(effect)) {
        stats.push({ iconSrc: ASSET_PATHS.VISION_ICON, label: "Vision range", value: effect.range });
    }
    stats.push({ iconSrc: ASSET_PATHS.DURATION_ICON, label: "Duration", value: `${effect.duration} rounds` });

    return {
        title: source.name,
        color,
        description: source.description,
        stats,
    };
};
