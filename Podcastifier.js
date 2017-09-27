"use strict";
exports.__esModule = true;
var FeedScrapper_1 = require("./FeedScrapper");
var FeedTranspiler_1 = require("./FeedTranspiler");
var FeedGenerator_1 = require("./FeedGenerator");
var express = require("express");
var fs = require("fs");
var Podcastifier = /** @class */ (function () {
    function Podcastifier(_configuration, _podcasts) {
        var _this = this;
        this._configuration = _configuration;
        this._podcasts = _podcasts;
        this._setupExpress();
        if (this._expressServer != null) {
            this._expressServer.listen(this._configuration.serverPort, function () { return console.log("Started express server at port " + _this._configuration.serverPort + "."); });
        }
        this._feedGenerator = new Array();
        this._feedScrapper = new Array();
        this._feedTranspiler = new Array();
        _podcasts.forEach(function (podcast, index) {
            var feedS = new FeedScrapper_1.FeedScrapper(podcast, _this._configuration.pollInterval, _this._configuration.backlogSize);
            _this._feedScrapper.push(feedS);
            var feedT = new FeedTranspiler_1.FeedTranspiler(feedS.feedSubject);
            _this._feedTranspiler.push(feedT);
            var feedG = new FeedGenerator_1.FeedGenerator(feedT.downloadFeed, _this._configuration.serverURL + ":" + _this._configuration.serverPort);
            feedG.xmlPodcastFeed.subscribe(function (xml) { return _this._saveXml(xml, podcast); });
        });
    }
    Podcastifier.prototype._setupExpress = function () {
        var _this = this;
        this._expressServer = express();
        var exp = this._expressServer;
        exp.get("/", function (req, res) {
            res.send("Podcastifier is serving the following feeds: <hr> <br>"
                + _this._podcasts.map(function (value) {
                    return "<a href=\"" + _this._configuration.serverURL + ":" + _this._configuration.serverPort + "/feeds/" + value.id + "/podcast.xml\">"
                        + value.title + "</a>";
                }).join("<br>"));
        });
        exp.get("/feeds/:podcastid/podcast.xml", function (req, res) {
            var podcastId = req.params["podcastid"];
            if (fs.existsSync(__dirname + "/" + _this._configuration.feedPath + podcastId + ".xml")) {
                res.sendFile(__dirname + "/" + _this._configuration.feedPath + podcastId + ".xml");
            }
        });
        exp.get("/:fileid/ep.mp3", function (req, res) {
            var fileId = req.params["fileid"];
            if (fs.existsSync(__dirname + "/" + _this._configuration.filePath + fileId + ".mp3")) {
                res.sendFile(__dirname + "/" + _this._configuration.filePath + fileId + ".mp3");
            }
        });
    };
    Podcastifier.prototype._saveXml = function (xml, podcast) {
        fs.writeFile(__dirname + "/" + this._configuration.feedPath + podcast.id + ".xml", xml, function () { });
    };
    return Podcastifier;
}());
exports.Podcastifier = Podcastifier;
