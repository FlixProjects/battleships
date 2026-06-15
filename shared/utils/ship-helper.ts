import type { Ship } from "@shared/models/Ship";
import { TUDF_Flagship } from "@shared/models/ships/TUDF/TUDF_Flagship";
import { TUDF_Frigate } from "@shared/models/ships/TUDF/TUDF_Frigate";
import { TShipRefNo } from "@shared/types";

export type ShipConstructor<T extends Ship = Ship> = new (...args: any[]) => T;

/**
 * A faction layer: given any Ship-constructor base, return a base extended with
 * that faction/ship's behaviour. The base is chosen per environment — `Ship` on
 * the backend, `FEShipEntity` (Ship + rendering) on the frontend — so the faction
 * behaviour is written once and composed over either.
 */
export type ShipMixin = <TBase extends ShipConstructor>(Base: TBase) => ShipConstructor;

const identity: ShipMixin = (Base) => Base;

export const refNoToFactionMixin: Record<TShipRefNo, ShipMixin> = {
    tudf_flagship0: TUDF_Flagship,
    tudf_frigate0: TUDF_Frigate,
    flagship0: identity,
    frigate0: identity,
};

export function getFactionMixin(refNo: TShipRefNo): ShipMixin {
    const mixin = refNoToFactionMixin[refNo];
    if (!mixin) {
        throw new Error(`Unknown ship refNo '${refNo}'`);
    }
    return mixin;
}
