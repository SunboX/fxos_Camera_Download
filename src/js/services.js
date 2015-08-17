'use strict';

(function(exports) {

    function Services(container) {
        this.container = container;
        this.triggers = {};
    }

    Services.prototype = {

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

        addService: function(service) {
            var self = this,
                serviceItem = this.createServiceItem(service);

            serviceItem.addEventListener('click', function(e) {
                self.trigger('serviceclick', {
                    serviceId: this.dataset.svcId
                });
            });

            this.container.appendChild(serviceItem);
        },

        removeService: function(service) {
            var svcEntries = this.container.querySelectorAll('li');
            for (var entry of svcEntries) {
                if (entry.dataset.svcId === service.svc.id && entry.parentElement) {
                    entry.parentElement.removeChild(entry);
                }
            }
        },

        createServiceItem: function(service) {
            var iconUrl = this.getIconUrl(service);

            var listItem = document.createElement('li');
            listItem.dataset.svcId = service.svc.id;
            var menuItem = document.createElement('a');
            menuItem.classList.add('menu-item');
            menuItem.dataset.svcId = service.svc.id;
            var span = document.createElement('span');
            var small = document.createElement('small');
            small.classList.add('menu-item-desc');
            span.textContent = service.friendlyName;

            if (iconUrl !== null) {
                var svcUrl = URI.parse(service.svcUrl);

                if (iconUrl.textContent.charAt(0) === '/') {
                    svcUrl.parts.pathname = iconUrl.textContent;
                } else {
                    svcUrl.parts.pathname =
                        svcUrl.parts.pathname.substr(0, svcUrl.parts.pathname.lastIndexOf('/') + 1) + iconUrl.textContent;
                }

                var iconEl = document.createElement('div');
                iconEl.classList.add('icon');
                iconEl.style.backgroundImage = 'url("' + svcUrl.toString() + '")';
                menuItem.appendChild(iconEl);
                // .menu-item:has(.icon) is only available in CSS4
                menuItem.style.MozPaddingStart = '5.5rem';
            }

            menuItem.appendChild(span);
            menuItem.appendChild(small);
            listItem.appendChild(menuItem);

            return listItem;
        },

        getIconUrl: function(service) {
            var icon = service.configDocument.getElementsByTagName('icon')[0];
            if (icon) {
                return icon.getElementsByTagName('url')[0];
            }
            return null;
        },

        removeAll: function() {
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
        }
    };

    exports.Services = Services;
})(window);
