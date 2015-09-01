'use strict';

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

        downloadImage: function(filedata) {
            this.downloadImages([filedata]);
        },

        downloadImages: function(filedatas) {
            var self = this,
                filedata;
            if (filedatas && filedatas.length) {

                var progress = utils.overlay.show('Downloading Image' + (filedatas.length === 1 ? '' : 's'), 'progressBar');
                progress.setTotal(filedatas.length);

                var progressTotal = [];

                for (var i = 0, iLen = filedatas.length; i < iLen; i++) {
                    filedata = filedatas[i];

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
                    xhr.onprogress = function(filedata, progress, i, e) {
                        if (e.lengthComputable) {
                            var percentComplete = e.loaded / e.total;
                            progressTotal[i] = percentComplete;
                            self.checkIfDownloadIsFinished(filedatas, progressTotal, progress, i);
                        } else {
                            // Unable to compute progress information since the total size is unknown
                        }
                    }.bind(xhr, filedata, progress, i);
                    xhr.onload = function(filedata, progress, i, e) {
                        var blob = xhr.response;
                        try {
                            self.getDeviceStorage(function(storage) {
                                var d = new Date(filedata.date);
                                d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                                var filename = 'photo/' + d.toISOString().slice(0, -5).replace(/[:T]/g, '-') + '.jpg';

                                var saveRequest = storage.addNamed(blob, filename);
                                if (saveRequest !== null) {
                                    saveRequest.onsuccess = (function(filename, i) {
                                        progressTotal[i] = 1;

                                        self.checkIfDownloadIsFinished(filedatas, progressTotal, progress, i);

                                    }).bind(this, filename, i);

                                    saveRequest.onerror = (function(i) {
                                        progressTotal[i] = 1;

                                        //self.notify('Saving the Image failed', saveRequest.error.name);

                                        self.checkIfDownloadIsFinished(filedatas, progressTotal, progress, i);

                                    }).bind(this, i);
                                } else {
                                    progressTotal[i] = 1;

                                    //self.notify('Saving the Image failed', null);

                                    self.checkIfDownloadIsFinished(filedatas, progressTotal, progress, i);
                                }
                            });
                        } catch (e) {
                            //self.notify('Saving the Image failed', e.toString());
                            self.checkIfDownloadIsFinished(filedatas, progressTotal, progress, i);
                        }

                        self.checkIfDownloadIsFinished(filedatas, progressTotal, progress, i);

                    }.bind(xhr, filedata, progress, i);
                    xhr.send();
                }
            }
        },

        checkIfDownloadIsFinished: function(filedatas, progressTotal, progress, i) {
            var sum = progressTotal.reduce(function(a, b) {
                return a + b;
            }, 0);

            progress.update(sum);

            if (sum === filedatas.length) {
                utils.overlay.hide();

                // Vibrate when the image is saved
                navigator.vibrate(100);

                // Display filename in a notification
                if (filedatas.length === 1) {
                    this.notify('Download finished', filename);
                } else {
                    this.notify('Downloads finished', filedatas.length + ' Images saved');
                }
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
                    self.notify('Saving the Image failed', 'No SD-Card');
                } else if (state === 'shared') {
                    navigator.vibrate(100);
                    self.notify('Saving the Image failed', 'SD-Card is in use');
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
                        self.notify('Saving the Image failed', freereq.error && freereq.error.name);
                    }).bind(this);
                }
            }).bind(this);

            availreq.onerror = (function() {
                navigator.vibrate(100);
                self.notify('Saving the Image failed', freereq.error && freereq.error.name);
            }).bind(this);
        },

        notify: function(title, body) {
            var notification = new window.Notification(title, {
                body: body,
                icon: '/style/icons/download_notification.png',
                tag: 'photo:' + (new Date().getTime())
            });

            notification.onclick = function() {
                notification.close();
            };
        }
    };

    exports.ImageDownloader = ImageDownloader;
})(window);
