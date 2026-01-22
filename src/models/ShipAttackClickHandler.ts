import { gameManager } from "..";
import {
    ActionTypes,
    ANIMATION_LAYER_ID,
    ASSET_PATHS,
    CELL_SEPARATOR,
    COLOR,
    COLOR_FILTER,
    getShipFromPlayer,
    ICellLoc,
    keyToLocation,
    locationToKey,
    ResultType,
} from "../../shared";
import { GameEngine } from "../../shared/models/GameEngine";
import { HTMLImage } from "../components/native/Image";
import { Projectile } from "../components/projectiles/Projectile";
import { Selectable } from "../components/Selectable";
import { Icon } from "../components/ships/Icon";
import { animationManager } from "./AnimationManager";
import { DestroyedAnimation } from "./animations";
import { ClickHandler } from "./ClickHandler";
import { ShipAttackActionIMEvent } from "./InteractionManager";

const TARGET_ICON_ID_PREFIX = "target-icon";

export class ShipAttackClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];
    private origin: ICellLoc;
    constructor(protected event: ShipAttackActionIMEvent) {
        super();
    }

    public handleEvent() {
        const { shipId } = this.event;
        const playerId = gameManager.getPlayer().id;

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const { validCells, origin } = gameEngine.prime.shipAttack({ playerId, shipId });

        const onSelectable = (selectable: Selectable) => {
            this.loadRedStyle(selectable);
            this.loadTargetIcon(selectable);
        };

        const onUnselectable = (selectable: Selectable) => {
            this.removeTargetIcon(selectable);
        };

        this.updateGameBoard(validCells, { onSelectable, onUnselectable });

        this.validCells = validCells;
        this.origin = origin;

        return {
            nextClickhandler: async (e: MouseEvent) => await this.handler(e),
        };
    }

    protected async handler(e: MouseEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = this.event;
        const target = e.target as HTMLElement;

        const id = target.closest(`.tile`)?.id;
        const validCellIndices = this.validCells.map((cell) => locationToKey(cell));

        const isInvalidClick =
            !id || (!validCellIndices.includes(id) && !(this.origin && locationToKey(this.origin) === id));

        if (isInvalidClick) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        if (validCellIndices.includes(id)) {
            this.handleShipAttackClick(id, shipId, onSuccessfulSelect);
        }
    }

    // FIXME: should we handle multiple location hits?
    private handleShipAttackClick(attackTileId: string, shipId: string, onSuccessCb?: () => void) {
        const gameEngine = new GameEngine(gameManager.state.gameState);

        const attackLocation = keyToLocation(attackTileId);
        const player = gameManager.getPlayer();
        const playerId = player.id;
        const attackingShip = getShipFromPlayer(player, shipId);

        const result = gameEngine.commit.shipAttack({
            type: ActionTypes.ATTACK,
            shipId,
            playerId,
            attackLocations: [attackLocation], // FIXME: only single location for now
            commandPointCost: attackingShip.commandPointCost,
        });

        if (result.type === ResultType.ERROR) return;

        const projectile = new Projectile({
            origin: this.origin,
            target: keyToLocation(attackTileId),
            parent: document.querySelector(ANIMATION_LAYER_ID) || undefined,
        });
        projectile.queueAnimation();

        const destroyedShips = result.players.flatMap((p) => p.ships).filter((s) => s.destroyed);
        for (const ship of destroyedShips) {
            animationManager.enqueue(new DestroyedAnimation({ id: ship.id }));
        }
        if (destroyedShips.length > 0) {
            animationManager.play();
        }

        gameManager.updatePlayers(result.players);

        const tile = this.selectables[attackTileId];
        tile.runOnSelects();

        onSuccessCb?.();
    }

    private loadRedStyle(selectable: Selectable) {
        selectable.ref.style.background = "rgba(255, 110, 110, 0.2)";
        selectable.ref.style.border = "1px solid rgba(255, 110, 110, 0.5)";
    }

    private loadTargetIcon(selectable: Selectable) {
        const iconId = `${TARGET_ICON_ID_PREFIX}-${selectable.id.replace(CELL_SEPARATOR, "-")}`;
        const existingIcon = selectable.ref.querySelector(`#${iconId}`);

        if (!existingIcon) {
            const icon = new Icon({
                id: iconId,
                src: ASSET_PATHS.TARGET_ICON,
                addStyles: (icon) => this.addTargetStyles(icon),
            });

            selectable.addChild(icon);
            selectable.ref.appendChild(icon.build());
        }
    }

    private addTargetStyles(icon: HTMLImage) {
        const ref = icon.ref;
        ref.style.position = "absolute";
        ref.style.opacity = "0.5";
        ref.style.filter = COLOR_FILTER[COLOR.RED];
        ref.style.zIndex = "10";
    }

    private removeTargetIcon(selectable: Selectable) {
        const iconId = `${TARGET_ICON_ID_PREFIX}-${selectable.id.replace(CELL_SEPARATOR, "-")}`;
        const existingIcon = selectable.ref.children.namedItem(iconId);

        if (existingIcon) {
            existingIcon.remove();
        }
    }
}
