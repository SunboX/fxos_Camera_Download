'use strict';

(function(exports) {

    var loadCounter = 0;

    function detectTypeByMime(mimeText) {
        var type = mimeText.split('/')[0];
        var format = mimeText.split('/')[1];
        switch (type) {
            case 'audio':
            case 'video':
            case 'image':
                return type;
            case 'application':
                switch (format) {
                    case 'ogg':
                        return 'video';
                    case 'octet-stream':
                        return 'unknown';
                }
                break;
            default:
                return 'unknown';
        }
    }

    function ContentDirectoryManager() {

    }

    ContentDirectoryManager.prototype = {
        serviceName: 'ContentDirectory',
        serviceType: 'upnp:urn:schemas-upnp-org:service:ContentDirectory:1',
        serviceConstructor: Plug.UPnP_ContentDirectory,
        savedServices: {},

        triggers: {},

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

        init: function() {
            this.discover();

            return this;
        },

        appendMixinProperties: function(serviceWrapper) {
            var parser = new DOMParser();
            serviceWrapper.configDocument = parser.parseFromString(serviceWrapper.svc.config, 'text/xml');
            serviceWrapper.friendlyName = serviceWrapper.configDocument.getElementsByTagName('friendlyName')[0].textContent;
        },

        onServices: function(services) {

            services.addEventListener('servicefound', function(e) {
                for (var i = 0; i < services.length; i++) {
                    if (services[i].online) {
                        this.updateService(services[i]);
                    }
                }
            }.bind(this));

            services.addEventListener('servicelost', function(e) {
                for (var i = 0; i < services.length; i++) {
                    if (!services[i].online) {
                        var service = services[i];
                        this.removeService(services[i]);
                    }
                }
            }.bind(this));

            // Remove offline services
            for (var savedServiceId in this.savedServices) {
                var removed = true;
                for (var i = 0; i < services.length; i++) {
                    if (services[i].id == savedServiceId) {
                        removed = false;
                        break;
                    }
                }
                if (removed) {
                    this.remove(savedServiceId);
                }
            }

            // Update services individually
            for (var j = 0; j < services.length; j++) {
                this.updateService(services[j]);
            }
        },

        updateService: function(service) {
            if (!this.savedServices[service.id]) {
                var mediaServer = new this.serviceConstructor(service, {
                    debug: false
                });
                this.appendMixinProperties(mediaServer);
                this.savedServices[service.id] = mediaServer;
                this.trigger('servicefound', mediaServer);
            }
        },

        removeService: function(service) {
            for (var id in this.savedServices) {
                if (service.id === id) {
                    var serviceObj = this.savedServices[service.id];
                    delete this.savedServices[service.id];
                    this.trigger('servicelost', serviceObj);
                }
            }
        },

        removeAllServices: function() {
            this.savedServices = [];
        },

        discover: function() {
            if (navigator.getNetworkServices) {
                navigator.getNetworkServices(this.serviceType)
                    .then(this.onServices.bind(this), function(e) {
                        console.log('An error occurred obtaining UPnP Services [CODE: ' + e.code + ']');
                    });
            } else {
                console.log('navigator.getNetworkServices API is not supported in this browser');
            }
        },

        browseFolder: function(serviceId, folderId) {
            var self = this,
                mediaServer;

            mediaServer = this.savedServices[serviceId];

            if (!mediaServer) {
                return;
            }

            folderId = folderId || '';

            if (!folderId) {
                loadCounter = 0;
            }

            loadCounter++;

            mediaServer.browse(folderId).then(function(response) {

                if (!response || !response.data) {
                    return;
                }

                var data = response.data.Result;
                if (data.indexOf('xmlns:dlna') == -1) {
                    data = data.replace('<DIDL-Lite ',
                            '<DIDL-Lite xmlns:dlna="urn:schemas-dlna-org:device-1-0" ')
                        .replace(/<unknown\>/g, '&lt;unknown&gt;');
                }
                var parser = new DOMParser();
                var serializer = new XMLSerializer();
                var xmlResponse = parser.parseFromString(data, 'application/xml');
                var lists = xmlResponse.documentElement.children;

                for (var i = 0; i < lists.length; i++) {
                    loadCounter++;
                    setTimeout(function(item) {
                        loadCounter--;

                        var titleElem = item.getElementsByTagName('title')[0] ||
                            item.getElementsByTagName('dc:title')[0];
                        var title;
                        if (titleElem) {
                            title = titleElem.textContent;
                        }

                        var dateElem = item.getElementsByTagName('date')[0] ||
                            item.getElementsByTagName('dc:date')[0];
                        var date;
                        if (dateElem) {
                            date = new Date(dateElem.textContent).getTime();
                        }

                        var newElem;
                        if (item.tagName == 'item') {

                            loadCounter++;

                            var linkElem, linkTN, linkSM, linkMED, linkLRG, linkUnknown, protocolSM, protocolLRG, protocolTN, mime;

                            linkElem = item.getElementsByTagName('res');
                            if (linkElem.length) {
                                protocol = linkElem[0].getAttribute('protocolInfo');
                                mime = protocol.split(':')[2];
                                profile = protocol.split(':')[3];
                            }
                            var fileType = detectTypeByMime(mime);

                            for (var i = 0, iLen = linkElem.length; i < iLen; i++) {
                                var protocol = linkElem[i].getAttribute('protocolInfo').split(':');
                                mime = protocol[2];
                                var profile = protocol[3];
                                if (/JPEG_TN/.test(profile)) {
                                    linkTN = linkElem[i].textContent; // tiny
                                } else if (/JPEG_SM/.test(profile)) {
                                    linkSM = linkElem[i].textContent; // small
                                } else if (/JPEG_MED/.test(profile)) {
                                    linkMED = linkElem[i].textContent; // medium
                                } else if (/JPEG_LRG/.test(profile)) {
                                    linkLRG = linkElem[i].textContent; // large
                                } else {
                                    linkUnknown = linkElem[i].textContent; // maybe PNG
                                }
                            }

                            var filedata = {
                                name: title,
                                type: mime,
                                date: date,
                                href: {
                                    linkTN: linkTN,
                                    linkSM: linkSM,
                                    linkMED: linkMED,
                                    linkLRG: linkLRG,
                                    linkUnknown: linkUnknown
                                },
                                metadata: {
                                    type: fileType,
                                    preview: null,
                                    rotation: 0,
                                    mirrored: false
                                }
                            };

                            self.trigger('filefound', filedata);

                            loadCounter--;

                            if (loadCounter === 0) {
                                self.trigger('finishedbrowsing');
                            }
                        } else if (item.tagName == 'container') {

                            self.trigger('folderfound', {
                                title: title
                            });

                            self.browseFolder(serviceId, item.getAttribute('id'));
                        }
                    }.bind(self, lists[i]), i * 100); // Avoid freezing the device
                }

                loadCounter--;

                if (loadCounter === 0) {
                    self.trigger('finishedbrowsing');
                }

            });
        }

    };

    exports.ContentDirectoryManager = ContentDirectoryManager;
})(window);
