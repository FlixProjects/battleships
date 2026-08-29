import { CardKind } from "../../config/constants";
import { ERROR_MESSAGES } from "../../constants";
import { IDeployAction, IErrorResult, IGameState, IPlayCardAction, IShipCardPayload, ResultType } from "../../types";
import { DeployShipValidator } from "./DeployShipValidator";
import { Validator } from "./Validator";

/**
 * Boundary validation for a PlayCard action. The action itself is just "play
 * this card"; the meaningful validation lives in the card's resolved payload.
 * For a ShipCard the payload matches a deploy, so we reuse DeployShipValidator
 * rather than couple PlayCard to deploy rules.
 */
export class PlayCardValidator extends Validator {
    constructor(
        private readonly gameState: IGameState,
        private readonly playCardAction: IPlayCardAction,
    ) {
        super();
    }

    validate() {
        const { cardId, playerId } = this.playCardAction;
        const card = this.gameState.cards.find((c) => c.id === cardId);

        if (!card) {
            return {
                type: ResultType.ERROR,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
                message: "Card not found",
            } as IErrorResult;
        }

        const player = this.gameState.getPlayer(playerId);
        if (!player || !player.hand.includes(cardId)) {
            return {
                type: ResultType.ERROR,
                errorCode: ERROR_MESSAGES.PLAY_CARD_ERROR_NOT_IN_HAND,
                message: `Card ${cardId} is not in player ${playerId}'s hand`,
            } as IErrorResult;
        }

        if (card.kind === CardKind.Ship) {
            return new DeployShipValidator(this.gameState, this.toDeployAction(card.instanceId)).validate();
        }

        // Other card kinds have no boundary validator yet (validated upstream).
        return { type: ResultType.SUCCESS, playerId };
    }

    private toDeployAction(shipId: string): IDeployAction {
        const { id, order, round, playerId, commandPointCost, payload } = this.playCardAction;
        const { location } = payload as IShipCardPayload;
        return { id, order, round, playerId, commandPointCost, shipId, location };
    }
}
