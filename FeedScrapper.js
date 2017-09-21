"use strict";
exports.__esModule = true;
var rxjs = require("rxjs");
var rp = require("request-promise-native");
var parser = require("xml-parser");
var poller = require("async-polling");
var FeedScrapper = /** @class */ (function () {
    function FeedScrapper(_feedName, _feedUrl) {
        this._feedName = _feedName;
        this._feedUrl = _feedUrl;
        this.feedSubject = new rxjs.ReplaySubject(1);
        this.feedSubject.subscribe(function () { return console.log("Subject emmited"); });
        this._fetchFeed();
    }
    FeedScrapper.prototype._fetchFeed = function () {
        var _this = this;
        poller(function (_) {
            rp(_this._feedUrl)
                .then(function (xml) {
                console.log("Downloaded XML...");
                _this.feedSubject.next(_this._parseXML(xml));
            });
        }, 43200000).run();
    };
    FeedScrapper.prototype._parseXML = function (xmlData) {
        var xml = parser(xmlData);
        var feedData = {};
        feedData.data = new Array();
        feedData.name = xml.root.children
            .filter(function (elem) { return elem.name == "title"; })[0].content;
        feedData.lastUpdate = Date.now();
        xml.root.children.filter(function (elem) { return elem.name == "entry"; })
            .forEach(function (elem) {
            var entry = {};
            entry.localUrl = undefined;
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
            console.log("Parsed: " + entry.name);
            feedData.data.push(entry);
        });
        return feedData;
    };
    return FeedScrapper;
}());
exports.FeedScrapper = FeedScrapper;
