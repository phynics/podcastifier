"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request-promise-native");
var rxjs_1 = require("rxjs");
var YTDataApi = /** @class */ (function () {
    function YTDataApi(_kApiKey) {
        this._kApiKey = _kApiKey;
    }
    YTDataApi.prototype.retrieveChannelList = function (parts, shouldIterate, channelId, maxResults, forUsername) {
        if (parts === void 0) { parts = ["contentDetails"]; }
        return this._retrieveResourceList(parts, "https://www.googleapis.com/youtube/v3/channels", shouldIterate, channelId, undefined, undefined, maxResults, forUsername);
    };
    YTDataApi.prototype.retrievePlaylistItemList = function (parts, shouldIterate, playlistId, maxResults) {
        if (parts === void 0) { parts = ["contentDetails"]; }
        return this._retrieveResourceList(parts, "https://www.googleapis.com/youtube/v3/playlistItems", shouldIterate, undefined, playlistId, undefined, maxResults);
    };
    YTDataApi.prototype.retrievePlaylistList = function (parts, shouldIterate, playlistId, maxResults) {
        return this._retrieveResourceList(parts, "https://www.googleapis.com/youtube/v3/playlists", shouldIterate, playlistId, undefined, undefined, maxResults);
    };
    YTDataApi.prototype.retrieveVideosList = function (parts, shouldIterate, videoId, maxResults) {
        return this._retrieveResourceList(parts, "https://www.googleapis.com/youtube/v3/videos", shouldIterate, videoId, undefined, undefined, maxResults);
    };
    YTDataApi.prototype._retrieveResourceList = function (parts, baseUrl, shouldIterate, resourceId, playlistId, channelId, maxResults, pageToken, forUsername) {
        var _this = this;
        return this._requestResourceList(parts, baseUrl, resourceId, playlistId, channelId, maxResults, pageToken, forUsername)
            .expand(function (page) {
            if (page.nextPageToken != null && shouldIterate) {
                return _this._requestResourceList(parts, baseUrl, resourceId, playlistId, channelId, maxResults, page.nextPageToken);
            }
            else {
                return rxjs_1.Observable.empty();
            }
        })
            .reduce(function (acc, item) {
            var ret = acc;
            ret.items = acc.items.concat(item.items);
            if (acc["nextPageToken"]) {
                delete ret["nextPageToken"];
            }
            return ret;
        });
    };
    YTDataApi.prototype._requestResourceList = function (parts, baseUrl, resourceId, playlistId, channelId, maxResults, pageToken, forUsername) {
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
        if (playlistId && playlistId.length > 0) {
            options["playlistId"] = playlistId;
        }
        if (channelId && channelId.length > 0) {
            options["channelId"] = channelId;
        }
        if (pageToken && pageToken.length > 0) {
            options["pageToken"] = pageToken;
        }
        if (forUsername && forUsername.length > 0) {
            options["forUsername"] = forUsername;
        }
        var uri = baseUrl + "?" + Object.getOwnPropertyNames(options)
            .map(function (property) {
            return property + "=" + options[property];
        })
            .reduce(function (a, b) { return a + "&" + b; });
        return rxjs_1.Observable.create(function (observer) {
            request.get(uri).then(function (response) {
                observer.next(JSON.parse(response));
                observer.complete();
            }).catch(function (error) {
                observer.error(error);
                observer.complete();
            });
        });
    };
    return YTDataApi;
}());
exports.YTDataApi = YTDataApi;
