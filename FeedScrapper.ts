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

    constructor(
        private _podcast: Podcast,
        private _pollIntervalMS: number = 43200000
    ) {
        this.feedSubject = new rxjs.ReplaySubject<PodcastFeed>(1);
        this._fetchFeed();
    }

    private _fetchFeed() {
        console.log("Setting polling with " + this._pollIntervalMS + "ms intervals.")
        rxjs.Observable.timer(25, this._pollIntervalMS).subscribe(_ => {
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
    }

    private _parseXML(xmlData: string): PodcastFeed {
        let xml = parser(xmlData);
        let feedData = {} as PodcastFeed;
        feedData.data = new Array<PodcastFeedEntry>();

        feedData.title = xml.root.children
            .filter(elem => elem.name == "title")[0]
            .content;

        feedData.fetchDate = Date.now();

        xml.root.children.filter(elem => elem.name == "entry").slice(0,3)
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
                            case "media:thumbnail":
                                entry.image = elem.attributes["url"];
                                break;
                            case "media:description":
                                entry.description = elem.content;
                        }
                    });
                console.log("Parsed " + entry.name + " from " + feedData.title);
                feedData.data.push(entry);
            });

        return feedData;
    }
}
