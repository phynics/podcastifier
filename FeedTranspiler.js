"use strict";
exports.__esModule = true;
var ydl = require("ytdl-core");
var fs = require("graceful-fs");
var ffmpeg = require("ffmpeg");
var rxjs_1 = require("rxjs");
var FeedTranspiler = /** @class */ (function () {
    function FeedTranspiler(_Scrapper) {
        this._Scrapper = _Scrapper;
        this._download = _Scrapper.feedSubject
            .flatMap(function (value, index) {
            return rxjs_1.Observable.create(function (observer) {
                var x = 0, y = 0;
                value.data.slice(0, 1).forEach(function (element) {
                    x++;
                    console.log("Starting download for " + element.name);
                    var vid = ydl(element.remoteUrl);
                    vid.pipe(fs.createWriteStream(FeedTranspiler._kTmpDir + element.id));
                    vid.on('finish', function () {
                        observer.next(element.id);
                        y++;
                        if (x == y) {
                            observer.complete();
                        }
                    });
                });
                //observer.complete();
            });
        })
            .flatMap(function (value, index) {
            return rxjs_1.Observable.create(function (observer) {
                console.log("Transpiling " + value);
                var transpiler = ffmpeg(FeedTranspiler._kTmpDir + value);
                transpiler.then(function (video) {
                    // Callback mode
                    video.fnExtractSoundToMP3(FeedTranspiler._kStoDir + value, function (error, file) {
                        if (!error) {
                            console.log('Audio id: ' + value);
                            observer.next(file);
                            observer.complete();
                        }
                        else {
                            observer.error(JSON.stringify(error));
                            observer.complete();
                        }
                    });
                });
            });
        });
        this._download.subscribe(function (value) {
            fs.unlink(FeedTranspiler._kTmpDir + value, function () { });
            console.log("completed: " + value);
        });
    }
    FeedTranspiler._kTmpDir = "tmp/";
    FeedTranspiler._kStoDir = "storage/";
    return FeedTranspiler;
}());
exports.FeedTranspiler = FeedTranspiler;
