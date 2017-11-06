import { ReplaySubject, Observable } from "rxjs";
import {
    PodcastFetch
} from "./Models";
import * as podcast from "podcast";

export class FeedGenerator {

    private _xmlPodcastFeed: ReplaySubject<string>;

    constructor(
        _transpileFeed: Observable<PodcastFetch>,
        private _hostName: string
    ) {
        this._xmlPodcastFeed = new ReplaySubject(1);
        _transpileFeed.subscribe((df: PodcastFetch) => {
            console.log("Generating an XML file...")
            this._xmlPodcastFeed.next(this._generateXml(df));
        }
        );
    }

    public get xmlPodcastFeed(): Observable<string> {
        return this._xmlPodcastFeed.asObservable();
    }

    private _generateXml(feed: PodcastFetch): string {
        let podcastOptions: IFeedOptions = {
            title: feed.title,
            description: feed.description,
            itunesImage: feed.image,
            image_url: feed.image,
            author: feed.author,
            pubDate: new Date(feed.pubDate),
            itunesSubtitle: feed.itunesSubtitle,
            itunesAuthor: feed.author,
            itunesSummary: feed.itunesSubtitle,
            site_url: feed.siteUrl,
            feed_url: this._hostName + "/feeds/" + feed.alias + "/podcast.xml"

        };
        let pod = new podcast(podcastOptions);
        feed.data.forEach(element => {
            let opts: IItemOptions = {
                title: element.name,
                description: element.description,
                url: element.remoteUrl,
                guid: element.id,
                date: new Date(element.date),
                enclosure: {
                    url: this._hostName + "/" + element.id + "/ep.mp3",
                    mime: "audio/mpeg"
                },
                itunesImage: element.image,
                itunesSubtitle: element.description.split("---")[0] || feed.itunesSubtitle
            } as IItemOptions;
            pod.item(opts);
        });
        return pod.xml();
    }
}
