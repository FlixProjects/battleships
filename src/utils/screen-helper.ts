import { FP_APP_SCREEN } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { TAppScreen } from "@shared/types";

// Screen routing lives in its own sessionStorage key (not in the per-player
// app state): GameManager keys saves by player id, which doesn't exist yet on
// the Login/Lobby screens. updateComponents() injects this into IAppState.

const isAppScreen = (value: string): value is TAppScreen => {
    return Object.values<string>(GameConfig.AppScreen).includes(value);
};

export const getAppScreen = (): TAppScreen => {
    const stored = sessionStorage.getItem(FP_APP_SCREEN);

    if (stored && isAppScreen(stored)) {
        return stored;
    }

    return GameConfig.AppScreen.Login;
};

export const setAppScreen = (screen: TAppScreen) => {
    sessionStorage.setItem(FP_APP_SCREEN, screen);
};
