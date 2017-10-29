"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ydl = require("ytdl-core");
var fs = require("fs");
var ffmpeg = require("fluent-ffmpeg");
var rxjs_1 = require("rxjs");
var FeedTranspiler = /** @class */ (function () {
    function FeedTranspiler(_xmlFeed, _kStoDir) {
        if (_kStoDir === void 0) { _kStoDir = "storage/"; }
        var _this = this;
        this._xmlFeed = _xmlFeed;
        this._kStoDir = _kStoDir;
        this.downloadFeed = new rxjs_1.ReplaySubject(1);
        _xmlFeed.subscribe(function (value) {
            var dataObservables = new Array();
            value.data.forEach(function (element) {
                var exists = fs.existsSync(_this._pathBuilder(element.id));
                var entry;
                var obs = new rxjs_1.Observable(function (observer) {
                    if (exists) {
                        //filefound therefore 
                        console.log("Found " + element.name + ", skipping download.");
                        entry = __assign({}, element);
                        entry.localPath = _this._pathBuilder(element.id);
                        observer.next(entry);
                        observer.complete();
                    }
                    else {
                        console.log("Starting download for " + element.name);
                        var stream = ydl(element.remoteUrl);
                        var subs_1 = _this._transpilePayload(stream, element).subscribe(function (result) {
                            observer.next(result);
                            observer.complete();
                            subs_1.unsubscribe();
                        });
                    }
                });
                dataObservables.push(obs);
            });
            rxjs_1.Observable.forkJoin(dataObservables).subscribe(function (data) {
                var payload = __assign({}, value);
                payload.data = data;
                _this.downloadFeed.next(payload);
            });
        });
    }
    FeedTranspiler.prototype._pathBuilder = function (entryId) {
        return this._kStoDir + entryId + ".mp3";
    };
    FeedTranspiler.prototype._transpilePayload = function (stream, entry) {
        var path = this._pathBuilder(entry.id);
        var obs = rxjs_1.Observable.create(function (observer) {
            console.log("Transpiling ", entry.name);
            var transpiler = ffmpeg(stream)
                .withNoVideo()
                .audioBitrate('256k')
                .audioCodec('libmp3lame')
                .audioChannels(2)
                .format('mp3')
                .output(path)
                .on('info', function (arg) {
                console.log(JSON.stringify(arg));
            })
                .on('end', function (video) {
                var payload = __assign({}, entry);
                payload.localPath = path;
                observer.next(payload);
                observer.complete();
            });
            transpiler.run();
        });
        return obs;
    };
    return FeedTranspiler;
}());
exports.FeedTranspiler = FeedTranspiler;
