import { ICard } from "../types";
import { CardEntity } from "./entities/CardEntity";

export class Card extends CardEntity {
    constructor(props: Readonly<ICard>) {
        super(props);
    }

    public isShipCard(): boolean {
        return this.kind === "Ship";
    }
}
