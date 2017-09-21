"use strict";
exports.__esModule = true;
var ydl = require("ytdl-core");
var ffmpeg = require("fluent-ffmpeg");
var rxjs_1 = require("rxjs");
var FeedTranspiler = /** @class */ (function () {
    function FeedTranspiler(_scrapper, _kTmpDir, _kStoDir) {
        if (_kTmpDir === void 0) { _kTmpDir = "tmp/"; }
        if (_kStoDir === void 0) { _kStoDir = "storage/"; }
        var _this = this;
        this._scrapper = _scrapper;
        this._kTmpDir = _kTmpDir;
        this._kStoDir = _kStoDir;
        this._download = _scrapper.feedSubject
            .flatMap(function (value, index) {
            return rxjs_1.Observable.create(function (observer) {
                value.data.slice(0, 1).forEach(function (element) {
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
                    observer.next(this._kStoDir + value.name + ".mp3");
                    observer.complete();
                });
                transpiler.run();
            });
        });
        this._download.subscribe(function (value) {
            console.log("Completed traspile " + value);
        });
    }
    return FeedTranspiler;
}());
exports.FeedTranspiler = FeedTranspiler;
