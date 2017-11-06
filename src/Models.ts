export interface Podcast {
    alias: string;
    sourceId: string;
    sourceModule: SourceModule.Youtube;
    sourceType?: SourceType;
    title?: string;
    description?: string;
    author?: string;
    itunesSubtitle?: string;
    image?: string;
    siteUrl?: string;
    sourcePlaylistId?: string;
}

export enum SourceType {
    Channel,
    Playlist
}

export enum SourceModule {
    None,
    Youtube
}

export interface PodcastFetch extends Podcast {
    podcastAlias: string;
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
