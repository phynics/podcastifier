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
            author: feed.author,
            itunesSubtitle: feed.itunesSubtitle,
            itunesImage: feed.itunesImage,
            site_url: this._hostName,
            feed_url: this._hostName + "/feeds/" + feed.id + "/podcast.xml"

        } as IFeedOptions;
        console.log(JSON.stringify(podcastOptions));
        let pod = new podcast(podcastOptions);
        feed.data.forEach(element => {
            let opts: IItemOptions = {
                title: element.name,
                description: element.description,
                url: this._hostName + "/" + element.id,
                date: new Date(element.date),
                enclosure: {
                    url: element.image
                }
            } as IItemOptions;
            console.log(JSON.stringify(opts));
            pod.item(opts);
        });
        return pod.xml();
    }
}
