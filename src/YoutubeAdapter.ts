
import { Request, Response } from "express";
import * as request from "request";
import { Observable } from "rxjs/Observable";
import { YTDataApi } from "ytdata";

import { URL } from "url";
import { DatabaseController } from "./DatabaseController";
import { PodcastDefinition, PodcastEntryState, PodcastFeedEntry, SourceModule, SourceType } from "./Models";
import { SourceAdapter } from "./SourceAdapter";

export class YoutubeAdapter extends SourceAdapter {
    private _ytData: YTDataApi;
    private _kPushHubUri = "https://pubsubhubbub.appspot.com";
    private _kPushHubTopic = "https://www.youtube.com/xml/feeds/videos.xml?channel_id=";
    private _pushUri: string;
    private _pushResubscription;

    constructor(
        private _db: DatabaseController,
        _apiKey: string,
    ) {
        super(_db);
        this._ytData = new YTDataApi(_apiKey);
    }

    /**
     * @returns Type enumeration for this Source Adapter.
     */
    get sourceModuleType(): SourceModule {
        return SourceModule.Youtube;
    }

    /**
     * Whether this modules supports (can setup), push notifications.
     */
    get supportsPushNotifications(): boolean {
        return true;
    }

    /**
     * Checks updates to a single podcast.
     * @param alias Alias for the podcast to be checked.
     * @returns A Boolean Observable; true if the podcast is updated, false otherwise.
     */
    public checkUpdates(alias: string): Observable<boolean> {
        return this._db.getPodcastFromAlias(alias)
            .flatMap((pod) => {
                if (pod.sourceModule === this.sourceModuleType) {
                    return Observable.empty();
                }
                return this._pullPlaylistItemsDetails(pod.playlistId)
                    .flatMap((fetchedList): Observable<IPlaylistItemsDetails> => {
                        return Observable.of(...fetchedList);
                    })
                    .flatMap((fetchedEntry) => {
                        return this._db.doesEpisodeExist(fetchedEntry.videoId)
                            .flatMap((exists) => {
                                if (!exists) {
                                    const dbEntry: PodcastFeedEntry = {} as PodcastFeedEntry;
                                    dbEntry.description = fetchedEntry.description;
                                    dbEntry.id = fetchedEntry.videoId;
                                    dbEntry.image = fetchedEntry.thumbnail;
                                    dbEntry.name = fetchedEntry.title;
                                    dbEntry.podcastAlias = alias;
                                    dbEntry.pubDate = fetchedEntry.date;
                                    dbEntry.remoteUrl = "https://www.youtube.com/watch?v=" + fetchedEntry.videoId;
                                    dbEntry.state = PodcastEntryState.NEW;
                                    return this._db.addOrUpdateEpisode(dbEntry);
                                } else {
                                    return Observable.of(false);
                                }
                            });
                    })
                    .toArray()
                    .map((arr) => arr.filter((value) => value === true).length > 0 ? true : false);
            });
    }

    /**
     * Checks all podcasts managed by this SourceAdapter for updates.
     * @returns Observable for the list of podcast aliases for the
     * updated Podcasts.
     */
    public checkAllUpdates(): Observable<PodcastDefinition[]> {
        return this._db.listPodcastsFromSource(this.sourceModuleType)
            .flatMap((pods) => {
                const obs = new Array<Observable<PodcastDefinition>>();
                pods.forEach((pod) => {
                    obs.push(
                        this.checkUpdates(pod.alias).flatMap((result) => {
                            if (result) {
                                return Observable.of(pod);
                            } else {
                                return Observable.empty();
                            }
                        }),
                    );
                });
                return Observable.forkJoin(obs);
            });
    }
    /**
     * Sets up push updates for the given uri.
     * @param uri the local webhook point.
     */
    public setupPushUpdates(uri: string): Observable<void> {
        this._pushUri = uri;
        return this._db.listPodcastsFromSource(this.sourceModuleType)
            .map((podcasts) => {
                return podcasts
                    .map((pd) => pd.channelId)
                    .filter((x, i, a) => a.indexOf(x) === i);
            })
            .flatMap((podcastChannelIds) => {
                return Observable.forkJoin(
                    podcastChannelIds.map((cid) => {
                        return new Observable<string>((observer) => {
                            const options = {
                                url: this._kPushHubUri,
                                form: {
                                    "hub.mode": "subscribe",
                                    "hub.topic": this._kPushHubTopic + cid,
                                    "hub.callback": uri,
                                    "hub.verify": "sync",
                                },
                                encoding: "utf-8",
                            };
                            request.post(options, (error: any, _, body: any) => {
                                if (error) {
                                    observer.error(error as string);
                                }
                                observer.next(body as string);
                                observer.complete();
                            });
                        });
                    }));
            })
            .map(() => { });
    }

    /**
     * Provides a function for handling push notifications.
     * @param update received notification.
     * @returns true if an update is necessary.
     */
    public pushUpdateHandler(update: [Request, Response]): string {
        const req = update[0];
        const res = update[1];

        const challenge = req.query["hub.challenge"];
        if (challenge) {
            res.status(200).send(challenge);
            if (!this._pushResubscription) {
                const timeout = req.query["hub.lease_seconds"] * 1000;
                this._pushResubscription = setTimeout(() => {
                    this._pushResubscription = undefined;
                    this.setupPushUpdates(this._pushUri);
                },
                timeout,
            );
            }
            // tslint:disable-next-line:triple-equals
            return undefined;
        } else if (req.method === "POST") {
            console.log(req.headers, req.header["link"], req.headers["link"]);
            console.log(JSON.stringify(req.headers["link"].toString().split(new RegExp("[<,>]"))));
            const url = new URL(
                req.headers["link"].toString().split(new RegExp("[<,>]"))[1],
            );
            const parsedResponse = url.searchParams.get("channel_id");
            console.log("Recovered topic", parsedResponse);
            res.sendStatus(200);
            return parsedResponse;
        }
    }

    /**
     * Adds the passed podcast to the database or updates its entry
     * if it already exists.
     * @param podcast the podcast to be added
     * @returns Boolean Observable that returns true if the podcast
     * is added, false otherwise.
     */
    protected _onAddPodcast(podcast: PodcastDefinition): Observable<boolean> {
        return this._db.doesPodcastExist(podcast.alias)
            .flatMap((exists) => {
                if (exists) {
                    return this._db.addOrUpdatePodcast(podcast);
                } else {
                    let detailsObs: Observable<IChannelDetails | IPlaylistDetails>;
                    if (podcast.sourceType === SourceType.Channel
                        && podcast.channelId !== undefined) {
                        detailsObs = this._pullChannelDetails(podcast.channelId);
                    } else if (podcast.sourceType === SourceType.Playlist
                        && podcast.playlistId !== undefined) {
                        detailsObs = this._pullPlaylistDetails(podcast.playlistId);
                    }
                    if (!!detailsObs) {
                        return detailsObs
                            .map((details) => this._fillPodcastDefinition(podcast, details))
                            .flatMap((pd) => {
                                pd.sourceModule = this.sourceModuleType;
                                return this._db.addOrUpdatePodcast(pd);
                            });
                    }
                }

            });
    }

    private _fillPodcastDefinition(
        podcast: PodcastDefinition,
        details: IChannelDetails | IPlaylistDetails,
    ): PodcastDefinition {
        const pd: PodcastDefinition = { ...podcast };
        pd.sourceModule = this.sourceModuleType;
        if (!pd.title) {
            pd.title = details.title;
        }
        if (!pd.description) {
            pd.description = details.description;
        }
        if (!pd.author) {
            pd.author = details.title;
        }
        if (!pd.itunesSubtitle) {
            pd.itunesSubtitle = details.description.substring(0, 84);
        }

        if (isIChannelDetails(details)) {
            if (!pd.siteUrl) {
                pd.siteUrl = details.channelUrl;
            }
            if (!pd.playlistId) {
                pd.playlistId = details.defaultPlaylist;
            }
        } else if (isIPlaylistDetails(details)) {
            if (!pd.siteUrl) {
                pd.siteUrl = details.playlistUrl;
            }
            if (!pd.channelId) {
                pd.channelId = details.channelId;
            }
        }
        return pd;
    }

    private _pullChannelDetails(channelId: string): Observable<IChannelDetails> {
        return this._ytData
            .retrieveChannelList(["contentDetails", "snippet"], false, channelId)
            .map((raw) => {
                const fetch = raw.items[0];
                const podcast = {} as IChannelDetails;
                podcast.title = fetch.snippet.title;
                podcast.thumbnail = fetch.snippet.thumbnails["high"].url;
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
                    entry.date = item.snippet.publishedAt;
                    entry.description = item.snippet.description;
                    entry.thumbnail = item.snippet.thumbnails["high"].url;
                    entry.videoId = item.snippet.resourceId.videoId;
                    playlist.push(entry);
                });
                return playlist;
            });
    }

    private _pullPlaylistDetails(playlistId: string): Observable<IPlaylistDetails> {
        return this._ytData
            .retrievePlaylistList(["snippet"], false, playlistId)
            .map((raw) => {
                const playlist = {} as IPlaylistDetails;
                playlist.channelId = raw.items[0].snippet.channelId;
                playlist.description = raw.items[0].snippet.description;
                playlist.title = raw.items[0].snippet.title;
                playlist.thumbnail = raw.items[0].snippet.thumbnails["high"].url;
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

function isIChannelDetails(arg: any): arg is IChannelDetails {
    return arg.title !== undefined
        && arg.thumbnail !== undefined
        && arg.defaultPlaylist !== undefined;
}

interface IPlaylistDetails {
    title: string;
    description: string;
    channelId: string;
    thumbnail: string;
    playlistUrl: string;
}

function isIPlaylistDetails(arg: any): arg is IPlaylistDetails {
    return arg.title !== undefined
        && arg.thumbnail !== undefined
        && arg.channelId !== undefined;
}

interface IPlaylistItemsDetails {
    title: string;
    date: string;
    description: string;
    thumbnail: string;
    videoId: string;
}
