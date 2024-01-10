/**
 * This file takes care of calculating the frames per second (FPS) of a video.
 * The algorithm is based on monitoring the time difference and frame number difference
 * to estimate the FPS at which the video is being played.
 */

// Most of the code is useless, i left it here in case the current version does not work corectly
// This var controls the number of frames over witch the fps is calculated 

var number_of_franes = 1;

var last_media_time, last_frame_num;
var fps_rounder = [];

// Flag to indicate if a seek operation has occurred
var frame_not_seeked = true;

// Callback function for requesting video frame updates
function ticker(useless, metadata) {
    // Calculate the difference in media time and frame number
    var media_time_diff = Math.abs(metadata.mediaTime - last_media_time);
    var frame_num_diff = Math.abs(metadata.presentedFrames - last_frame_num);

    // Calculate the time difference per frame
    var diff = media_time_diff / frame_num_diff;

    // Check conditions for valid frame time calculation
    if (
        diff &&
        diff < 1 &&
        frame_not_seeked &&
        video.playbackRate === 1 &&
        document.hasFocus()
    ) {
        // Store the calculated frame time difference
        fps_rounder.push(diff);

        // Calculate and display the rounded FPS along with certainty
        fps = Math.round(1 / get_fps_average());
    }

    // Reset the seeked flag and update previous media time and frame number
    frame_not_seeked = true;
    last_media_time = metadata.mediaTime;
    last_frame_num = metadata.presentedFrames;

    if(fps_rounder.length < number_of_franes+ 1)
    {
        // Request the next video frame update
        video.requestVideoFrameCallback(ticker);
    }
}

function init_calculation()
{
    fps_rounder = [];
    frame_not_seeked = true;

    // Initialize the ticker by requesting the first video frame update
    video.requestVideoFrameCallback(ticker);

}

function get_fps_average() {
    return fps_rounder.reduce((a, b) => a + b) / fps_rounder.length;
}
