import { FP_AUTH_TOKEN, parseCookies } from "../../shared";

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
