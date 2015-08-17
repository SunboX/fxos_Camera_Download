'use strict';


//var progress = utils.overlay.show('Downloading Image', 'progressBar');
//progress.setTotal(1);
//progress.update(0.5);

(function(exports) {

    function ImageDownloader() {
        this.triggers = {};
    }

    ImageDownloader.prototype = {

        on: function(event, callback) {
            if (!this.triggers[event]) {
                this.triggers[event] = [];
            }
            this.triggers[event].push(callback);
        },

        trigger: function(event, params) {
            if (this.triggers[event]) {
                for (var i in this.triggers[event]) {
                    this.triggers[event][i](params);
                }
            }
        },

        downloadImages: function(filedatas) {
            //TODO: Implement multi download
        },

        downloadImage: function(filedata) {
            var self = this;
            if (filedata) {

                var progress = utils.overlay.show('Downloading Image', 'progressBar');
                progress.setTotal(1);

                utils.overlay.oncancel = function() {
                    utils.overlay.hide();
                };

                // Try to get the best fitting image link
                var imgLink = filedata.href.linkLRG || filedata.href.linkMED || filedata.href.linkSM || filedata.href.linkTN || filedata.href.linkUnknown;

                var xhr = new XMLHttpRequest({
                    mozSystem: true
                });
                xhr.open('GET', imgLink, true);
                xhr.responseType = 'blob';
                xhr.onprogress = function(filedata, progress, e) {
                    if (e.lengthComputable) {
                        var percentComplete = e.loaded / e.total;
                        progress.update(percentComplete);
                    } else {
                        // Unable to compute progress information since the total size is unknown
                    }
                }.bind(xhr, filedata, progress);
                xhr.onload = function(filedata, progress, e) {
                    var blob = xhr.response;
                    try {
                        self.getDeviceStorage(function(storage) {
                            var d = new Date(filedata.date);
                            d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                            var filename = 'photo/' + d.toISOString().slice(0, -5).replace(/[:T]/g, '-') + '.jpg';

                            var saveRequest = storage.addNamed(blob, filename);
                            saveRequest.onsuccess = (function () {
                                // Vibrate when the image is saved
                                navigator.vibrate(100);

                                // Display filename in a notification
                                self.notify('Photo saved to Gallery', filename);
                            }).bind(this);

                            saveRequest.onerror = (function () {
                                navigator.vibrate(100);
                                self.notify('Saving the photo failed', saveRequest.error.name);
                            }).bind(this);
                        });
                    } catch (e) {
                        navigator.vibrate(100);
                        self.notify('Saving the photo failed', e.toString());
                    }

                    utils.overlay.hide();

                }.bind(xhr, filedata, progress);
                xhr.send();
            }
        },

        getDeviceStorage: function(callback) {
            var self = this,
                storage = navigator.getDeviceStorage('pictures'),
                availreq = storage.available();

            availreq.onsuccess = (function() {
                var state = availreq.result;
                if (state === 'unavailable') {
                    navigator.vibrate(100);
                    self.notify('Saving the photo failed', 'No SD-Card');
                } else if (state === 'shared') {
                    navigator.vibrate(100);
                    self.notify('Saving the photo failed', 'SD-Card is in use');
                } else if (state === 'available') {
                    var freereq = storage.freeSpace();
                    freereq.onsuccess = (function() {
                        //        if (freereq.result < this.MAX_IMAGE_SIZE) {
                        //          //this._notify('Failed', null, 'SDCardLow');
                        //        } else {
                        callback.call(this, storage);
                        //        }
                    }).bind(this);
                    freereq.onerror = (function() {
                        navigator.vibrate(100);
                        self.notify('Saving the photo failed', freereq.error && freereq.error.name);
                    }).bind(this);
                }
            }).bind(this);

            availreq.onerror = (function() {
                navigator.vibrate(100);
                self.notify('Saving the photo failed', freereq.error && freereq.error.name);
            }).bind(this);
        },

        notify: function(title, body) {
            var notification = new window.Notification(title, {
                body: body,
                icon: '/style/icons/Gallery.png',
                tag: 'photo:' + (new Date().getTime())
            });

            notification.onclick = function() {
                notification.close();
            };
        }
    };

    exports.ImageDownloader = ImageDownloader;
})(window);