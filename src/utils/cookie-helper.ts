import { FP_AUTH_TOKEN } from "@shared/constants";
import { parseCookies } from "@shared/utils";

const getCookies = () => {
    return parseCookies(document?.cookie);
};

export const getCookie = (name: string) => {
    const cookies = getCookies();
    return cookies[name];
};

export const deleteAuthCookie = () => {
    // Set expiry to a past date to delete the cookie
    document.cookie = `${FP_AUTH_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=None`;
};

export const clearCookies = () => {
    // there is no bulk api — document.cookie sets one at a time, and only ever
    // lists non-HttpOnly cookies, so this cannot touch the prod auth token
    for (const pair of document.cookie.split("; ")) {
        const name = pair.split("=")[0]?.trim();

        if (name) {
            // deletion matches on (name, domain, path); everything here is set at the root
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
    }
};
