import { IHullCalculator, THullCalculatorConstructor } from "@shared/types";
import { HullCalculator as _HullCalculator } from "@shared/utils/hull-helper";
import { ISelectable } from "../../types/fe-types";
import { getHull, keyToLocation } from "../../utils/helpers";
import { PlayCardActionCreator } from "../ActionCreator";
import { FECommand } from "./FECommand";
import { ICommandExecutionParams } from "./types";

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

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { tileId, shipId, playerId, locationElement, onSuccessCb } = this.props;
        const { gsm, db, resolver } = params;
        const { commandPointCost, hullTemplates } = gsm.getShip(shipId);

        const player = gsm.getPlayer(playerId);
        const isFirstPlayer = gsm.gameState.isFirstPlayer(playerId);

        const selectedLocation = keyToLocation(tileId);
        const hullCalculator: IHullCalculator = new this.HullCalculator(gsm, isFirstPlayer);

        const committedHullLocations = hullTemplates.map((ht) => {
            const deployedLoc = hullCalculator.getDeployedHullLocation(selectedLocation, ht.templateLocation);
            return getHull({
                shipId,
                hullTemplate: ht,
                location: deployedLoc,
                isFirstPlayer,
            });
        });

        // Find the Ship card backing this deploy. The card is the trigger;
        // the deploy is the consequence the card describes.
        const card = gsm.gameState.cards.find((c) => c.instanceId === shipId);
        if (!card) {
            throw new Error(`[Error] No card found for ship ${shipId} — cannot deploy without a card to play`);
        }

        const playCardAction = new PlayCardActionCreator(player, gsm.getCurrentRound()).create({
            cardId: card.id,
            commandPointCost,
            payload: {
                kind: "Ship",
                hullLocations: committedHullLocations,
            },
        });

        const newGameState = resolver.resolvePlayCard(playCardAction);

        db.saveAppState({ gameState: newGameState.toPlain() });

        locationElement.runOnSelects();
        onSuccessCb?.();
        return;
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: implement undo for deploy ship
        return;
    }
}
