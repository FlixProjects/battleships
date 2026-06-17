import { ICellLoc, ICellNode, TCellNodeRefNo } from "../../types/types";
import { GameObjectWithVisibilityEntity } from "./GameObjectWithVisibilityEntity";

export class CellNodeEntity extends GameObjectWithVisibilityEntity<CellNodeEntity> implements ICellNode {
    refNo: TCellNodeRefNo;
    location: ICellLoc;
    constructor(props: ICellNode) {
        super();
        Object.assign(this, props);
    }

    toPlain() {
        return {
            id: this.id,
            refNo: this.refNo,
            location: this.location,
            isVisible: this.isVisible,
        } as ICellNode;
    }
}
