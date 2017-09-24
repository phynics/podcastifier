"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var podcast = require("podcast");
var PodFeedGenerator = /** @class */ (function () {
    function PodFeedGenerator(_transpileFeed, _hostName, _feedName) {
        var _this = this;
        this._transpileFeed = _transpileFeed;
        this._hostName = _hostName;
        this._feedName = _feedName;
        this.podFilledFeed = new rxjs_1.ReplaySubject(1);
        _transpileFeed.subscribe(function (df) {
            console.log("Generating an XML file...");
            _this.podFilledFeed.next(_this._generateXml(df));
        });
    }
    PodFeedGenerator.prototype._generateXml = function (feed) {
        var podcastOptions = {
            title: feed.name,
            feed_url: this._feedName,
            site_url: this._hostName,
            author: "@Fan"
        };
        console.log(JSON.stringify(podcastOptions));
        var pod = new podcast(podcastOptions);
        feed.data.forEach(function (element) {
            var opts = {
                title: element.name,
                description: element.description,
                url: element.localPath,
                date: new Date(element.date),
                enclosure: {
                    url: element.image
                }
            };
            console.log(JSON.stringify(opts));
            pod.item(opts);
        });
        return pod.xml();
    };
    return PodFeedGenerator;
}());
exports.PodFeedGenerator = PodFeedGenerator;
