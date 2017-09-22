import { BehaviorSubject, Observable } from "rxjs";
import {
    ParsedFeedData,
    ParsedFeedEntry,
    IdMap
} from "./FeedData";
import * as podcast from "podcast";

export class PodFeedGenerator {

    public podFilledFeed: BehaviorSubject<string>;
    private _presentAudioFiles: IdMap[];
    
    constructor(
        private _transpileFeed: Observable<IdMap>,
        private _downloadFeed: Observable<ParsedFeedData>,
        private _hostName: string,
        private _feedName: string
    ){
        this._presentAudioFiles = new Array<IdMap>();
        _transpileFeed.distinct().subscribe((file) => this._presentAudioFiles.push(file));
        this.podFilledFeed = new BehaviorSubject(undefined);
        _downloadFeed.combineLatest(
            [_transpileFeed],
            (df: ParsedFeedData, tf: IdMap) => {
                   this.podFilledFeed.next(this._generateXml(df));
            }
        );
    }

    private _generateXml(feed: ParsedFeedData): string {
        
        var podcastOptions: IFeedOptions = {
            title: feed.name,
            feed_url: this._feedName,
            site_url: this._hostName,
            author: "@Fan",

        } as IFeedOptions;
        var pod = new Podcast(podcastOptions);

        feed.data.forEach(element => {
            var path = this._presentAudioFiles.filter((obj) => obj.id == element.id)[0];
            var opts: IItemOptions = {
                title: element.name,
                description: element.description,
                url: path ? path.path : undefined,
                date: new Date(element.date),
                enclosure: {
                    url: element.image
                }
            } as IItemOptions;
            pod.item(opts);
        });
        return pod.xml();
    }
}
