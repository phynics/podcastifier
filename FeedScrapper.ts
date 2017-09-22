import * as rxjs from "rxjs";
import * as rp from "request-promise-native";
import * as parser from "xml-parser";
import * as poller from "async-polling";

import { ParsedFeedData, ParsedFeedEntry } from "./FeedData";

export class FeedScrapper {
    public feedSubject: rxjs.ReplaySubject<ParsedFeedData>;

    constructor(
        private _feedName: string,
        private _feedUrl: string,
        private _pollIntervalMS: number = 43200000
    ) {
        this.feedSubject = new rxjs.ReplaySubject<ParsedFeedData>(1);
        this.feedSubject.subscribe(() => console.log("Fetched new XML file"));
        this._fetchFeed();
    }

    private _fetchFeed() {
        console.log("Setting polling with " + this._pollIntervalMS)
        poller(_ => {
            console.log("Checking the feed")
            rp(this._feedUrl)
            .then((xml: string) => {
                var parsed: ParsedFeedData = this._parseXML(xml);
                console.log("Parsed XML file " + (new Date(parsed.fetchDate)).toLocaleString());
                this.feedSubject.next(parsed);
            })
            .catch((error) => {
                console.log("Error downloading from URL: " + this._feedUrl);
            })
            ;
        }, this._pollIntervalMS).run();
    }

    public _parseXML(xmlData: string): ParsedFeedData {
        var xml = parser(xmlData);
        var feedData = {} as ParsedFeedData;
        feedData.data = new Array<ParsedFeedEntry>();

        feedData.name = xml.root.children
            .filter(elem => elem.name == "title")
        [0].content;

        feedData.fetchDate = Date.now();

        xml.root.children.filter(elem => elem.name == "entry").slice(0,5)
            .forEach(elem => {
                var entry = {} as ParsedFeedEntry;
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
                console.log("Parsed " + entry.name + " from " + feedData.name);
                feedData.data.push(entry);
            });

        return feedData;
    }
}
