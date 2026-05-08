import { IPlainAction, IPlayerAction } from "../../types";
import { ActionEntity } from "../entities/ActionEntity";

export class Action extends ActionEntity {
    constructor(props: Readonly<IPlayerAction>) {
        super(props);
    }

    /** IPlayerAction is its own plain shape — no children to flatten. */
    public toPlain(): IPlainAction {
        return { ...this };
    }

    public static toDomain(plain: IPlainAction): Action {
        return plain instanceof Action ? plain : new Action(plain);
    }
}
