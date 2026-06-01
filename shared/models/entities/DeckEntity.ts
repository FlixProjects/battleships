import { ICard, IDeck, TFaction } from "../../types";
import { createCard } from "../../utils/card-helper";
import { Card } from "../Card";
import { Listener } from "../listeners/Listener";
import { IListener } from "../listeners/types";
import { DeckAddToPlayedSignalHandler } from "../signal-handlers/DeckAddToPlayedSignalHandler";
import { SignalType } from "../signals/types";
import { GameObjectEntity } from "./GameObjectEntity";

export class DeckEntity extends GameObjectEntity<DeckEntity> implements IDeck {
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

    protected getDefaultListeners(): IListener[] {
        return [this.createDeckAddToPlayedListener()];
    }

    protected createDeckAddToPlayedListener() {
        return new Listener(
            [SignalType.DeckAddToPlayed],
            (ctx) => {
                new DeckAddToPlayedSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    private toCards(cards: ICard[] | undefined): Card[] {
        return (cards ?? []).map((c) => createCard(c));
    }
}
