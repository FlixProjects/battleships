import { ASSET_PATHS, SELECTABLE_ID } from "@shared/constants";
import { IShip } from "@shared/types";
import { IActionMenu } from "@shared/types/fe-types";
import { gameManager, interactionManager } from "../..";
import { IMEventType } from "../../models/interaction-manager/types";
import { getComponents } from "../component-helper";
import { Selectable } from "../Selectable";
import { SelectShipAttackButton } from "./SelectAttackButton";
import { SelectMoveButton } from "./SelectMoveButton";

interface Props {
    ship: IShip;
}

export class ActionMenu extends Selectable implements IActionMenu {
    private isGameOver: boolean = false;
    constructor(private props: Props) {
        super(SELECTABLE_ID.ACTION_MENU);
    }

    public build() {
        this.ref = document.createElement("div");
        this.isGameOver = !!gameManager.state.gameState.isOver;
        this.addStyles();

        // TODO: we shud check the ship's movement points to update styles
        this.addMoveButton();
        this.addAttackButton();
        return this.ref;
    }

    private addMoveButton() {
        const ship = this.props.ship;
        const player = gameManager.getPlayer();
        const cannotMove =
            !!ship && (ship.remainingMovement === 0 || ship.movementCommandPointCost > player.commandPoints);

        const btn = new SelectMoveButton("select-action-move", {
            iconSrc: ASSET_PATHS.MOVE_ICON,
            disabled: this.isGameOver || cannotMove,
            onClick: async (e: MouseEvent) => {
                e?.stopPropagation();
                interactionManager.handleEvent({
                    type: IMEventType.MOVING_SHIP,
                    shipId: this.props?.ship?.id,
                    onGlobalDeselect: () => {
                        getComponents().div.gameBoard.updateSelectableTiles([]);
                    },
                });
                this.remove();
            },
        });

        this.addChild(btn);
        this.ref.appendChild(btn.build());
        return btn;
    }

    private addAttackButton() {
        const ship = this.props.ship;
        const player = gameManager.getPlayer();
        const cannotAttack =
            !!ship && (ship.attackCommandPointCost > player.commandPoints || ship.remainingAttacks <= 0);

        const btn = new SelectShipAttackButton("select-action-attack", {
            iconSrc: ASSET_PATHS.TARGET_ICON,
            disabled: this.isGameOver || cannotAttack,
            onClick: async (e: MouseEvent) => {
                e?.stopPropagation();
                interactionManager.handleEvent({
                    type: IMEventType.SHIP_ATTACK,
                    shipId: this.props?.ship?.id,
                    onGlobalDeselect: () => {
                        getComponents().div.gameBoard.updateSelectableTiles([]);
                    },
                });
                this.remove();
            },
        });

        this.addChild(btn);
        this.ref.appendChild(btn.build());
        return btn;
    }

    public close() {
        this.remove();
    }

    protected addStyles() {
        this.ref.style.position = "absolute";
        this.ref.style.top = "-40px";
        this.ref.style.left = "50%";
        this.ref.style.transform = "translateX(-50%)";
        this.ref.style.background = "rgba(15, 23, 36, 0.95)";
        this.ref.style.border = "1px solid rgba(110, 231, 183, 0.3)";
        this.ref.style.borderRadius = "8px";
        this.ref.style.padding = "4px";
        this.ref.style.display = "flex";
        this.ref.style.gap = "4px";
        this.ref.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";
        this.ref.style.zIndex = "1000";
        this.ref.style.animation = "fadeIn 0.2s ease";
    }
}
