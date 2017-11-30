export interface PodcastDefinition {
    alias: string;
    sourceModule: SourceModule;
    sourceType?: SourceType;
    channelId?: string;
    playlistId?: string;
    title?: string;
    description?: string;
    author?: string;
    itunesSubtitle?: string;
    image?: string;
    siteUrl?: string;
}

export enum SourceType {
    Channel,
    Playlist,
}

export enum SourceModule {
    None = 0,
    Youtube = 1,
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
    logsPath: string;
    dbFile: string;
    pollInterval: number;
    backlogSize: number;
    serverURL: string;
    serverPort: number;
}
