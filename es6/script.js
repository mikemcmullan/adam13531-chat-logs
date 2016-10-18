import Vue from 'vue';

Vue.use(require('vue-resource'));

if(! String.linkify) {
    String.prototype.linkify = function() {

        // http://, https://, ftp://
        var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

        // www. sans http:// or https://
        var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

        // Email addresses
        var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

        return this
            .replace(urlPattern, '<a href="$&" target="_blank">$&</a>')
            .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
            .replace(emailAddressPattern, '<a href="mailto:$&">$&</a>');
    };
}

const FormatTwitchEmotes = require('./TwitchEmotes').default;
const FormatBTTVEmotes = require('./BTTVEmotes').default;

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

new Vue({
    el: '#app',

    http: {
        root: 'https://api.twitch.mnt.co/adam13531'
    },

    data: {
        state: 'default',
        page: 0,
        logs: [],
        loadingBottom: true,
        loadingTop: false,
        searchKeyword: '',
        oldSearchKeyword: '',

        moreResultsOlder: true,
        moreResultsNewer: true,
        conversationDate: '',
        loadedTime: 0,
        highlight: '',
        dateOptions: {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        }
    },

    computed: {
        formatedLoadTime() {
            const now = new Date();

            return now.toLocaleDateString('en-CA', this.dateOptions);
        },

        isSearch() {
            return this.state === 'search';
        },

        isConversation() {
            return this.state === 'conversation';
        },

        showLoadNewer() {
            if (this.loadingBottom) {
                return false;
            }

            if (this.moreResultsNewer === false) {
                return false;
            }

            return true;
        },

        showLoadOlder() {
            if (this.loadingBottom) {
                return false;
            }

            if (this.moreResultsOlder === false) {
                return false;
            }

            return true;
        }
    },

    ready() {
        this.loadedTime = new Date().toISOString();

        this.twitchEmotes = new FormatTwitchEmotes();
        this.bttvEmotes = new FormatBTTVEmotes();

        this.$el.querySelectorAll('.hide').forEach((elem) => {
            elem.classList.remove('hide');
        });

        this.bttvEmotes.load('adam13531')
            .then(() => {
                this.reset();
            });
    },

    methods: {
        loadOlder() {
            if (this.state === 'default') {
                this.default();
            } else if (this.state === 'search') {
                this.search(true);
            } else if (this.state === 'conversation') {
                this.loadingBottom = true;
                const date = this.logs[this.logs.length-1].created_at;
                const perPage = 100;

                this.$http.get(`chat-logs?page=1&starting-from=${date}&limit=${perPage}`)
                    .then((response) => {
                        this.loadingBottom = false;

                        if (response.data.data.length < perPage) {
                            this.moreResultsOlder = false;
                        }

                        response.data.data.forEach(this._proccessMessage);
                    });
            }
        },

        loadNewer() {
            if (this.state === 'conversation') {
                this.loadingTop = true;
                const date = this.logs[0].created_at;
                const perPage = 100;

                this.$http.get(`chat-logs?page=1&starting-from=${date}&limit=${perPage}&direction=newer`)
                    .then((response) => {
                        this.loadingTop = false;

                        if (response.data.data.length < perPage) {
                            this.moreResultsNewer = false;
                        }

                        const data = response.data.data;

                        data.forEach((message) => {
                            if (message.emotes !== null) {
                                message.message = this.twitchEmotes.formatMessage(message.message, message.emotes);
                            }

                            message.message = this.bttvEmotes.formatMessage(message.message);
                            message.message = htmlEntities(message.message);
                            message.message = this.bttvEmotes.replacePlaceholders(message.message);
                            message.message = this.twitchEmotes.replacePlaceholders(message.message);
                            message.highlight = message.id === this.highlight.id ? true : false;
                            message.message = message.message.linkify();

                            this.logs.unshift(message);
                        });

                    });
            }
        },
        reset(loadDefault = true) {
            this.state = 'default';
            this.page = 0;
            this.searchKeyword = '';
            this.oldSearchKeyword = '';
            this.conversationDate = '';
            this.highlight = '';
            this.logs = [];

            this.moreResultsNewer = false;
            this.moreResultsOlder = false;

            if (loadDefault) {
                this.default();
            }
        },

        default() {
            this.loadingBottom = true;
            this.state = 'default';
            this.moreResultsOlder = true;

            const perPage = 500;

            this.$http.get(`chat-logs?page=${++this.page}&starting-from=${this.loadedTime}&limit=${perPage}&direction=older`)
                .then((response) => {
                    this.loadingBottom = false;

                    if (response.data.data.length < perPage) {
                        this.moreResultsOlder = false;
                    }

                    response.data.data.forEach(this._proccessMessage);
                });
        },

        search(loadingMore = false) {
            // Is this the first or a new search.
            if (this.state !== 'search' || this.oldSearchKeyword !== this.searchKeyword) {
                this.page = 0;
                this.logs = [];
            }

            // The search button was pushed without the query changing.
            if (this.oldSearchKeyword === this.searchKeyword && loadingMore === false) {
                return;
            }

            this.loadingBottom = true;
            this.state = 'search';
            this.highlight = '';
            this.oldSearchKeyword = this.searchKeyword;

            const perPage = 100;

            this.$http.get(`chat-logs/search?page=${++this.page}&term=${this.searchKeyword}&limit=${perPage}`)
                .then((response) => {
                    this.loadingBottom = false;

                    if (response.data.data.length < perPage) {
                        this.moreResultsOlder = false;
                    }

                    response.data.data.forEach(this._proccessMessage);
                });
        },

        conversation(message) {
            this.reset(false);

            this.state = 'conversation';
            this.highlight = message;
            this.loadingBottom = true;
            this.moreResultsOlder = true;
            this.moreResultsNewer = true;

            this.$http.get(`chat-logs/conversation?date=${message.created_at}`)
                .then((response) => {
                    this.loadingBottom = false;

                    response.data.data.forEach(this._proccessMessage);
                });
        },

        _proccessMessage(message) {
            if (message.emotes !== null) {
                message.message = this.twitchEmotes.formatMessage(message.message, message.emotes);
            }

            message.message = this.bttvEmotes.formatMessage(message.message);
            message.message = htmlEntities(message.message);
            message.message = this.bttvEmotes.replacePlaceholders(message.message);
            message.message = this.twitchEmotes.replacePlaceholders(message.message);
            message.highlight = message.id === this.highlight.id ? true : false;
            message.message = message.message.linkify();

            this.logs.push(message);
        },

        formatDisplayDate(date) {
            const createdAt = new Date(date);
            const local = new Date(createdAt.getTime() - createdAt.getTimezoneOffset() * 60000);

            return local.toLocaleDateString('en-CA', this.dateOptions);
        }
    }
});
