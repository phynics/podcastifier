import * as request from "request-promise-native";
import { Observable } from "rxjs";
import {
    ChannelListResponse,
    VideosListResponse,
    PlaylistListResponse,
    PlaylistItemListResponse,
    PlaylistItemResource
} from "./Models";

export type ListPart =
    "auditDetails" |
    "brandingSettings" |
    "contentDetails" |
    "contentOwnerDetails" |
    "id" |
    "invideoPromotion" |
    "localizations" |
    "snippet" |
    "statistics" |
    "status" |
    "topicDetails" |
    "player" |
    "fileDetails" |
    "status";

export class YoutubeDataApi {

    constructor(private _kApiKey: string) { }

    public retrievePlaylistItemList(
        parts: ListPart[],
        playlistId?: string,
        maxResults?: number
    ): Observable<PlaylistItemResource[]> {
        return this._requestPlaylistItemList(parts, playlistId, maxResults)
            .expand((page) => {
                if (page.nextPageToken != null) {
                    return this._requestPlaylistItemList(parts, playlistId, maxResults, page.nextPageToken);
                } else {
                    return Observable.empty();
                }
            })
            .map(page => page.items)
            .reduce((acc, items) => acc.concat(items));
    }

    private _requestChannelList(
        parts: ListPart[],
        channelId?: string,
        forUsername?: string,
        maxResults?: number,
        pageToken?: string
    ): Observable<ChannelListResponse> {
        return this._requestResourceList<ChannelListResponse>(
            parts,
            "https://www.googleapis.com/youtube/v3/channels",
            channelId,
            maxResults,
            pageToken,
            forUsername);
    }

    private _requestPlaylistItemList(
        parts: ListPart[],
        playlistId?: string,
        maxResults?: number,
        pageToken?: string
    ): Observable<PlaylistItemListResponse> {
        return this._requestResourceList<PlaylistItemListResponse>(
            parts,
            "https://www.googleapis.com/youtube/v3/playlistItems",
            playlistId,
            maxResults,
            pageToken);
    }

    private _requestPlaylistList(
        parts: ListPart[],
        playlistId?: string,
        maxResults?: number,
        pageToken?: string
    ): Observable<PlaylistListResponse> {
        return this._requestResourceList<PlaylistListResponse>(
            parts,
            "https://www.googleapis.com/youtube/v3/playlists",
            playlistId,
            maxResults,
            pageToken);
    }

    private _requestVideosList(
        parts: ListPart[],
        videoId?: string,
        maxResults?: number,
        pageToken?: string
    ): Observable<VideosListResponse> {
        return this._requestResourceList<VideosListResponse>(
            parts,
            "https://www.googleapis.com/youtube/v3/videos",
            videoId,
            maxResults,
            pageToken);
    }

    private _requestResourceList<T>(
        parts: ListPart[],
        baseUrl: string,
        resourceId?: string,
        maxResults?: number,
        pageToken?: string,
        forUsername?: string
    ): Observable<T> {
        // A wild dragonite appeared.
        const options: { [param: string]: String } = { key: this._kApiKey };

        if (parts && parts.length > 0) {
            options["part"] = parts.map(a => a.toString())
                .reduce((a, b) => a + "," + b);
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

        return Observable.create((observer) => {
            request.get(baseUrl, options).then((response) => {
                observer.next(JSON.parse(response) as T);
                observer.complete();
            }).catch((error) => {
                observer.error(error);
                observer.complete();
            });
        });
    }
}