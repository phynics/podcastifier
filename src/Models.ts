export interface PodcastDefinition {
    alias: string;
    sourceId: string;
    sourceModule: SourceModule;
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
    Playlist,
}

export enum SourceModule {
    None,
    Youtube,
}

export interface PodcastFeedEntry {
    podcastAlias: string;
    pubDate: string;
    name: string;
    description: string;
    id: string;
    image: string;
    remoteUrl: string;
    localPath: string;
    state: PodcastEntryState;
}

export enum PodcastEntryState {
    PUBLISHED,
    TRANSPILED,
    NEW,
    OLD,
}
export interface Config {
    apiKey: string;
    feedPath: string;
    filePath: string;
    dbFile: string;
    pollInterval: number;
    backlogSize: number;
    serverURL: string;
    serverPort: number;
}
