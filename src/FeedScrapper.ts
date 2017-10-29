import * as rxjs from "rxjs";
import * as rp from "request-promise-native";
import * as parser from "xml-parser";

import {
    Podcast,
    PodcastFeedEntry,
    PodcastFeed
} from "./Models";

export class FeedScrapper {
    public feedSubject: rxjs.ReplaySubject<PodcastFeed>;
    private _mTrigger: rxjs.Subject<number>;
    constructor(
        private _podcast: Podcast,
        private _pollIntervalMS: number = 43200000,
        private _backlogSize: number = 3,
        private _throttleTime: number = 600000
    ) {
        this.feedSubject = new rxjs.ReplaySubject<PodcastFeed>(1);
        this._mTrigger = new rxjs.Subject<number>();
    }

    public forceCheck() {
        this._mTrigger.next(0);
    }

    private _fetchFeed() {
        let service;
        console.log("Setting polling with " + this._pollIntervalMS + "ms intervals.");
        this._mTrigger.throttleTime(this._throttleTime)
            .subscribe(_ => {
                console.log("Checking the feed " + this._podcast.youtubeUrl);
                rp(this._podcast.youtubeUrl)
                    .then((xml: string) => {
                        let parsed: PodcastFeed = this._parseXML(xml);
                        console.log("Parsed XML file " + (new Date(parsed.fetchDate)).toLocaleString());
                        this.feedSubject.next(parsed);
                    })
                    .catch((error) => {
                        console.log(error.message);
                    });
            });
        rxjs.Observable.timer(25, this._pollIntervalMS).subscribe((num) => this._mTrigger.next(num));
    }

    private _parseXML(xmlData: string): PodcastFeed {
        let xml = parser(xmlData);
        let feedData = { ...this._podcast } as PodcastFeed;
        feedData.data = new Array<PodcastFeedEntry>();

        feedData.title = xml.root.children
            .filter(elem => elem.name == "title")[0]
            .content;
        feedData.pubDate = xml.root.children
            .filter(elem => elem.name == "published")[0]
            .content;

        feedData.fetchDate = Date.now();

        xml.root.children.filter(elem => elem.name == "entry")
            /*.sort((a, b) => {
                let aDate = new Date(a.children
                    .filter(elem => elem.name == "published" || "pubDate")[0] 
                    .content);
                let bDate = new Date(b.children
                    .filter(elem => elem.name == "published" || "pubDate")[0]
                    .content);
                    return bDate.getTime() - aDate.getTime();
            })*/
            .slice(0, this._backlogSize)
            .forEach(elem => {
                let entry = {} as PodcastFeedEntry;
                entry.remoteUrl = elem.children
                    .filter(elem => elem.name == "link")[0]
                    .attributes["href"];
                entry.date = elem.children
                    .filter(elem => elem.name == "published")[0]
                    .content;
                entry.id = elem.children
                    .filter(elem => elem.name == "yt:videoId")[0]
                    .content;
                elem.children.filter(elem => elem.name == "media:group")[0]
                    .children.forEach(elem => {
                        switch (elem.name) {
                            case "media:title":
                                entry.name = elem.content;
                                break;
                            case "media:thumbnail":
                                entry.image = elem.attributes["url"];
                                entry.image = entry.image.replace("hqdefault.jpg", "maxresdefault.jpg");
                                break;
                            case "media:description":
                                entry.description = elem.content;
                                break;
                        }
                    });
                console.log("Parsed " + entry.name + " from " + feedData.title);
                feedData.data.push(entry);
            });

        return feedData;
    }
}
