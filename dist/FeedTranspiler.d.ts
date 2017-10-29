import { PodcastFeed } from "./Models";
import { Observable, ReplaySubject } from "rxjs";
export declare class FeedTranspiler {
    private _xmlFeed;
    private _kStoDir;
    downloadFeed: ReplaySubject<PodcastFeed>;
    constructor(_xmlFeed: Observable<PodcastFeed>, _kStoDir?: string);
    private _pathBuilder(entryId);
    private _transpilePayload(stream, entry);
}
