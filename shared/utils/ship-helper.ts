import { TUDF_Flagship } from "@shared/models/ships/TUDF/TUDF_Flagship";
import { TUDF_Frigate } from "@shared/models/ships/TUDF/TUDF_Frigate";
import { Ship } from "@shared/models/Ship";
import { TShipRefNo } from "@shared/types";

export type ShipConstructor<T extends Ship = Ship> = new (...args: any[]) => T;

export const refNoToFactionShip: Record<TShipRefNo, ShipConstructor> = {
    tudf_flagship0: TUDF_Flagship,
    tudf_frigate0: TUDF_Frigate,
    flagship0: Ship,
    frigate0: Ship,
};

export function getFactionShipCtor(refNo: TShipRefNo): ShipConstructor {
    const Ctor = refNoToFactionShip[refNo];
    if (!Ctor) {
        throw new Error(`Unknown ship refNo '${refNo}'`);
    }
    return Ctor;
}
