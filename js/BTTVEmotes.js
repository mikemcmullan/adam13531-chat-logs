'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FormatBTTVEmotes = function () {
	function FormatBTTVEmotes() {
		_classCallCheck(this, FormatBTTVEmotes);

		this.globalEmotes = [];
		this.channelEmotes = [];
	}

	_createClass(FormatBTTVEmotes, [{
		key: 'load',
		value: function load(channel) {
			return Promise.all([this.getGlobalEmotes(), this.getChannelEmotes(channel)]);
		}
	}, {
		key: 'makeImage',
		value: function makeImage(emoteId) {
			return '<img class="emoticon" src="//cdn.betterttv.net/emote/' + emoteId + '/1x">';
		}
	}, {
		key: 'getEmotes',
		value: function getEmotes(url) {
			return new Promise(function (resolve, reject) {
				var xhr = new XMLHttpRequest();

				xhr.timeout = 2000;
				xhr.open('GET', url, true);

				xhr.onreadystatechange = function () {
					if (this.readyState == 4 && this.status == 200) {
						var body = JSON.parse(this.responseText);

						resolve(body.emotes);
					}
				};

				xhr.ontimeout = function (e) {
					resolve([]);
				};

				xhr.send();
			});
		}
	}, {
		key: 'getGlobalEmotes',
		value: function getGlobalEmotes() {
			var _this = this;

			return this.getEmotes('https://api.betterttv.net/2/emotes').then(function (emotes) {
				_this.globalEmotes = emotes;

				return emotes;
			});
		}
	}, {
		key: 'getChannelEmotes',
		value: function getChannelEmotes(channel) {
			var _this2 = this;

			return this.getEmotes('https://api.betterttv.net/2/channels/' + channel).then(function (emotes) {
				_this2.channelEmotes = emotes;

				return emotes;
			});
		}
	}, {
		key: 'formatMessage',
		value: function formatMessage(message) {
			var _this3 = this;

			this.globalEmotes.forEach(function (emote) {
				message = message.replace(emote.code, _this3.makeImage(emote.id));
			});

			this.channelEmotes.forEach(function (emote) {
				message = message.replace(emote.code, _this3.makeImage(emote.id));
			});

			return message;
		}
	}]);

	return FormatBTTVEmotes;
}();

exports.default = FormatBTTVEmotes;
