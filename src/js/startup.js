'use strict';

var currentView;
var fullscreenView;
var currentSvcId;
var fileHandler = new FileHandler();

setView(LAYOUT_MODE.deviceSelect);

var deviceLoadingIndicator = $('device-loading-indicator');
var thumbnailLoadingIndicator = $('throbber');

var contentDirectoryManager = new ContentDirectoryManager();
var services = new Services($('device-list'));
var thumbnails = new Thumbnails($('thumbnails'), fileHandler);
var imageDownloader = new ImageDownloader();

thumbnails.on('thumbnailclick', function(e) {
    fileHandler.setCurrentFileByName(e.filename);
    setView(LAYOUT_MODE.fullscreen);
    showFile(fileHandler.getCurrentIndex());
});

services.on('serviceclick', function(e) {
    thumbnailLoadingIndicator.hidden = false;
    setView(LAYOUT_MODE.thumbnails);
    currentSvcId = e.serviceId;
    contentDirectoryManager.browseFolder(currentSvcId);
});

contentDirectoryManager.on('servicefound', function(service) {
    deviceLoadingIndicator.hidden = true;
    services.addService(service);
});

contentDirectoryManager.on('servicelost', services.removeService.bind(services));

contentDirectoryManager.init();

fullscreenView = $('fullscreen-view');

contentDirectoryManager.on('filefound', fileHandler.addFile.bind(fileHandler));

contentDirectoryManager.on('finishedbrowsing', function() {
    thumbnailLoadingIndicator.hidden = true;
});

var devicesReloadButton = $('devices-reload-button-tiny');
devicesReloadButton.onclick = function() {
    contentDirectoryManager.removeAllServices();
    services.removeAll();
    contentDirectoryManager.discover();
    deviceLoadingIndicator.hidden = false;
};

var thumbnailReloadButton = $('thumbnail-reload-button-tiny');
thumbnailReloadButton.onclick = function() {
    fileHandler.removeAll();
    contentDirectoryManager.browseFolder(currentSvcId);
    thumbnailLoadingIndicator.hidden = false;
};

var thumbnailBackButton = $('back-to-device-selection');
thumbnailBackButton.onclick = function() {
    setView(LAYOUT_MODE.deviceSelect);
    fileHandler.removeAll();
};

var fullscreenBackButton = $('fullscreen-back-button-tiny');
fullscreenBackButton.onclick = setView.bind(null, LAYOUT_MODE.thumbnails);

var fullscreenDownloadButton = $('fullscreen-download-button-tiny');
fullscreenDownloadButton.addEventListener('click', function() {
    imageDownloader.downloadImage(fileHandler.getCurrentFile());
});

function setView(view) {
    if (currentView === view) {
        return;
    }
    // define each view's layout based on data-view of body
    document.body.classList.remove(currentView);
    document.body.classList.add(view);
    // Do any necessary cleanup of the view we're exiting
    switch (currentView) {
        case LAYOUT_MODE.fullscreen:
            // Clear the frames to release the memory they're holding and
            // so that we don't see a flash of the old image when we return
            // to fullscreen view
            clearFrames();
            break;
    }
    switch (view) {
        case LAYOUT_MODE.thumbnails:
            thumbnails.scrollToShowThumbnail(fileHandler.getCurrentFile());
            break;
        case LAYOUT_MODE.fullscreen:
            resizeFrames();
            break;
    }
    // Remember the current view
    currentView = view;
}
