"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request-promise-native");
var rxjs_1 = require("rxjs");
var YoutubeDataApi = /** @class */ (function () {
    function YoutubeDataApi(_kApiKey) {
        this._kApiKey = _kApiKey;
    }
    YoutubeDataApi.prototype.retrievePlaylistItemList = function (parts, playlistId, maxResults) {
        var _this = this;
        return this._requestPlaylistItemList(parts, playlistId, maxResults)
            .expand(function (page) {
            if (page.nextPageToken != null) {
                return _this._requestPlaylistItemList(parts, playlistId, maxResults, page.nextPageToken);
            }
            else {
                return rxjs_1.Observable.empty();
            }
        })
            .map(function (page) { return page.items; })
            .reduce(function (acc, items) { return acc.concat(items); });
    };
    YoutubeDataApi.prototype._requestChannelList = function (parts, channelId, forUsername, maxResults, pageToken) {
        return this._requestResourceList(parts, "https://www.googleapis.com/youtube/v3/channels", channelId, maxResults, pageToken, forUsername);
    };
    YoutubeDataApi.prototype._requestPlaylistItemList = function (parts, playlistId, maxResults, pageToken) {
        return this._requestResourceList(parts, "https://www.googleapis.com/youtube/v3/playlistItems", playlistId, maxResults, pageToken);
    };
    YoutubeDataApi.prototype._requestPlaylistList = function (parts, playlistId, maxResults, pageToken) {
        return this._requestResourceList(parts, "https://www.googleapis.com/youtube/v3/playlists", playlistId, maxResults, pageToken);
    };
    YoutubeDataApi.prototype._requestVideosList = function (parts, videoId, maxResults, pageToken) {
        return this._requestResourceList(parts, "https://www.googleapis.com/youtube/v3/videos", videoId, maxResults, pageToken);
    };
    YoutubeDataApi.prototype._requestResourceList = function (parts, baseUrl, resourceId, maxResults, pageToken, forUsername) {
        // A wild dragonite appeared.
        var options = { key: this._kApiKey };
        if (parts && parts.length > 0) {
            options["part"] = parts.map(function (a) { return a.toString(); })
                .reduce(function (a, b) { return a + "," + b; });
        }
        if (resourceId && resourceId.length > 0) {
            options["id"] = resourceId;
        }
        if (maxResults && maxResults > 0) {
            options["maxResults"] = maxResults.toString();
        }
        if (pageToken && pageToken.length > 0) {
            options["pageToken"] = pageToken;
        }
        if (forUsername && forUsername.length > 0) {
            options["forUsername"] = forUsername;
        }
        return rxjs_1.Observable.create(function (observer) {
            request.get(baseUrl, options).then(function (response) {
                observer.next(JSON.parse(response));
                observer.complete();
            }).catch(function (error) {
                observer.error(error);
                observer.complete();
            });
        });
    };
    return YoutubeDataApi;
}());
exports.YoutubeDataApi = YoutubeDataApi;
