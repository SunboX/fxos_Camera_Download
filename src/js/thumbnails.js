'use strict';

(function(exports) {

    function Thumbnails(container, fileHandler) {
        this.container = container;
        this.fileHandler = fileHandler;
        this.triggers = {};

        fileHandler.on('fileadded', this.addFile.bind(this));
        fileHandler.on('allremoved', this.removeAll.bind(this));

        // Handle clicks on the thumbnails
        this.container.addEventListener('click', this.thumbnailClickHandler.bind(this));
    }

    Thumbnails.prototype = {

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

        addFile: function(filedata) {

            // Check if there's already a category with this date
            var category = this.getCategory(filedata);
            if (category === null) {
                // Create a new category
                category = this.createCategory(filedata);

                // Try to find a category we have to append this before
                var insertBeforeCategory = this.getCategoryAfter(filedata);

                if (insertBeforeCategory === null) {
                    this.container.appendChild(category);
                } else {
                    this.container.insertBefore(category, insertBeforeCategory);
                }
            }
            var thumbnailGroup = category.querySelector('.thumbnail-group-container');

            // Create a new thumbnail for this filedata
            var thumbnail = this.createThumbnail(filedata);

            // Try to find a thumbnail we have to append this before
            var insertBeforeThumbnail = this.getThumbnailAfter(filedata, thumbnailGroup);

            if (insertBeforeThumbnail === null) {
                thumbnailGroup.appendChild(thumbnail);
            } else {
                try {
                    thumbnailGroup.insertBefore(thumbnail, insertBeforeThumbnail);
                } catch (ex) {
                    thumbnailGroup.appendChild(thumbnail);
                }
            }
        },

        thumbnailClickHandler: function(evt) {
            var target = evt.target;
            if (!target) {
                return;
            }

            // Handle tap for clicks in gray area of containing div
            // for thumbnail images smaller than thumbnail container.
            target = target.classList.contains('thumbnail') ? target.firstElementChild : target;

            if (!target || !target.classList.contains('thumbnailImage')) {
                return;
            }

            this.trigger('thumbnailclick', {
                filename: target.dataset.filename
            });
        },

        getThumbnailAfter: function(filedata, category) {
            var thumbnails = category.querySelectorAll('.thumbnail');
            for (var thumbnail of thumbnails) {
                if (thumbnail.dataset.date < filedata.date) {
                    return thumbnail;
                }
            }
            return null;
        },

        createThumbnail: function(filedata) {

            // Check if there's already a thumbnail image loaded
            if (filedata.metadata.thumbnail) {
                var thumbnailWrapper = document.createElement('div');
                thumbnailWrapper.className = 'thumbnail-wrapper';
                var thumbnail = new ThumbnailItem(filedata);
                thumbnail.htmlNode.dataset.date = filedata.date;
                thumbnailWrapper.appendChild(thumbnail.htmlNode);

                var checkbox = document.createElement('label');
                checkbox.className = 'pack-checkbox';
                var checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkbox.appendChild(checkboxInput);
                var checkboxSpan = document.createElement('span');
                checkbox.appendChild(checkboxSpan);

                thumbnailWrapper.appendChild(checkbox);

                return thumbnailWrapper;
            }
            // If not, create a placeholder with loading indicator
            // and try to download and create the thumbnail image
            else {
                var thumbnailPlaceholder = document.createElement('div');
                thumbnailPlaceholder.role = 'button';
                thumbnailPlaceholder.className = 'thumbnail-wrapper';
                thumbnailPlaceholder.dataset.date = filedata.date;

                var progress = document.createElement('progress');
                thumbnailPlaceholder.appendChild(progress);

                this.loadThumbnail(filedata, function(placeholder, filedata) {
                    var thumbnail = this.createThumbnail(filedata);
                    if (placeholder.parentNode) {
                        placeholder.parentNode.replaceChild(thumbnail, placeholder);
                    }
                }.bind(this, thumbnailPlaceholder));

                return thumbnailPlaceholder;
            }
        },

        // Make the thumbnail for image n visible
        scrollToShowThumbnail: function(filedata) {
            if (!filedata) {
                return;
            }
            var selector = 'img[data-filename="' + filedata.name + '"]';
            var thumbnail = this.container.querySelector(selector);
            if (thumbnail) {
                var screenTop = this.container.scrollTop;
                var screenBottom = screenTop + this.container.clientHeight;
                var thumbnailTop = thumbnail.offsetTop;
                var thumbnailBottom = thumbnailTop + thumbnail.offsetHeight;
                var toolbarHeight = 40; // compute this dynamically?

                // Adjust the screen bottom up to be above the overlaid footer
                screenBottom -= toolbarHeight;

                if (thumbnailTop < screenTop) { // If thumbnail is above screen
                    this.container.scrollTop = thumbnailTop; // scroll up to show it.
                } else if (thumbnailBottom > screenBottom) { // If thumbnail is below screen
                    this.container.scrollTop = thumbnailBottom - this.container.clientHeight + toolbarHeight; // scroll  down to show it
                }
            }
        },

        loadThumbnail: function(filedata, callback) {

            // Try to get the best fitting image link
            var imgLink = filedata.href.linkSM || filedata.href.linkMED || filedata.href.linkTN || filedata.href.linkLRG || filedata.href.linkUnknown;

            var xhr = new XMLHttpRequest({
                mozSystem: true
            });
            xhr.open('GET', imgLink, true);
            xhr.responseType = 'blob';
            xhr.onload = function(filedata, e) {
                var blob = xhr.response;

                var done1 = function(metadata) {
                    filedata.metadata = metadata;

                    var rotation = metadata.rotation;
                    var mirrored = metadata.mirrored;

                    // If a orientation is specified, rotate/mirroring the canvas context.
                    if (rotation || mirrored) {

                        var img = new Image(),
                            url = URL.createObjectURL(blob);

                        img.onload = function() {
                            // no longer need to read the blob so it's revoked
                            URL.revokeObjectURL(url);

                            // Rotate and flip thumbnail image
                            var canvas = document.createElement('canvas');
                            canvas.width = this.width;
                            canvas.height = this.height;
                            var context = canvas.getContext('2d', {
                                willReadFrequently: true
                            });

                            var centerX = Math.floor(this.width / 2);
                            var centerY = Math.floor(this.height / 2);

                            context.save();
                            // All transformation are applied to the center of the thumbnail.
                            context.translate(centerX, centerY);

                            if (mirrored) {
                                context.scale(-1, 1);
                            }
                            if (rotation) {
                                switch (rotation) {
                                    case 90:
                                        context.rotate(Math.PI / 2);
                                        break;
                                    case 180:
                                        context.rotate(Math.PI);
                                        break;
                                    case 270:
                                        context.rotate(-Math.PI / 2);
                                        break;
                                }
                            }

                            context.translate(-centerX, -centerY);

                            // Draw that region of the image into the canvas, scaling it down
                            context.drawImage(img, 0, 0, this.width, this.height, 0, 0, this.width, this.height);

                            // Restore the default rotation so the play arrow comes out correctly
                            context.restore();

                            canvas.toBlob(function(blob) {
                                context = null;
                                canvas.width = canvas.height = 0;
                                canvas = null;

                                done2(blob);

                            }, 'image/jpeg');
                        };

                        img.src = url;

                    } else {
                        done2(blob);
                    }
                };

                var done2 = function(blob) {
                    ImageUtils.resizeAndCropToCover(
                        blob,
                        THUMBNAIL_WIDTH,
                        THUMBNAIL_HEIGHT,
                        filedata.type,
                        1.0
                    ).then(function(thumbnailBlob) {

                        filedata.metadata.thumbnail = thumbnailBlob;

                        callback(filedata);
                    });
                };

                parseJpegMetadata(blob, function(metadata) {
                    metadata.blob = blob;

                    if (!metadata.preview) {
                        done1(metadata);
                        return;
                    }

                    // If we found an EXIF preview,
                    // and can determine its size, then
                    // we can display it instead of the
                    // big image and save memory and time.
                    var start = metadata.preview.start;
                    var end = metadata.preview.end;
                    var previewBlob = blob.slice(start, end, 'image/jpeg');
                    parseJpegMetadata(previewBlob, onSuccess, onError);

                    // If we parsed the preview image, add its
                    // dimensions to the metadata.preview
                    // object, and then let the MediaFrame
                    // object display the preview instead of
                    // the full-size image.
                    function onSuccess(previewMetadata) {
                        metadata.preview.width = previewMetadata.width;
                        metadata.preview.height = previewMetadata.height;
                        done1(metadata);
                    }

                    // If we couldn't parse the preview image,
                    // just display full-size.
                    function onError() {
                        done1(metadata);
                    }
                }, function(error) {
                    console.log('Error parsing JPEG Metadata: ' + imgLink);

                    callback(filedata);
                });

            }.bind(xhr, filedata);
            xhr.send();
        },

        getCategory: function(filedata) {
            var date = new Date(filedata.date);
            var dateStr = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
            var category = document.getElementById('category-' + dateStr);
            return !!category ? category : null;
        },

        getCategoryAfter: function(filedata) {
            var categories = this.container.querySelectorAll('li');
            for (var category of categories) {
                if (category.dataset.date < filedata.date) {
                    return category;
                }
            }
            return null;
        },

        createCategory: function(filedata) {
            // Create category based on file date
            var date = new Date(filedata.date);
            var dateStr = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();

            var category = document.createElement('li');
            category.dataset.date = filedata.date;
            category.id = 'category-' + dateStr;

            var checkbox = document.createElement('label');
            checkbox.className = 'pack-checkbox thumbnail-group-header';
            var checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkbox.appendChild(checkboxInput);
            var checkboxSpan = document.createElement('span');
            checkboxSpan.textContent = dateStr;
            checkbox.appendChild(checkboxSpan);
            category.appendChild(checkbox);

            checkboxInput.onchange = this.setCheckboxesOfCategory.bind(this, checkboxInput, category);

            var thumbnailGroupContainer = document.createElement('div');
            thumbnailGroupContainer.className = 'thumbnail-group-container';
            category.appendChild(thumbnailGroupContainer);

            return category;
        },

        setCheckboxesOfCategory: function(checkbox, category, e) {
            var state = checkbox.checked,
                thumbnailCheckboxes = category.querySelectorAll('.thumbnail-wrapper .pack-checkbox input');
            for (var thumbnailCheckbox of thumbnailCheckboxes) {
                thumbnailCheckbox.checked = state;
            }
        },

        getAllCheckedFiles: function() {
            var thumbnails = this.container.querySelectorAll('.thumbnail-wrapper'),
                image, checkbox, files = [];
            for (var thumbnail of thumbnails) {
                image = thumbnail.querySelector('.thumbnailImage');
                checkbox = thumbnail.querySelector('.pack-checkbox input');
                if (!image || !checkbox || !checkbox.checked) {
                    continue;
                }
                files.push(this.fileHandler.getFileByName(image.dataset.filename));
            }
            return files;
        },

        removeAll: function() {
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
        }

    };

    exports.Thumbnails = Thumbnails;
})(window);
