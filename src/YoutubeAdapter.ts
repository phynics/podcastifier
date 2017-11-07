
import { Observable } from "rxjs/Observable";
import { YTDataApi } from "ytdata";

import { DatabaseController } from "./DatabaseController";
import { Podcast, SourceModule, SourceType } from "./Models";
import { SourceAdapter } from "./SourceAdapter";

export class YoutubeAdapter extends SourceAdapter {
    private _ytData: YTDataApi;

    constructor(
        private _db: DatabaseController,
        _apiKey: string,
    ) {
        super(_db);
        this._ytData = new YTDataApi(_apiKey);
    }
    get sourceType(): SourceModule {
        return SourceModule.Youtube;
    }
    public addPodcast(podcast: Podcast) {
        if (podcast.sourceModule !== this.sourceType) {
            return;
        }
        if (false/* TODO: if exists in db */) {
            /*
            * TODO: Update entry if necessary.
            */
        } else {
            let detailsObs: Observable<Podcast>;
            if (podcast.sourceType === SourceType.Channel) {
                detailsObs = this._pullChannelDetails(podcast.sourceId)
                    .map((cDetails) => {
                        const pd: Podcast = { ...podcast };
                        if (!pd.title) {
                            pd.title = cDetails.title;
                        }
                        if (!pd.description) {
                            pd.description = cDetails.description;
                        }
                        if (!pd.author) {
                            pd.author = cDetails.title;
                        }
                        if (!pd.itunesSubtitle) {
                            pd.itunesSubtitle = cDetails.description.substring(0, 84);
                        }
                        if (!pd.siteUrl) {
                            pd.siteUrl = cDetails.channelUrl;
                        }
                        if (!pd.sourcePlaylistId) {
                            pd.sourcePlaylistId = cDetails.defaultPlaylist;
                        }
                        return pd;
                    });
            } else if (podcast.sourceType === SourceType.Playlist) {
                detailsObs = this._pullPlaylistDetails(podcast.sourceId)
                    .map((pDetails) => {
                        const pd: Podcast = { ...podcast };
                        if (!pd.title) {
                            pd.title = pDetails.title;
                        }
                        if (!pd.description) {
                            pd.description = pDetails.description;
                        }
                        if (!pd.author) {
                            pd.author = pDetails.title;
                        }
                        if (!pd.itunesSubtitle) {
                            pd.itunesSubtitle = pDetails.description.substring(0, 84);
                        }
                        if (!pd.siteUrl) {
                            pd.siteUrl = pDetails.playlistUrl;
                        }
                        if (!pd.sourcePlaylistId) {
                            pd.sourcePlaylistId = podcast.sourceId;
                        }
                        return pd;
                    });
            }
            if (!!detailsObs) {
                detailsObs.subscribe((pd) => {
                    /*
                    * TODO: Add to database.
                    */
                });
            }
        }
    }

    public checkUpdates() {
        throw new Error("Method not implemented.");
    }
    public handlePushUpdate(push: any) {
        throw new Error("Method not implemented.");
    }

    private _pullChannelDetails(channelId: string): Observable<IChannelDetails> {
        return this._ytData
            .retrieveChannelList(["contentDetails", "snippet"], false, channelId)
            .map((raw) => {
                const fetch = raw.items[0];
                const podcast = {} as IChannelDetails;
                podcast.title = fetch.snippet.title;
                podcast.thumbnail = fetch.snippet.thumbnails.high.url;
                podcast.defaultPlaylist = fetch.contentDetails.relatedPlaylists.uploads;
                podcast.channelUrl = "https://www.youtube.com/channel/" + channelId;
                return podcast;
            });
    }

    private _pullPlaylistItemsDetails(playlistId: string): Observable<IPlaylistItemsDetails[]> {
        return this._ytData
            .retrievePlaylistItemList(["snippet"], true, playlistId, 50)
            .map((raw) => {
                const playlist = [] as IPlaylistItemsDetails[];
                raw.items.forEach((item) => {
                    const entry = {} as IPlaylistItemsDetails;
                    entry.title = item.snippet.title;
                    entry.description = item.snippet.description;
                    entry.thumbnail = item.snippet.thumbnails.high.url;
                    entry.videoId = item.snippet.resourceId.videoId;
                });
                return playlist;
            });
    }

    private _pullPlaylistDetails(playlistId: string): Observable<IPlaylistDetails> {
        return this._ytData
            .retrievePlaylistList(["snippet"], false, playlistId, 1)
            .map((raw) => {
                const playlist = {} as IPlaylistDetails;
                playlist.channelId = raw.items[0].snippet.channelId;
                playlist.description = raw.items[0].snippet.description;
                playlist.title = raw.items[0].snippet.title;
                playlist.thumbnail = raw.items[0].snippet.thumbnails.high.url;
                playlist.playlistUrl = "https://www.youtube.com/playlist?list=" + playlistId;
                return playlist;
            });
    }
}

interface IChannelDetails {
    title: string;
    description: string;
    thumbnail: string;
    channelUrl: string;
    defaultLanguage: string;
    defaultPlaylist: string;
}

interface IPlaylistDetails {
    title: string;
    description: string;
    channelId: string;
    thumbnail: string;
    playlistUrl: string;
}

interface IPlaylistItemsDetails {
    title: string;
    description: string;
    thumbnail: string;
    videoId: string;
}
