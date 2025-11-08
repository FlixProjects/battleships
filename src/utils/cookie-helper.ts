import { FP_AUTH_TOKEN } from "../../shared";

const getCookies = () => {
    const cookies = {} as Record<string, string>;

    document?.cookie
        ?.split("; ")
        .map((keyValuePair) => {
            const [key, value] = keyValuePair.split("=");
            return { key: key?.trim(), value: value?.trim() };
        })
        .forEach(({ key, value }) => {
            cookies[key] = value;
        });
    return cookies;
};

export const getCookie = (name: string) => {
    const cookies = getCookies();
    return cookies[name];
};

export const deleteAuthCookie = () => {
    // Set expiry to a past date to delete the cookie
    document.cookie = `${FP_AUTH_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=None`;
};
