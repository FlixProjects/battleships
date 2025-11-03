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
