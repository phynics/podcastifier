"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var podcast = require("podcast");
var FeedGenerator = /** @class */ (function () {
    function FeedGenerator(_transpileFeed, _hostName) {
        var _this = this;
        this._hostName = _hostName;
        this._xmlPodcastFeed = new rxjs_1.ReplaySubject(1);
        _transpileFeed.subscribe(function (df) {
            console.log("Generating an XML file...");
            _this._xmlPodcastFeed.next(_this._generateXml(df));
        });
    }
    Object.defineProperty(FeedGenerator.prototype, "xmlPodcastFeed", {
        get: function () {
            return this._xmlPodcastFeed.asObservable();
        },
        enumerable: true,
        configurable: true
    });
    FeedGenerator.prototype._generateXml = function (feed) {
        var _this = this;
        var podcastOptions = {
            title: feed.title,
            description: feed.description,
            image_url: feed.image,
            author: feed.author,
            pubDate: new Date(feed.pubDate),
            itunesSubtitle: feed.itunesSubtitle,
            itunesAuthor: feed.author,
            itunesSummary: feed.itunesSubtitle,
            site_url: feed.siteUrl,
            language: feed.lang,
            feed_url: this._hostName + "/feeds/" + feed.id + "/podcast.xml"
        };
        var pod = new podcast(podcastOptions);
        feed.data.forEach(function (element) {
            var opts = {
                title: element.name,
                description: element.description,
                url: element.remoteUrl,
                guid: element.id,
                date: new Date(element.date),
                enclosure: {
                    url: _this._hostName + "/" + element.id + "/ep.mp3",
                    mime: "audio/mpeg"
                },
                itunesImage: element.image,
                itunesSubtitle: element.description.split("---")[0] || feed.itunesSubtitle
            };
            pod.item(opts);
        });
        return pod.xml();
    };
    return FeedGenerator;
}());
exports.FeedGenerator = FeedGenerator;
