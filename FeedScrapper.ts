import * as rxjs from "rxjs";
import * as rp from "request-promise-native";
import * as parser from "xml-parser";
import * as poller from "async-polling";

import { FeedData, FeedEntry } from "./FeedData";

export class FeedScrapper {
    public feedSubject: rxjs.ReplaySubject<FeedData>;

    constructor(
        private _feedName: string,
        private _feedUrl: string,
    ) {
        this.feedSubject = new rxjs.ReplaySubject<FeedData>(1);
        this.feedSubject.subscribe(() => console.log("Subject emmited"));
        this._fetchFeed();
    }

    private _fetchFeed() {
        poller(_ => {
            rp(this._feedUrl)
            .then((xml: string) => {
                var parsed: FeedData = this._parseXML(xml);
                console.log("Downloaded XML file " + parsed.fetchDate.toLocaleString());
                this.feedSubject.next(parsed);
            })
            .catch((error) => {
                console.log("Error downloading from URL: " + this._feedUrl);
            })
            ;
        }, 43200000).run();
    }

    public _parseXML(xmlData: string): FeedData {
        var xml = parser(xmlData);
        var feedData = {} as FeedData;
        feedData.data = new Array<FeedEntry>();

        feedData.name = xml.root.children
            .filter(elem => elem.name == "title")
        [0].content;

        feedData.fetchDate = Date.now();

        xml.root.children.filter(elem => elem.name == "entry")
            .forEach(elem => {
                var entry = {} as FeedEntry;
                entry.remoteUrl = elem.children
                    .filter(elem => elem.name == "link")[0]
                    .attributes["href"];
                entry.date = elem.children
                    .filter(elem => elem.name == "published")[0]
                    .content;
                entry.update = elem.children
                    .filter(elem => elem.name == "updated")[0]
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
                console.log("Parsed" + entry.name + " from " + feedData.name);
                feedData.data.push(entry);
            });

        return feedData;
    }
}
