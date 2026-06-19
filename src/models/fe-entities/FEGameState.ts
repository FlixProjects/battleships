import { GameState } from "@shared/models";
import { FECellNodeEntity } from "./FECellNodeEntity";
import { FEShipEntity } from "./FEShipEntity";
import { ICellNode, IGameStateData, IPlainGameState, IPlainShip, IShip } from "@shared/types/types";

export class FEGameState extends GameState {
    ships: FEShipEntity[];

    constructor(props: Readonly<IGameStateData | IPlainGameState>) {
        super(props);
    }

    protected toShip(s: IShip | IPlainShip): FEShipEntity {
        return FEShipEntity.toDomain(FEGameState.toPlainShip(s), this);
    }

    protected toCellNode(cn: ICellNode): FECellNodeEntity {
        return FECellNodeEntity.toDomain(cn);
    }

    public static toDomain(plain: IPlainGameState): FEGameState {
        return new FEGameState(plain);
    }
}
