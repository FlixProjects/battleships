import { GameState } from "@shared/models";
import { FEShipEntity } from "./FEShipEntity";
import { IGameStateData, IPlainGameState, IPlainShip, IShip } from "@shared/types/types";

export class FEGameState extends GameState {
    ships: FEShipEntity[];

    constructor(props: Readonly<IGameStateData | IPlainGameState>) {
        super(props);
    }

    protected toShip(s: IShip | IPlainShip): FEShipEntity {
        return FEShipEntity.toDomain(FEGameState.toPlainShip(s), this);
    }

    public static toDomain(plain: IPlainGameState): FEGameState {
        return new FEGameState(plain);
    }
}
