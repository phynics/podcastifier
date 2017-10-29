import * as rxjs from "rxjs";
import { Podcast, PodcastFeed } from "./Models";
export declare class FeedScrapper {
    private _podcast;
    private _pollIntervalMS;
    private _backlogSize;
    private _throttleTime;
    feedSubject: rxjs.ReplaySubject<PodcastFeed>;
    private _mTrigger;
    constructor(_podcast: Podcast, _pollIntervalMS?: number, _backlogSize?: number, _throttleTime?: number);
    forceCheck(): void;
    private _fetchFeed();
    private _parseXML(xmlData);
}
