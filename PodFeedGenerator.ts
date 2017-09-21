import { BehaviorSubject, Observable } from "rxjs";
import { ParsedFeedData, ParsedFeedEntry } from "./FeedData";
export class PodFeedGenerator {

    private _podFeed: BehaviorSubject<string>;
    
    constructor(
        private _transpileFeed: Observable<string>,
        private _downloadFeed: Observable<ParsedFeedData>,
        private _hostName: string
    ){

    }
}