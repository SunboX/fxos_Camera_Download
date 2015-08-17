'use strict';

// The maximum picture size that camera is allowed to take
const CONFIG_MAX_IMAGE_PIXEL_SIZE = 24 * 1024 * 1024;
const CONFIG_MAX_SNAPSHOT_PIXEL_SIZE = 24 * 1024 * 1024;

// Size of the exif preview embeded in images taken by camera
const CONFIG_REQUIRED_EXIF_PREVIEW_WIDTH = 0;
const CONFIG_REQUIRED_EXIF_PREVIEW_HEIGHT = 0;

// When we generate our own thumbnails, aim for this size. XXX: This should be
// improved to pick a size based on the resolution of our device.
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

// Layout Mode Transition:
// list <-> selection
// list <-> fullscreen <-> edit/crop
// (activity) pick <-> crop
const LAYOUT_MODE = {
    deviceSelect: 'deviceSelectView',
    thumbnails: 'thumbnailView',
    fullscreen: 'fullscreenView'
};

// Pan this % of width to transition from one item to the next
const TRANSITION_FRACTION = 0.25;

// This is the speed of our default transitions in pixels/ms.
// Swipe faster than this to transition faster. But we'll
// never go slower (except slide show transitions).
const TRANSITION_SPEED = 0.75;
