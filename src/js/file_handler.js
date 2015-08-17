'use strict';

(function(exports) {

    function FileHandler(container) {
        this.files = [];
        this.triggers = {};
        this.currentFileIndex = -1;
    }

    FileHandler.prototype = {

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
            if (!filedata) {
                throw new Error('filedata should not be null or undefined.');
            }

            // Only process JPEG's by now
            if (filedata.type !== 'image/jpeg') {
                return;
            }

            // Store file
            this.files.push(filedata);

            // Sort all files by date
            this.files.sort(this.sortByDate);

            this.trigger('fileadded', filedata);
        },

        getCurrentIndex: function() {
            return this.currentFileIndex;
        },

        getCurrentFile: function() {
            if (this.currentFileIndex === -1) {
                return null;
            }
            return this.files[this.currentFileIndex];
        },

        getFileByIndex: function(index) {
            if (this.isInRange(index)) {
                return this.files[index];
            }
            return null;
        },

        getFiles: function() {
            return this.files;
        },

        setCurrentFileByName: function(filename) {
            for (var i = 0, iLen = this.files.length; i < iLen; i++) {
                if (this.files[i].name === filename) {
                    return this.currentFileIndex = i;
                }
            }
            return this.currentFileIndex = -1;
        },

        setCurrentFileByIndex: function(index) {
            if (this.isInRange(index)) {
                return this.currentFileIndex = index;
            }
            return this.currentFileIndex = -1;
        },

        isInRange: function(index) {
            return index >= 0 && index < this.files.length;
        },

        isFirstFile: function() {
            return this.currentFileIndex === 0;
        },

        isLastFile: function() {
            return this.currentFileIndex === this.files.length - 1;
        },

        hasNextFile: function() {
            return this.currentFileIndex < this.files.length - 1;
        },

        hasPrevFile: function() {
            return this.currentFileIndex > 0;
        },

        sortByDate: function(a, b) {
            if (a.date < b.date) {
                return 1;
            }
            if (a.date > b.date) {
                return -1;
            }
            return 0;
        },

        removeAll: function() {
            this.files = [];
            this.trigger('allremoved');
        }

    };

    exports.FileHandler = FileHandler;
})(window);
