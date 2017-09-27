"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var podcast = require("podcast");
var FeedGenerator = /** @class */ (function () {
    function FeedGenerator(_transpileFeed, _hostName) {
        var _this = this;
        this._transpileFeed = _transpileFeed;
        this._hostName = _hostName;
        this.xmlPodcastFeed = new rxjs_1.ReplaySubject(1);
        _transpileFeed.subscribe(function (df) {
            console.log("Generating an XML file...");
            _this.xmlPodcastFeed.next(_this._generateXml(df));
        });
    }
    FeedGenerator.prototype._generateXml = function (feed) {
        var _this = this;
        var podcastOptions = {
            title: feed.title,
            description: feed.description,
            author: feed.author,
            itunesSubtitle: feed.itunesSubtitle,
            itunesImage: feed.itunesImage,
            site_url: this._hostName,
            feed_url: this._hostName + "/feeds/" + feed.id + "/podcast.xml"
        };
        var pod = new podcast(podcastOptions);
        feed.data.forEach(function (element) {
            var opts = {
                title: element.name,
                description: element.description,
                url: element.image,
                guid: element.id,
                date: new Date(element.date),
                enclosure: {
                    url: _this._hostName + "/" + element.id + "/ep.mp3",
                    mime: "audio/mpeg"
                },
                itunesImage: element.image
            };
            pod.item(opts);
        });
        return pod.xml();
    };
    return FeedGenerator;
}());
exports.FeedGenerator = FeedGenerator;
