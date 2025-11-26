import { IHull, IHullTemplate, IShip } from "../../shared";

export class Ship implements IShip {
    id: string;
    playerId: string;
    refNo: string;
    name: string;
    hullLocations?: IHull[];
    dimensions: [number, number];
    deployed: boolean;
    commandPointCost: number;
    movementRange: number;
    remainingMovement: number;
    movementCommandPointCost: number;
    attackCountMax: number;
    attackRange: number;
    attackCommandPointCost: number;
    attackDamage: number;
    remainingAttacks: number;
    attackMinRange: number;
    destroyed: boolean;
    hullTemplates: IHullTemplate[];

    constructor(props: Readonly<Ship>) {
        Object.assign(this, props);
    }
}
