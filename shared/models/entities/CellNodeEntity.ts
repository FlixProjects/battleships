import { ICellLoc, ICellNode, IPathCellNode, IPathTraveller, TCellNodeRefNo } from "../../types/types";
import { GameObjectWithVisibilityEntity } from "./GameObjectWithVisibilityEntity";

export class CellNodeEntity extends GameObjectWithVisibilityEntity<CellNodeEntity> implements ICellNode, IPathCellNode {
    refNo: TCellNodeRefNo;
    location: ICellLoc;
    imgSrc?: string;
    constructor(props: ICellNode) {
        super();
        Object.assign(this, props);
    }

    public isEnterable(): boolean {
        return true;
    }

    public canBeEntered(_traveller: IPathTraveller): boolean {
        return this.isEnterable();
    }

    public onEnter(_traveller: IPathTraveller): void {}

    toPlain() {
        return {
            id: this.id,
            refNo: this.refNo,
            location: this.location,
            isVisible: this.isVisible,
            imgSrc: this.imgSrc,
        } as ICellNode;
    }
}
