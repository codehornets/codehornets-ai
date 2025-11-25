


export function createPageUrl(pageName: string) {
    // Routes are defined with exact page names (e.g., /Dashboard, /Agents)
    // No need to convert to lowercase
    return '/' + pageName;
}