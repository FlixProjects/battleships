import { ICard, TCardKind } from "../../types";
import { GameObjectEntity } from "./GameObjectEntity";

export class CardEntity extends GameObjectEntity<CardEntity> implements ICard {
    id: string;
    deckId: string;
    instanceId: string;
    kind: TCardKind;
    refNo: string;

    constructor(props: Readonly<ICard>) {
        super();
        this.id = props.id;
        this.deckId = props.deckId;
        this.instanceId = props.instanceId;
        this.kind = props.kind;
        this.refNo = props.refNo;
    }
}
