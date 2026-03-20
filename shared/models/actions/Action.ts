import { IPlayerAction } from "../../types";
import { ActionEntity } from "../entities/ActionEntity";

export class Action extends ActionEntity {
    constructor(props: Readonly<IPlayerAction>) {
        super(props);
    }
}
