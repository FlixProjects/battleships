// Interaction-manager event shapes. These describe the FE InteractionManager's
// input contract, but live in shared/ so domain classes (e.g. Card subclasses)
// can return them from `getSelectionEvent()` without reaching into src/.
//
// The InteractionManager itself stays in src/ — only the message shapes are
// shared. Same boundary pattern as `shared/types/fe-types.ts`.

export const IMEventType = {
    DEPLOYING_SHIP: "Deploying_Ship",
    MOVING_SHIP: "Moving_Ship",
    SELECT_SHIP: "Select_Ship",
    SHIP_ATTACK: "Ship_Attack",
} as const;

export type TIMEventType = (typeof IMEventType)[keyof typeof IMEventType];

export interface IMEvent {
    type: TIMEventType;
    onGlobalDeselect?: () => void;
    onSuccessfulSelect?: () => void;
}

export interface DeployingShipIMEvent extends IMEvent {
    type: typeof IMEventType.DEPLOYING_SHIP;
    shipId: string;
}

export interface MovingShipIMEvent extends IMEvent {
    type: typeof IMEventType.MOVING_SHIP;
    shipId: string;
}

export interface SelectShipActionIMEvent extends IMEvent {
    type: typeof IMEventType.SELECT_SHIP;
    tileId: string;
    hullId: string;
    shipId: string;
    selectableId: string;
}

export interface ShipAttackActionIMEvent extends IMEvent {
    type: typeof IMEventType.SHIP_ATTACK;
    shipId: string;
}
