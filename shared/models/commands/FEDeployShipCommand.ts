import { ISelectable } from "../../types/fe-types";
import { keyToLocation } from "../../utils/helpers";
import { FECommand } from "./FECommand";
import { FEFinalizeSelectionCommand } from "./FEFinalizeSelectionCommand";
import { ServerPlayCardCommand } from "./ServerPlayCardCommand";
import { ICommand, ICommandExecutionParams } from "./types";

export class FEDeployShipCommand extends FECommand {
    constructor(
        private props: {
            tileId: string;
            shipId: string;
            playerId: string;
            locationElement: ISelectable;
            onSuccessCb?: () => void;
        },
    ) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<ICommand[]> {
        const { tileId, shipId, playerId, locationElement, onSuccessCb } = this.props;
        const { gsm } = params;
        const { commandPointCost } = gsm.getShip(shipId);

        // Send only the anchor tile (intent); the domain derives hull placements.
        const location = keyToLocation(tileId);

        const card = gsm.gameState.cards.find((c) => c.instanceId === shipId);
        if (!card) {
            throw new Error(`[Error] No card found for ship ${shipId} — cannot deploy without a card to play`);
        }

        return [
            new ServerPlayCardCommand({
                playerId,
                cardId: card.id,
                commandPointCost,
                payload: { kind: "Ship", location },
            }),
            new FEFinalizeSelectionCommand({ locationElement, onSuccessCb }),
        ];
    }

    public async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // TODO: implement undo for deploy ship
    }
}
