import { Config, PodcastDefinition, SourceModule, SourceType } from "./Models";

// tslint:disable:max-line-length
// tslint:disable:variable-name
export const Podcasts: PodcastDefinition[] = [
    {
        alias: "gkyprmrm",
        author: "Bir Meramfer",
        description:
        "Geekyapar // Meram Youtube kanalı için Podcast uyumlu akış. \
        \nAkış son 3 video'nun ses dosyalarını içerir.",
        image: "https://yt3.ggpht.com/-dGNvm7rfF2w/AAAAAAAAAAI/AAAAAAAAAAA/d7X9GtVZOUs/s288-c-k-no-mo-rj-c0xffffff/photo.jpg",
        itunesSubtitle: "Geekyapar // Meram Youtube kanalı için Podcast akışı.",
        siteUrl: "https://www.youtube.com/channel/UCg6pmeCcngcd07afcdiF1pQ",
        channelId: "UCg6pmeCcngcd07afcdiF1pQ",
        sourceModule: SourceModule.Youtube,
        sourceType: SourceType.Channel,
        title: "Geekyapar // Meram",
    },
    {
        alias: "gkyprotm",
        author: "Bir Meramfer",
        description:
        "Geekyapar Youtube kanalı // O Tarz Mı için Podcast uyumlu akış. \
        \nAkış son 3 video'nun ses dosyalarını içerir.",
        image: "https://yt3.ggpht.com/-dGNvm7rfF2w/AAAAAAAAAAI/AAAAAAAAAAA/d7X9GtVZOUs/s288-c-k-no-mo-rj-c0xffffff/photo.jpg",
        itunesSubtitle: "Geekyapar Youtube kanalı // O Tarz Mı için Podcast akışı.",
        siteUrl: "https://www.youtube.com/user/geekyapar",
        playlistId: "PLpc4Qt8xOe8WEu18WzY4-AWFfScsJ9DdS",
        sourceModule: SourceModule.Youtube,
        sourceType: SourceType.Playlist,
        title: "Geekyapar // O Tarz Mı?",
    },

];
export const AppConfig: Config = {
    apiKey: "AKEY",
    backlogSize: 3,
    dbFile: "feeds.db",
    feedPath: "feeds/",
    filePath: "storage/",
    pollInterval: 86400000,
    serverPort: 8080,
    serverURL: "http://18.194.120.95",
};
