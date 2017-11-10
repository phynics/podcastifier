import * as request from "request-promise-native";
import { Observable } from "rxjs";
import {
    ChannelListResponse,
    ChannelResource,
    ListResponse,
    PlaylistItemListResponse,
    PlaylistItemResource,
    PlaylistListResponse,
    PlaylistResource,
    VideosListResponse,
    VideosResource,
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

export class YTDataApi {

    constructor(private _kApiKey: string) { }

    public retrieveChannelList(
        parts: ListPart[] = ["contentDetails"],
        shouldIterate: boolean,
        channelId?: string,
        maxResults?: number,
        forUsername?: string,
    ): Observable<ChannelListResponse> {
        return this._retrieveResourceList<ChannelResource>(
            parts,
            "https://www.googleapis.com/youtube/v3/channels",
            shouldIterate,
            channelId,
            undefined,
            undefined,
            maxResults,
            forUsername);
    }

    public retrievePlaylistItemList(
        parts: ListPart[] = ["contentDetails"],
        shouldIterate: boolean,
        playlistId?: string,
        maxResults?: number,
    ): Observable<PlaylistItemListResponse> {
        return this._retrieveResourceList<PlaylistItemResource>(
            parts,
            "https://www.googleapis.com/youtube/v3/playlistItems",
            shouldIterate,
            undefined,
            playlistId,
            undefined,
            maxResults);
    }

    public retrievePlaylistList(
        parts: ListPart[],
        shouldIterate: boolean,
        playlistId?: string,
        maxResults?: number,
    ): Observable<PlaylistListResponse> {
        return this._retrieveResourceList<PlaylistResource>(
            parts,
            "https://www.googleapis.com/youtube/v3/playlists",
            shouldIterate,
            undefined,
            playlistId,
            undefined,
            maxResults);
    }

    public retrieveVideosList(
        parts: ListPart[],
        shouldIterate: boolean,
        videoId?: string,
        maxResults?: number,
    ): Observable<VideosListResponse> {
        return this._retrieveResourceList<VideosResource>(
            parts,
            "https://www.googleapis.com/youtube/v3/videos",
            shouldIterate,
            videoId,
            undefined,
            undefined,
            maxResults,
        );
    }

    private _retrieveResourceList<T>(
        parts: ListPart[],
        baseUrl: string,
        shouldIterate: boolean,
        resourceId?: string,
        playlistId?: string,
        channelId?: string,
        maxResults?: number,
        pageToken?: string,
        forUsername?: string,
    ): Observable<ListResponse<T>> {
        return this._requestResourceList<ListResponse<T>>(
            parts,
            baseUrl,
            resourceId,
            playlistId,
            channelId,
            maxResults,
            pageToken,
            forUsername,
        )
            .expand((page) => {
                if (page.nextPageToken != null && shouldIterate) {
                    return this._requestResourceList<ListResponse<T>>(
                        parts,
                        baseUrl,
                        resourceId,
                        playlistId,
                        channelId,
                        maxResults,
                        page.nextPageToken,
                    );
                } else {
                    return Observable.empty();
                }
            })
            .reduce((acc, item) => {
                const ret = acc;
                ret.items = acc.items.concat(item.items);
                if (acc["nextPageToken"]) {
                    delete ret["nextPageToken"];
                }
                return ret;
            });
    }
    private _requestResourceList<T>(
        parts: ListPart[],
        baseUrl: string,
        resourceId?: string,
        playlistId?: string,
        channelId?: string,
        maxResults?: number,
        pageToken?: string,
        forUsername?: string,
    ): Observable<T> {
        // A wild dragonite appeared.
        const options: { [param: string]: string } = { key: this._kApiKey };

        if (parts && parts.length > 0) {
            options["part"] = parts.map((a) => a.toString())
                .reduce((a, b) => a + "," + b);
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
        if (playlistId && playlistId.length > 0) {
            options["channelId"] = channelId;
        }
        if (pageToken && pageToken.length > 0) {
            options["pageToken"] = pageToken;
        }
        if (forUsername && forUsername.length > 0) {
            options["forUsername"] = forUsername;
        }
        const uri = baseUrl + "?" + Object.getOwnPropertyNames(options)
            .map((property) => {
                return property + "=" + options[property];
            })
            .reduce((a, b) => a + "&" + b);
        return Observable.create((observer) => {
            request.get(uri + "?").then((response) => {
                observer.next(JSON.parse(response) as T);
                observer.complete();
            }).catch((error) => {
                observer.error(error);
                observer.complete();
            });
        });
    }
}
