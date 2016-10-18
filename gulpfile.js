var elixir = require('laravel-elixir');

elixir.config.assetsPath = './';

elixir(function(mix) {
    mix.browserify(['./es6/BTTVEmotes.js', './es6/TwitchEmotes.js', './es6/script.js'], './js/script.js');
});
