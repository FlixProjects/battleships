import type { TFaction } from "../../factions";
import { ICard, IDeck } from "../../types";
import { Card } from "../Card";
import { Entity } from "./Entity";

export class DeckEntity extends Entity<DeckEntity> implements IDeck {
    id: string;
    playerId: string;
    faction: TFaction;
    cards: Card[];

    constructor(props: Readonly<IDeck>) {
        super();
        this.id = props.id;
        this.playerId = props.playerId;
        this.faction = props.faction;
        this.cards = (props.cards ?? []).map((c) => (c instanceof Card ? c : new Card(c as ICard)));
    }
}
