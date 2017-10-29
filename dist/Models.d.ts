export interface Podcast {
    title: string;
    id: string;
    description: string;
    author: string;
    itunesSubtitle: string;
    image: string;
    youtubeUrl: string;
    siteUrl: string;
    lang: string;
}
export interface PodcastFeed extends Podcast {
    fetchDate: number;
    pubDate: string;
    data: PodcastFeedEntry[];
}
export interface PodcastFeedEntry {
    name: string;
    description: string;
    id: string;
    date: string;
    image: string;
    remoteUrl: string;
    localPath: string;
}
export interface Config {
    feedPath: string;
    filePath: string;
    pollInterval: number;
    backlogSize: number;
    serverURL: string;
    serverPort: number;
}
