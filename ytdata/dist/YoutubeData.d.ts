import { Observable } from "rxjs";
import { PlaylistItemResource } from "./Models";
export declare type ListPart = "auditDetails" | "brandingSettings" | "contentDetails" | "contentOwnerDetails" | "id" | "invideoPromotion" | "localizations" | "snippet" | "statistics" | "status" | "topicDetails" | "player" | "fileDetails" | "status";
export declare class YoutubeDataApi {
    private _kApiKey;
    constructor(_kApiKey: string);
    retrievePlaylistItemList(parts: ListPart[], playlistId?: string, maxResults?: number): Observable<PlaylistItemResource[]>;
    private _requestChannelList(parts, channelId?, forUsername?, maxResults?, pageToken?);
    private _requestPlaylistItemList(parts, playlistId?, maxResults?, pageToken?);
    private _requestPlaylistList(parts, playlistId?, maxResults?, pageToken?);
    private _requestVideosList(parts, videoId?, maxResults?, pageToken?);
    private _requestResourceList<T>(parts, baseUrl, resourceId?, maxResults?, pageToken?, forUsername?);
}
