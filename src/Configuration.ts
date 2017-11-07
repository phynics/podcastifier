import { Config, Podcast, SourceModule, SourceType } from "./Models";

// tslint:disable:max-line-length
export let Podcasts: Podcast[] = [
    {
        alias: "gkyprmrm",
        author: "Bir Meramfer",
        description:
        "Geekyapar // Meram Youtube kanalı için Podcast uyumlu akış. \
        \nAkış son 3 video'nun ses dosyalarını içerir.",
        image: "https://yt3.ggpht.com/-dGNvm7rfF2w/AAAAAAAAAAI/AAAAAAAAAAA/d7X9GtVZOUs/s288-c-k-no-mo-rj-c0xffffff/photo.jpg",
        itunesSubtitle: "Geekyapar // Meram Youtube kanalı için Podcast akışı.",
        siteUrl: "https://www.youtube.com/channel/UCg6pmeCcngcd07afcdiF1pQ",
        sourceId: "UCg6pmeCcngcd07afcdiF1pQ",
        sourceModule: SourceModule.Youtube,
        sourceType: SourceType.Channel,
        title: "Geekyapar // Meram",
    },
];
export let AppConfig: Config = {
    backlogSize: 3,
    feedPath: "feeds/",
    filePath: "storage/",
    pollInterval: 43200000,
    serverPort: 8080,
    serverURL: "http://18.194.120.95",
};
