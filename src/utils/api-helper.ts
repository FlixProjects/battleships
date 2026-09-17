export const sortQueries = (queries?: Record<string, string>) => {
    if (!queries) {
        return undefined;
    }
    const sorted = Object.entries(queries).sort(([a], [b]) => a.localeCompare(b));
    return new URLSearchParams(sorted).toString() || "";
};
