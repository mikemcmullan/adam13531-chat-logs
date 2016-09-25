if(! String.linkify) {
    String.prototype.linkify = function() {

        // http://, https://, ftp://
        var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

        // www. sans http:// or https://
        var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

        // Email addresses
        var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

        return this
            .replace(urlPattern, '<a href="$&">$&</a>')
            .replace(pseudoUrlPattern, '$1<a href="http://$2">$2</a>')
            .replace(emailAddressPattern, '<a href="mailto:$&">$&</a>');
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
            minute: '2-digit'
        }
    },

    computed: {
        formatedLoadTime() {
            const now = new Date();

            return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())
                .toLocaleDateString('en-CA', this.dateOptions) + ' UTC';
        }
    },

    ready() {
        this.loadedTimestamp = Math.floor(Date.now() / 1000);

        this.twitchEmotes = new FormatTwitchEmotes();
        this.bttVEmotes = new FormatBTTVEmotes();

        this.bttVEmotes.load('adam13531')
            .then(() => {
                this.getPage(1);
            });
    },

    methods: {
        loadMore() {
            this.loading = true;
            this.getPage(this.currentPage);
        },

        getPage(page) {
            if (this.noMoreResults) {
                this.loading = false;
                return;
            }

            this.$http.get(`chat-logs?page=${page}&starting-from=${this.loadedTimestamp}`)
                .then((response) => {
                    this.loading = false;

                    if (response.data.data.length === 0) {
                        this.noMoreResults = true;
                        return;
                    }

                    this.currentPage += 1;
                    this.$els.loop.className = '';

                    response.data.data.forEach((message) => {
                        const createdAt = new Date(message.created_at);
                        message.created_at = `${createdAt.toLocaleDateString('en-CA', this.dateOptions)}`;
                        
                        message.message = message.message.linkify();

                        if (message.emotes !== null) {
                            message.message = this.twitchEmotes.formatMessage(message.message, message.emotes);
                            message.message = this.bttVEmotes.formatMessage(message.message);
                        }

                        this.logs.push(message);
                    });
                });
        }
    }
});
