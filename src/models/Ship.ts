import { IHull, IShip } from "../../shared";

export class Ship implements IShip {
    id: string;
    refNo: string;
    name: string;
    hullLocations?: IHull[];
    dimensions: [number, number];
    deployed: boolean;
}
