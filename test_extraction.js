const extractVideoId_AddVideoSheet = (inputUrl) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = inputUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const failingUrl = "https://www.youtube.com/watch?time_continue=164&v=1hQLp2Cl49Q&embeds_referring_euri=http%3A%2F%2Flocalhost%3A5173%2F&embeds_referring_origin=http%3A%2F%2Flocalhost%3A5173&source_ve_path=MjM4NTE";
const workingUrl = "https://www.youtube.com/watch?time_continue=53&v=1hQLp2Cl49Q&embeds_referring_euri=http%3A%2F%2Flocalhost%3A5173%2F&embeds_referring_origin=http%3A%2F%2Flocalhost%3A5173&source_ve_path=MjM4NTE";

console.log("AddVideoSheet Failing URL Extraction:", extractVideoId_AddVideoSheet(failingUrl));
console.log("AddVideoSheet Working URL Extraction:", extractVideoId_AddVideoSheet(workingUrl));
