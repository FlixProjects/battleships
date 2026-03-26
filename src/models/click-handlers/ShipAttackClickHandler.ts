import { gameManager } from "../..";
import {
    ANIMATION_LAYER_ID,
    ASSET_PATHS,
    CELL_SEPARATOR,
    COLOR,
    COLOR_FILTER,
    GameStateManager,
    getShipFromPlayer,
    ICellLoc,
    keyToLocation,
    locationToKey,
    ResultType
} from "../../../shared";
import { ShipAttackActionCreator } from "../../../shared/models/ActionCreator";
import { FEHighlightLocationsCommand } from "../../../shared/models/commands/FEHighlightLocationsCommand";
import { GameEngine } from "../../../shared/models/GameEngine";
import { getComponents } from "../../components/component-helper";
import { HTMLImage } from "../../components/native/Image";
import { Projectile } from "../../components/projectiles/Projectile";
import { Selectable } from "../../components/Selectable";
import { Icon } from "../../components/ships/Icon";
import { getElementsFromIds, queueCommand } from "../../utils/game-helper";
import { animationManager } from "../AnimationManager";
import { DestroyedAnimation } from "../animations";
import { HitAnimation } from "../animations/HitAnimation";
import { StillAnimation } from "../animations/StillAnimation";
import { ShipAttackActionIMEvent } from "../interaction-manager/types";
import { ClickHandler } from "./ClickHandler";

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

        queueCommand(
            new FEHighlightLocationsCommand(getComponents().div.gameBoard, validCells, {
                onSelectable,
                onUnselectable,
            }),
        );

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
        const attackingShip = getShipFromPlayer(player, shipId);

        const action = new ShipAttackActionCreator(player, gameManager.state.gameState.currentRound).create({
            shipId,
            attackLocations: [attackLocation], // FIXME: only single location for now
            commandPointCost: attackingShip.commandPointCost,
        });

        const result = gameEngine.commit.shipAttack(action);

        if (result.type === ResultType.ERROR) return;

        // FIXME: we need a better way to animate ships
        // Ship class should be responsible for their own animations
        const destroyedShips = result.ships.filter((s) => s.destroyed);
        const destoyedShipHullIds = destroyedShips.flatMap((s) => s.hulls).map((h) => h.id);
        const projectile = new Projectile({
            origin: this.origin,
            target: keyToLocation(attackTileId),
            parent: document.querySelector(ANIMATION_LAYER_ID) || undefined,
        });

        animationManager.enqueueMany([
            { animation: new StillAnimation({ elements: getElementsFromIds(destoyedShipHullIds), duration: 500 }) },
            { animation: projectile.createAnimation() },
        ]);

        Object.entries(result.shipsHit).forEach(([hitShipId, hullIds]) => {
            // FIXME: we ignore hitLocations for now
            animationManager.enqueue(new HitAnimation({ id: hitShipId, elements: getElementsFromIds(hullIds) }));
        });

        for (const ship of destroyedShips) {
            const hullIds = ship.hulls.map((h) => h.id);
            animationManager.enqueue(new DestroyedAnimation({ id: ship.id, elements: getElementsFromIds(hullIds) }));
        }

        animationManager.play();

        const gsm = new GameStateManager(gameManager.state.gameState);

        const newState = gsm
            .updateHulls(result.hulls)
            .updateShips(result.ships)
            .updatePlayers(result.players)
            .addAction(action).gameState;

        gameManager.saveCurrentPlayerStateV2({ gameState: newState }, { skipResolve: true });

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
