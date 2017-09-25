export interface Podcast {
    title: string,
    id: string,
    description: string,
    author: string,
    itunesSubtitle: string,
    itunesImage: string,
    youtubeUrl: string
}

export interface PodcastFeed extends Podcast {
    fetchDate: number;
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
    serverURL: string;
    serverPort: number;
}
