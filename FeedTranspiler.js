"use strict";
exports.__esModule = true;
var ydl = require("ytdl-core");
var ffmpeg = require("fluent-ffmpeg");
var rxjs_1 = require("rxjs");
var FeedTranspiler = /** @class */ (function () {
    function FeedTranspiler(_downloadFeed, _kStoDir) {
        if (_kStoDir === void 0) { _kStoDir = "storage/"; }
        var _this = this;
        this._downloadFeed = _downloadFeed;
        this._kStoDir = _kStoDir;
        this.downloadFeed = _downloadFeed
            .flatMap(function (value, index) {
            return rxjs_1.Observable.create(function (observer) {
                value.data.forEach(function (element) {
                    console.log("Starting download for " + element.name);
                    var payload = {
                        stream: ydl(element.remoteUrl),
                        name: element.id
                    };
                    observer.next(payload);
                    observer.complete();
                });
            });
        })
            .flatMap(function (value, index) {
            return rxjs_1.Observable.create(function (observer) {
                console.log("Transpiling from stream");
                var transpiler = ffmpeg(value.stream)
                    .withNoVideo()
                    .audioBitrate('256k')
                    .audioCodec('libmp3lame')
                    .audioChannels(2)
                    .format('mp3')
                    .output(_this._kStoDir + value.name + ".mp3")
                    .on('end', function (video) {
                    observer.next(value.name);
                    observer.complete();
                });
                transpiler.run();
            });
        })
            .map(function (value, _) {
            return { id: value, path: _this._kStoDir + value + ".mp3" };
        });
    }
    return FeedTranspiler;
}());
exports.FeedTranspiler = FeedTranspiler;
