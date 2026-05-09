import { SUPPORTS_CONFIG, TSupportRefNo } from "@shared/constants";
import { FEHighlightLocationsCommand } from "@shared/models/commands/FEHighlightLocationsCommand";
import { FEPlayCardCommand } from "@shared/models/commands/FEPlayCardCommand";
import { GameEngine } from "@shared/models/GameEngine";
import { ICellLoc, PlaySupportTargetIMEvent, ResultType } from "@shared/types";
import { locationToKey } from "@shared/utils/helpers";
import { gameManager, interactionManager } from "../..";
import { getComponents } from "../../components/component-helper";
import { Toast } from "../../components/Toast";
import { queueCommand } from "../../utils/game-helper";
import { buildFEEffects } from "../effects";
import { ClickHandler } from "./ClickHandler";

/**
 * Generic ClickHandler for SupportCard Effects that need a target tile (Flare,
 * future single-tile damage cards, etc.). Highlights the Effect's anchored
 * range and, on a valid click, either chains to the next FEEffect (multi-
 * effect cards) or dispatches FEPlayCardCommand.
 */
export class SelectTileClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];
    /** Targets chosen so far across the chained Effects (one per FEEffect). */
    private chosenTargets: (ICellLoc | undefined)[] = [];

    constructor(
        protected event: PlaySupportTargetIMEvent,
        private chosenTargetsSoFar: (ICellLoc | undefined)[] = [],
    ) {
        super();
        this.chosenTargets = [...chosenTargetsSoFar];
    }

    public handleEvent() {
        const { cardId, effectIndex } = this.event;
        const playerId = gameManager.getCurrentPlayerId();

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const result = gameEngine.prime.playSupport({ playerId, cardId, effectIndex });
        if (result.type === ResultType.ERROR) {
            throw new Error(result.message || "[Error] Failed to prime SupportCard target");
        }

        this.validCells = result.validCells;
        this.announceCurrentEffect();
        queueCommand(new FEHighlightLocationsCommand(getComponents().div.gameBoard, this.validCells));

        return { nextClickhandler: async (e: MouseEvent) => await this.handler(e) };
    }

    protected async handler(e: MouseEvent) {
        const { onGlobalDeselect, onSuccessfulSelect } = this.event;
        const target = e.target as HTMLElement;
        const id = this.addGetIdOfClick(e);
        const validCellIndices = this.validCells.map((cell) => locationToKey(cell));

        const clickedCardRow = target.closest(".card-row");
        if (!clickedCardRow && !validCellIndices.includes(id)) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        if (!validCellIndices.includes(id)) return;

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        const tile = this.selectables[id];
        const targetTile = this.cellLocFromId(id);
        this.chosenTargets[this.event.effectIndex] = targetTile;

        if (this.hasMoreEffects()) {
            this.dispatchNextEffect();
            return;
        }

        const playerId = gameManager.getCurrentPlayerId();
        queueCommand(
            new FEPlayCardCommand({
                cardId: this.event.cardId,
                playerId,
                support: { targetTile, locationElement: tile },
                onSuccessCb: onSuccessfulSelect,
            }),
        );
    }

    private cellLocFromId(id: string): ICellLoc {
        const [x, y] = id.split("/").map(Number);
        return [x, y] as ICellLoc;
    }

    private hasMoreEffects(): boolean {
        const card = gameManager.state.gameState.cards.find((c) => c.id === this.event.cardId);
        if (!card) return false;
        const supportConfig = SUPPORTS_CONFIG[card.refNo as TSupportRefNo];
        return !!supportConfig && this.event.effectIndex + 1 < supportConfig.effects.length;
    }

    private dispatchNextEffect() {
        const nextIndex = this.event.effectIndex + 1;
        const card = gameManager.state.gameState.cards.find((c) => c.id === this.event.cardId);
        if (!card) return;
        const feEffects = buildFEEffects(card.id, card.refNo);
        const nextFEEffect = feEffects[nextIndex];
        if (!nextFEEffect) return;

        interactionManager.handleEvent(
            nextFEEffect.getSelectionEvent({
                onGlobalDeselect: this.event.onGlobalDeselect,
                onSuccessfulSelect: this.event.onSuccessfulSelect,
            }),
        );
    }

    private announceCurrentEffect() {
        const card = gameManager.state.gameState.cards.find((c) => c.id === this.event.cardId);
        if (!card) return;
        const supportConfig = SUPPORTS_CONFIG[card.refNo as TSupportRefNo];
        if (!supportConfig || supportConfig.effects.length <= 1) return;
        const effectConfig = supportConfig.effects[this.event.effectIndex];
        if (!effectConfig) return;
        Toast.show({
            message: `${supportConfig.name}: pick a tile for "${effectConfig.refNo}"`,
            type: "info",
            duration: 2500,
        });
    }
}
