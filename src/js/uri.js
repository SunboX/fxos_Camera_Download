(function(exports) {

    'use strict';

    /**
     * Class for parsing and generating URI's.
     *
     * @class
     *
     * @param  {object} parts - Parts of an URI
     *
     * @param  {string=} parts.protocol - Defaults to protocol relative url //
     * @param  {string=} parts.username
     * @param  {string=} parts.password
     * @param  {string} parts.hostname
     * @param  {string=} parts.port
     * @param  {string} parts.pathname
     * @param  {string|object} [parts.query]
     * @param  {string=} parts.hash
     *
     * @example
     * var uri = new URI({
     *     protocol: 'http',
     *     username: 'user',
     *     password: 'pass',
     *     hostname: 'example.org',
     *     port: '80',
     *     pathname: '/foo/bar.html',
     *     query: 'foo=bar&bar=baz',
     *     hash: 'frag'
     * });
     */
    var URI = function(parts) {
        this.parts = parts || {};

        /**
         * Build a URL.
         *
         * @private
         * @function
         *
         * @return {string} The new URL as string.
         */
        this.toString = function() {
            var query,
                parts = this.parts,
                result;

            if (parts.protocol) {
                result = parts.protocol + '://';
            } else {
                result = '//'; // No protocoll, use the Protocol-relative URL
            }

            if (parts.username) {
                result += parts.username + ':' + parts.password + '@';
            }

            result += parts.hostname;
            if (parts.port) {
                result += ':' + parts.port;
            }

            result += (parts.pathname.charAt(0) === '/' ? '' : '/') + parts.pathname;

            if (parts.query) {
                if ('object' === typeof parts.query) {
                    query = JSON.stringify(parts.query);
                } else {
                    query = parts.query;
                }
                result += (query.charAt(0) === '?' ? '' : '?') + query;
            }

            if (parts.hash) {
                result += parts.hash;
            }

            return result;
        };
    };

    /**
     * Parse a URL and return its components as new URI instance.
     *
     * @name parse
     * @private
     * @function
     * @static
     * @memberof URI
     *
     * @param {string} str - The URL to parse.
     *
     * @return {vp.Webservice.URI} New URI instance.
     */
    var parseUri = function(str) {
        var o = parseUri.options,
            m = (o.strictMode ? o.parser.strict : o.parser.loose).exec(str),
            uri = {},
            i = 14;

        while (i--) {
            uri[o.key[i]] = m[i] || '';
        }

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function($0, $1, $2) {
            if ($1) {
                uri[o.q.name][$1] = $2;
            }
        });

        return new URI(uri);
    };

    parseUri.options = {
        strictMode: false,
        key: [
            'source',
            'protocol',
            'authority',
            'userInfo',
            'username',
            'password',
            'hostname',
            'port',
            'relative',
            'pathname',
            'directory',
            'file',
            'query',
            'hash'
        ],
        q: {
            name: 'queryKey',
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };

    /**
     * Generate URL-encoded query string.
     *
     * @private
     * @function
     * @static
     * @memberof URI
     *
     * @param {object} obj - The object to be URL-encoded.
     * @param {string=} prefix - Prefix each parameter should be wrapped with.
     *
     * @return {string} The new query as string.
     */
    var serialize = function(obj, prefix) {
        var str = [];
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                var k = prefix ? prefix + '[' + p + ']' : p,
                    v = obj[p];
                str.push(typeof v === 'object' ?
                    serialize(v, k) :
                    encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        }
        return str.join('&');
    };

    // static

    URI.parse = parseUri;
    URI.serialize = serialize;

    exports.URI = URI;

})(window);
