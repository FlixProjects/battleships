import { appConfig } from "../config/app-config";

export const createGame = async () => {
  try {
    const res = await fetch(`${appConfig.apiBaseUrl}/create`, { method: "POST" });
    const data = await res.json();
    const { code, playerId } = data;
    return { code, playerId}
  } catch (err) {
    console.error(err);
  }
};
