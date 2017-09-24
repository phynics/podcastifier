"use strict";
exports.__esModule = true;
var FeedScrapper_1 = require("./FeedScrapper");
var FeedTranspiler_1 = require("./FeedTranspiler");
var PodFeedGenerator_1 = require("./PodFeedGenerator");
var request = require("request-promise-native");
var fs = require("fs");
var req = request('http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ').then(function (xml) {
    console.log();
});
var FS = new FeedScrapper_1.FeedScrapper("gkypr", "http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ");
var FT = new FeedTranspiler_1.FeedTranspiler(FS.feedSubject);
var PFG = new PodFeedGenerator_1.PodFeedGenerator(FT.downloadFeed, "http://localhost:8080/", "podcast");
var i = 0;
PFG.podFilledFeed.subscribe(function (item) { return fs.writeFile(("current" + (i++) + ".xml"), item, function () { }); });
