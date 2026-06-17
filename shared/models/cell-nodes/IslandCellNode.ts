import { CellNodeEntity } from "../entities/CellNodeEntity";
import { CELL_NODE_REF_NO } from "@shared/config/constants";
import { DefaultCellNode } from "./DefaultCellNode";

export class IslandCellNode extends DefaultCellNode {
    refNo = CELL_NODE_REF_NO.island0;
}
