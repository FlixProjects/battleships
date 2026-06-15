import type { ShipConstructor } from "@shared/utils/ship-helper";

export function TUDF_Frigate<TBase extends ShipConstructor>(Base: TBase) {
    return class extends Base {
        refNo = "tudf_frigate0" as const;
    };
}
