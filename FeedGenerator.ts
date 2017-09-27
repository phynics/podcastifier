import { ReplaySubject, Observable } from "rxjs";
import {
    PodcastFeed,
    PodcastFeedEntry
} from "./Models";
import * as podcast from "podcast";

export class FeedGenerator {
    public xmlPodcastFeed: ReplaySubject<string>;

    constructor(
        private _transpileFeed: Observable<PodcastFeed>,
        private _hostName: string
    ) {
        this.xmlPodcastFeed = new ReplaySubject(1);
        _transpileFeed.subscribe((df: PodcastFeed) => {
            console.log("Generating an XML file...")
            this.xmlPodcastFeed.next(this._generateXml(df));
        }
        );
    }

    private _generateXml(feed: PodcastFeed): string {
        let podcastOptions: IFeedOptions = {
            title: feed.title,
            description: feed.description,
            image_url: feed.image,
            author: feed.author,
            pubDate: new Date(feed.pubDate),
            itunesSubtitle: feed.itunesSubtitle,
            itunesAuthor: feed.author,
            itunesSummary: feed.itunesSubtitle,
            site_url: feed.siteUrl,
            language: feed.lang,
            feed_url: this._hostName + "/feeds/" + feed.id + "/podcast.xml"

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
