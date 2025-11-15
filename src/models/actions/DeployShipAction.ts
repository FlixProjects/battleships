import { ActionTypes, ICellLoc } from "../../../shared/types";
import { Action } from "./Action";

export class DeployShipAction extends Action {
    type = ActionTypes.DEPLOY;
    shipId: string;
    location: ICellLoc;

    constructor(props: Partial<DeployShipAction>) {
        super();
        Object.assign(this, props);
    }
}
