export function extractPublicIdFromUrl(url) {
    // Regular expression to extract the part between 'upload/' and '.jpg'
    const regex = /upload\/([^/]+)\.jpg/;
    // Match the regular expression with the URL
    const match = url.match(regex);
    // If there's a match, return the captured group, otherwise return null
    return match ? match[1] : null;
}

export function convertToYouTubeDuration(durationInSeconds) {
    // Convert duration to hours, minutes, and seconds
    let hours = Math.floor(durationInSeconds / 3600);
    let minutes = Math.floor((durationInSeconds % 3600) / 60);
    let seconds = Math.floor(durationInSeconds % 60);

    // Format the duration
    let formattedDuration = "";

    if (hours > 0) {
        formattedDuration += hours.toString().padStart(2, "0") + ":";
    }

    formattedDuration += minutes.toString().padStart(2, "0") + ":";
    formattedDuration += seconds.toString().padStart(2, "0");

    return formattedDuration;
}
