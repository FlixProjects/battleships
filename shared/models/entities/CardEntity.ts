import { ICard, TCardKind } from "../../types";
import { Listener } from "../listeners/Listener";
import { IListener } from "../listeners/types";
import { PlayCardSignalHandler } from "../signal-handlers/PlayCardSignalHandler";
import { SignalType } from "../signals/types";
import { GameObjectEntity } from "./GameObjectEntity";

export class CardEntity extends GameObjectEntity<CardEntity> implements ICard {
    id: string;
    deckId: string;
    instanceId: string;
    kind: TCardKind;
    refNo: string;
    name: string;

    constructor(props: Readonly<ICard>) {
        super();
        this.id = props.id;
        this.deckId = props.deckId;
        this.instanceId = props.instanceId;
        this.kind = props.kind;
        this.refNo = props.refNo;
        this.name = props.name;
    }

    protected getDefaultListeners(): IListener[] {
        return [this.createPlayCardListener()];
    }

    protected createPlayCardListener() {
        return new Listener(
            [SignalType.PlayCard],
            (ctx) => {
                new PlayCardSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }
}
