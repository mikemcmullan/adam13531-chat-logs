'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FormatTwitchEmotes = function () {
	function FormatTwitchEmotes() {
		_classCallCheck(this, FormatTwitchEmotes);
	}

	_createClass(FormatTwitchEmotes, [{
		key: 'makeImage',
		value: function makeImage(emoteId) {
			return '<img class="emoticon" src="//static-cdn.jtvnw.net/emoticons/v1/' + emoteId + '/1.0">';
		}
	}, {
		key: 'parseEmotes',
		value: function parseEmotes(emotesString) {
			var emotes = [];

			emotesString.split('/').forEach(function (emoteString, index) {
				emoteString = emoteString.split(':');

				var number = emoteString[0];

				emoteString[1].split(',').forEach(function (pos, index) {
					var positions = pos.split('-');
					emotes.push({ emote: number, start: ~~positions[0], end: ~~positions[1] });
				});
			});

			return emotes.sort(function (a, b) {
				return a.start - b.start;
			});
		}
	}, {
		key: 'formatMessage',
		value: function formatMessage(message, emotesString) {
			var _this = this;

			var messageParts = [];
			var emotes = this.parseEmotes(emotesString);

			emotes.forEach(function (emote, index, emotes) {
				// If this is the first emote get the text before emote.
				if (index === 0) {
					messageParts.push(message.substr(0, emote.start).trim());
					messageParts.push(_this.makeImage(emote.emote));
				}

				// Get the previous emote in the array and get the characters
				// between the end of that emote and the start of the current emote.
				if (emotes[index - 1]) {
					var length = emote.start - (emotes[index - 1].end + 1);
					messageParts.push(message.substr(emotes[index - 1].end + 1, length).trim());
					messageParts.push(_this.makeImage(emote.emote));
				}

				if (index === emotes.length - 1) {
					messageParts.push(message.substr(emote.end + 1).trim());
				}
			});

			return messageParts.join(' ');
		}
	}]);

	return FormatTwitchEmotes;
}();
