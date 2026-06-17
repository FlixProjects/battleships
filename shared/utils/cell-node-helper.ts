import { CELL_NODE_REF_NO } from "@shared/config/constants";
import { DefaultCellNode, IslandCellNode } from "@shared/models/cell-nodes/";
import { CellNodeEntity } from "@shared/models/entities/CellNodeEntity";
import { ICellNode, TCellNodeRefNo } from "..";

export const refNoToCellNodeClassMap: Record<TCellNodeRefNo, new (props: ICellNode) => CellNodeEntity> = {
    [CELL_NODE_REF_NO.default]: DefaultCellNode,
    [CELL_NODE_REF_NO.island0]: IslandCellNode,
};

export function createCellNodeByRefNo(cellNode: ICellNode): CellNodeEntity {
    const CellNodeClass = refNoToCellNodeClassMap[cellNode.refNo];
    if (!CellNodeClass) {
        throw new Error(`No CellNode class found for refNo: ${cellNode.refNo}`);
    }
    return new CellNodeClass(cellNode);
}
