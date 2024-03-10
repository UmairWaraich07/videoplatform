export function extractPublicIdFromUrl(url) {
    // Regular expression to extract the part between 'upload/' and '.jpg'
    const regex = /upload\/([^/]+)\.jpg/;
    // Match the regular expression with the URL
    const match = url.match(regex);
    // If there's a match, return the captured group, otherwise return null
    return match ? match[1] : null;
}
