"use strict";
exports.__esModule = true;
var FeedScrapper_1 = require("./FeedScrapper");
var FeedTranspiler_1 = require("./FeedTranspiler");
var request = require("request-promise-native");
var req = request('http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ').then(function (xml) {
    console.log();
});
var FS = new FeedScrapper_1.FeedScrapper("gkypr", "http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ");
var FT = new FeedTranspiler_1.FeedTranspiler(FS);
