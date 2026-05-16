import * as Styles from "./models/index";

export const loadStyles = () => {
    try {
        Object.values(Styles).forEach((Style) => new Style().load());
    } catch (error) {
        console.warn("Some styles failed to load");
    }
};
