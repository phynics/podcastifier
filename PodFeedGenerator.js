"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var PodFeedGenerator = /** @class */ (function () {
    function PodFeedGenerator(_transpileFeed, _downloadFeed, _hostName, _feedName) {
        var _this = this;
        this._transpileFeed = _transpileFeed;
        this._downloadFeed = _downloadFeed;
        this._hostName = _hostName;
        this._feedName = _feedName;
        this._presentAudioFiles = new Array();
        _transpileFeed.distinct().subscribe(function (file) { return _this._presentAudioFiles.push(file); });
        this.podFilledFeed = new rxjs_1.BehaviorSubject(undefined);
        _downloadFeed.combineLatest([_transpileFeed], function (df, tf) {
            _this.podFilledFeed.next(_this._generateXml(df));
        });
    }
    PodFeedGenerator.prototype._generateXml = function (feed) {
        var _this = this;
        var podcastOptions = {
            title: feed.name,
            feed_url: this._feedName,
            site_url: this._hostName,
            author: "@Fan"
        };
        var pod = new Podcast(podcastOptions);
        feed.data.forEach(function (element) {
            var path = _this._presentAudioFiles.filter(function (obj) { return obj.id == element.id; })[0];
            var opts = {
                title: element.name,
                description: element.description,
                url: path ? path.path : undefined,
                date: new Date(element.date),
                enclosure: {
                    url: element.image
                }
            };
            pod.item(opts);
        });
        return pod.xml();
    };
    return PodFeedGenerator;
}());
exports.PodFeedGenerator = PodFeedGenerator;
