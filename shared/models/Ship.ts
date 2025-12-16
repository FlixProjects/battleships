import { Hull } from "./Hull";

export class Ship implements IShip {
    id: string;
    playerId: string;
    refNo: string;
    name: string;
    hullLocations?: Hull[];
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
    isFlagship: boolean;

    constructor(props: Readonly<IShip>) {
        Object.assign(this, props);
        if (this.hullLocations) {
            this.hullLocations = this.hullLocations.map((hull) => {
                if (hull instanceof Hull) {
                    return hull;
                }
                return new Hull(hull);
            });
        }
    }

    update(ship: Partial<IShip>) {
        if (ship.id && ship.id !== this.id) return this;
        Object.assign(this, ship);
        return this;
    }
}
