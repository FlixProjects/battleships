import { SHIP_REF_NO } from "@shared/config/constants";
import type { ShipConstructor } from "@shared/utils/ship-helper";

export function TUDF_Flagship<TBase extends ShipConstructor>(Base: TBase) {
    return class extends Base {
        refNo = SHIP_REF_NO.tudf_flagship0;
    };
}
