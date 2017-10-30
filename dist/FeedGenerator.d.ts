import { Observable } from "rxjs";
import { PodcastFeed } from "./Models";
export declare class FeedGenerator {
    private _hostName;
    private _xmlPodcastFeed;
    constructor(_transpileFeed: Observable<PodcastFeed>, _hostName: string);
    readonly xmlPodcastFeed: Observable<string>;
    private _generateXml(feed);
}
