import type { ShipConstructor } from "@shared/utils/ship-helper";

export function TUDF_Flagship<TBase extends ShipConstructor>(Base: TBase) {
    return class extends Base {
        refNo = "tudf_flagship0" as const;
    };
}
