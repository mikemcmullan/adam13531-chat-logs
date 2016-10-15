'use strict';

if (!String.linkify) {
    String.prototype.linkify = function () {

        // http://, https://, ftp://
        var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

        // www. sans http:// or https://
        var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

        // Email addresses
        var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

        return this.replace(urlPattern, '<a href="$&">$&</a>').replace(pseudoUrlPattern, '$1<a href="http://$2">$2</a>').replace(emailAddressPattern, '<a href="mailto:$&">$&</a>');
    };
}

new Vue({
    el: '#app',

    http: {
        root: 'https://api.twitch.mnt.co/adam13531'
    },

    data: {
        logs: [],
        loading: true,
        currentPage: 1,
        noMoreResults: false,
        loadedTimestamp: 0,
        dateOptions: {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        }
    },

    computed: {
        formatedLoadTime: function formatedLoadTime() {
            var now = new Date();

            return now.toLocaleDateString('en-CA', this.dateOptions);
        }
    },

    ready: function ready() {
        var _this = this;

        this.loadedTimestamp = Math.floor(Date.now() / 1000);

        this.twitchEmotes = new FormatTwitchEmotes();
        this.bttVEmotes = new FormatBTTVEmotes();

        this.bttVEmotes.load('adam13531').then(function () {
            _this.getPage(1);
        });
    },


    methods: {
        loadMore: function loadMore() {
            this.loading = true;
            this.getPage(this.currentPage);
        },
        getPage: function getPage(page) {
            var _this2 = this;

            if (this.noMoreResults) {
                this.loading = false;
                return;
            }

            this.$http.get('chat-logs?page=' + page + '&starting-from=' + this.loadedTimestamp).then(function (response) {
                _this2.loading = false;

                if (response.data.data.length === 0) {
                    _this2.noMoreResults = true;
                    return;
                }

                _this2.currentPage += 1;
                _this2.$els.loop.className = '';

                response.data.data.forEach(function (message) {
                    var createdAt = new Date(message.created_at);
                    var local = new Date(createdAt.getTime() - createdAt.getTimezoneOffset() * 60000);

                    message.created_at = '' + local.toLocaleDateString('en-CA', _this2.dateOptions);

                    message.message = message.message.linkify();

                    if (message.emotes !== null) {
                        message.message = _this2.twitchEmotes.formatMessage(message.message, message.emotes);
                    }

                    message.message = _this2.bttVEmotes.formatMessage(message.message);

                    _this2.logs.push(message);
                });
            });
        }
    }
});
