import { Hull } from "../models";
import { IHull } from "../types";
import { Builder } from "./builder";

export class HullBuilder extends Builder<IHull, Hull> {
    constructor(defaultOverrides?: Partial<IHull>) {
        const defaultProps: IHull = {
            id: "",
            shipId: "",
            location: [0, 0],
            remainingHealth: 1,
            remainingArmor: 0,
            destroyed: false,
            templateLocation: [0, 0],
            maxHealth: 1,
            armor: 0,
            visionRange: 3,
            orientation: 0,
        };
        super(defaultProps, defaultOverrides, Hull);
    }
}
