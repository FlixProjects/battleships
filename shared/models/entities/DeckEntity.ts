import type { TFaction } from "../../factions";
import { ICard, IDeck } from "../../types";
import { createCard } from "../../utils/card-helper";
import { Card } from "../Card";
import { Entity } from "./Entity";

export class DeckEntity extends Entity<DeckEntity> implements IDeck {
    id: string;
    playerId: string;
    faction: TFaction;
    cards: Card[];
    played: Card[];

    constructor(props: Readonly<IDeck>) {
        super();
        this.id = props.id;
        this.playerId = props.playerId;
        this.faction = props.faction;
        this.cards = this.toCards(props.cards);
        this.played = this.toCards(props.played);
    }

    private toCards(cards: ICard[] | undefined): Card[] {
        return (cards ?? []).map((c) => createCard(c));
    }
}
