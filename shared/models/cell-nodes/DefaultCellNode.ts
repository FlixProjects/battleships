import { CELL_NODE_REF_NO } from "@shared/config/constants";
import { CellNodeEntity } from "../entities/CellNodeEntity";
import { TCellNodeRefNo } from "@shared/types/types";

export class DefaultCellNode extends CellNodeEntity {
    refNo: TCellNodeRefNo = CELL_NODE_REF_NO.default;
}
