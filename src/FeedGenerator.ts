import * as podcaster from "podcast";
import {
    PodcastDefinition,
    PodcastFeedEntry,
} from "./Models";

export class FeedGenerator {
    public static generateXml(
        podcast: PodcastDefinition,
        episodes: PodcastFeedEntry[],
        hostName: string,
    ): string {
        const podcastOptions: IFeedOptions = {
            title: podcast.title,
            description: podcast.description,
            itunesImage: podcast.image,
            image_url: podcast.image,
            author: podcast.author,
            pubDate: new Date(),
            itunesSubtitle: podcast.itunesSubtitle,
            itunesAuthor: podcast.author,
            itunesSummary: podcast.itunesSubtitle,
            site_url: podcast.siteUrl,
            feed_url: hostName + "/feeds/" + podcast.alias + "/podcast.xml",
        };
        const pod = new podcaster(podcastOptions);
        episodes.forEach((element) => {
            const opts: IItemOptions = {
                title: element.name,
                description: element.description,
                url: element.remoteUrl,
                guid: element.id,
                date: new Date(element.pubDate),
                enclosure: {
                    url: hostName + "/files/" + element.id + "/ep.mp3",
                    mime: "audio/mpeg",
                },
                itunesImage: element.image,
                itunesSubtitle: element.description.split("---")[0] || podcast.itunesSubtitle,
            } as IItemOptions;
            pod.item(opts);
        });
        return pod.xml();
    }
}
