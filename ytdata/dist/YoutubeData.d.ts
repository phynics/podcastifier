import { Observable } from "rxjs";
import { ChannelListResponse, PlaylistItemListResponse, PlaylistListResponse, VideosListResponse } from "./Models";
export declare type ListPart = "auditDetails" | "brandingSettings" | "contentDetails" | "contentOwnerDetails" | "id" | "invideoPromotion" | "localizations" | "snippet" | "statistics" | "status" | "topicDetails" | "player" | "fileDetails" | "status";
export declare class YTDataApi {
    private _kApiKey;
    constructor(_kApiKey: string);
    retrieveChannelList(parts: ListPart[], shouldIterate: boolean, channelId?: string, maxResults?: number, forUsername?: string): Observable<ChannelListResponse>;
    retrievePlaylistItemList(parts: ListPart[], shouldIterate: boolean, playlistId?: string, maxResults?: number): Observable<PlaylistItemListResponse>;
    retrievePlaylistList(parts: ListPart[], shouldIterate: boolean, playlistId?: string, maxResults?: number): Observable<PlaylistListResponse>;
    retrieveVideosList(parts: ListPart[], shouldIterate: boolean, videoId?: string, maxResults?: number): Observable<VideosListResponse>;
    private _retrieveResourceList<T>(parts, baseUrl, shouldIterate, resourceId?, playlistId?, channelId?, maxResults?, pageToken?, forUsername?);
    private _requestResourceList<T>(parts, baseUrl, resourceId?, playlistId?, channelId?, maxResults?, pageToken?, forUsername?);
}
