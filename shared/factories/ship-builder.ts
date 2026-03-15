import { Ship } from "../models/Ship";
import { IShip } from "../types";
import { Builder } from "./builder";

export class ShipBuilder extends Builder<IShip, Ship> {
    constructor(defaultOverrides?: Partial<IShip>) {
        const defaultProps: IShip = {
            id: "",
            playerId: "",
            refNo: "",
            name: "",
            dimensions: [1, 1],
            deployed: false,
            commandPointCost: 1,
            movementRange: 3,
            remainingMovement: 3,
            movementCommandPointCost: 1,
            attackCountMax: 1,
            attackRange: 1,
            attackCommandPointCost: 1,
            attackDamage: 1,
            remainingAttacks: 1,
            attackMinRange: 0,
            destroyed: false,
            hullTemplates: [],
            isFlagship: false,
        };
        super(defaultProps, defaultOverrides, Ship);
    }
}