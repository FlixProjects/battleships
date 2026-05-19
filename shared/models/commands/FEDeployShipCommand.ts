import { IHullCalculator, THullCalculatorConstructor } from "@shared/types";
import { HullCalculator as _HullCalculator } from "@shared/utils/hull-helper";
import { ISelectable } from "../../types/fe-types";
import { getHull, keyToLocation } from "../../utils/helpers";
import { FECommand } from "./FECommand";
import { FEFinalizeSelectionCommand } from "./FEFinalizeSelectionCommand";
import { ServerPlayCardCommand } from "./ServerPlayCardCommand";
import { ICommand, ICommandExecutionParams } from "./types";

export class FEDeployShipCommand extends FECommand {
    private HullCalculator: THullCalculatorConstructor = _HullCalculator;

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
        const { commandPointCost, hullTemplates } = gsm.getShip(shipId);

        const isFirstPlayer = gsm.gameState.isFirstPlayer(playerId);
        const selectedLocation = keyToLocation(tileId);
        const hullCalculator: IHullCalculator = new this.HullCalculator(gsm, isFirstPlayer);

        const committedHullLocations = hullTemplates.map((ht) => {
            const deployedLoc = hullCalculator.getDeployedHullLocation(selectedLocation, ht.templateLocation);
            return getHull({ shipId, hullTemplate: ht, location: deployedLoc, isFirstPlayer });
        });

        const card = gsm.gameState.cards.find((c) => c.instanceId === shipId);
        if (!card) {
            throw new Error(`[Error] No card found for ship ${shipId} — cannot deploy without a card to play`);
        }

        return [
            new ServerPlayCardCommand({
                playerId,
                cardId: card.id,
                commandPointCost,
                payload: { kind: "Ship", hullLocations: committedHullLocations },
            }),
            new FEFinalizeSelectionCommand({ locationElement, onSuccessCb }),
        ];
    }

    public async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // TODO: implement undo for deploy ship
    }
}
