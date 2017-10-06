"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
exports.__esModule = true;
var rxjs = require("rxjs");
var rp = require("request-promise-native");
var parser = require("xml-parser");
var FeedScrapper = /** @class */ (function () {
    function FeedScrapper(_podcast, _pollIntervalMS, _backlogSize, _throttleTime) {
        if (_pollIntervalMS === void 0) { _pollIntervalMS = 43200000; }
        if (_backlogSize === void 0) { _backlogSize = 3; }
        if (_throttleTime === void 0) { _throttleTime = 600000; }
        this._podcast = _podcast;
        this._pollIntervalMS = _pollIntervalMS;
        this._backlogSize = _backlogSize;
        this._throttleTime = _throttleTime;
        this.feedSubject = new rxjs.ReplaySubject(1);
        this._mTrigger = new rxjs.Subject();
        this._fetchFeed();
    }
    FeedScrapper.prototype.forceCheck = function () {
        this._mTrigger.next(0);
    };
    FeedScrapper.prototype._fetchFeed = function () {
        var _this = this;
        console.log("Setting polling with " + this._pollIntervalMS + "ms intervals.");
        this._mTrigger.throttleTime(this._throttleTime)
            .subscribe(function (_) {
            console.log("Checking the feed " + _this._podcast.youtubeUrl);
            rp(_this._podcast.youtubeUrl)
                .then(function (xml) {
                var parsed = _this._parseXML(xml);
                console.log("Parsed XML file " + (new Date(parsed.fetchDate)).toLocaleString());
                _this.feedSubject.next(parsed);
            })["catch"](function (error) {
                console.log(error.message);
            });
        });
        rxjs.Observable.timer(25, this._pollIntervalMS).subscribe(function (num) { return _this._mTrigger.next(num); });
    };
    FeedScrapper.prototype._parseXML = function (xmlData) {
        var xml = parser(xmlData);
        var feedData = __assign({}, this._podcast);
        feedData.data = new Array();
        feedData.title = xml.root.children
            .filter(function (elem) { return elem.name == "title"; })[0]
            .content;
        feedData.pubDate = xml.root.children
            .filter(function (elem) { return elem.name == "published"; })[0]
            .content;
        feedData.fetchDate = Date.now();
        xml.root.children.filter(function (elem) { return elem.name == "entry"; })
            .slice(0, this._backlogSize)
            .forEach(function (elem) {
            var entry = {};
            entry.remoteUrl = elem.children
                .filter(function (elem) { return elem.name == "link"; })[0]
                .attributes["href"];
            entry.date = elem.children
                .filter(function (elem) { return elem.name == "published"; })[0]
                .content;
            entry.id = elem.children
                .filter(function (elem) { return elem.name == "yt:videoId"; })[0]
                .content;
            elem.children.filter(function (elem) { return elem.name == "media:group"; })[0]
                .children.forEach(function (elem) {
                switch (elem.name) {
                    case "media:title":
                        entry.name = elem.content;
                        break;
                    case "media:thumbnail":
                        entry.image = elem.attributes["url"];
                        entry.image = entry.image.replace("hqdefault.jpg", "maxresdefault.jpg");
                        break;
                    case "media:description":
                        entry.description = elem.content;
                        break;
                }
            });
            console.log("Parsed " + entry.name + " from " + feedData.title);
            feedData.data.push(entry);
        });
        return feedData;
    };
    return FeedScrapper;
}());
exports.FeedScrapper = FeedScrapper;
