"use strict";
exports.__esModule = true;
var rxjs = require("rxjs");
var rp = require("request-promise-native");
var parser = require("xml-parser");
var poller = require("async-polling");
var FeedScrapper = /** @class */ (function () {
    function FeedScrapper(_feedName, _feedUrl, _pollIntervalMS) {
        if (_pollIntervalMS === void 0) { _pollIntervalMS = 43200000; }
        this._feedName = _feedName;
        this._feedUrl = _feedUrl;
        this._pollIntervalMS = _pollIntervalMS;
        this.feedSubject = new rxjs.ReplaySubject(1);
        this.feedSubject.subscribe(function () { return console.log("Fetched new XML file"); });
        this._fetchFeed();
    }
    FeedScrapper.prototype._fetchFeed = function () {
        var _this = this;
        console.log("Setting polling with " + this._pollIntervalMS);
        poller(function (_) {
            console.log("Checking the feed");
            rp(_this._feedUrl)
                .then(function (xml) {
                var parsed = _this._parseXML(xml);
                console.log("Parsed XML file " + (new Date(parsed.fetchDate)).toLocaleString());
                _this.feedSubject.next(parsed);
            })["catch"](function (error) {
                console.log("Error downloading from URL: " + _this._feedUrl);
            });
        }, this._pollIntervalMS).run();
    };
    FeedScrapper.prototype._parseXML = function (xmlData) {
        var xml = parser(xmlData);
        var feedData = {};
        feedData.data = new Array();
        feedData.name = xml.root.children
            .filter(function (elem) { return elem.name == "title"; })[0].content;
        feedData.fetchDate = Date.now();
        xml.root.children.filter(function (elem) { return elem.name == "entry"; }).slice(0, 5)
            .forEach(function (elem) {
            var entry = {};
            entry.remoteUrl = elem.children
                .filter(function (elem) { return elem.name == "link"; })[0]
                .attributes["href"];
            entry.date = elem.children
                .filter(function (elem) { return elem.name == "published"; })[0]
                .content;
            entry.update = elem.children
                .filter(function (elem) { return elem.name == "updated"; })[0]
                .content;
            entry.id = elem.children
                .filter(function (elem) { return elem.name == "yt:videoId"; })[0]
                .content;
            elem.children.filter(function (elem) { return elem.name == "media:group"; })[0]
                .children.forEach(function (elem) {
                switch (elem.name) {
                    case "media:title":
                        entry.name = elem.content;
                    case "media:thumbnail":
                        entry.image = elem.attributes["url"];
                        break;
                    case "media:description":
                        entry.description = elem.content;
                }
            });
            console.log("Parsed " + entry.name + " from " + feedData.name);
            feedData.data.push(entry);
        });
        return feedData;
    };
    return FeedScrapper;
}());
exports.FeedScrapper = FeedScrapper;
