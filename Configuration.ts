import { Podcast, Config } from "./Models"
export let Podcasts: Podcast[] = [
    {
        title: "Geekyapar // Meram",
        id: "gkyprmrm",
        description: 
        "Geekyapar // Meram Youtube kanalı için Podcast uyumlu akış. \
        \nAkış son 3 video'nun ses dosyalarını içerir.",
        author: "Bir Meramfer",
        siteUrl: "https://www.youtube.com/channel/UCg6pmeCcngcd07afcdiF1pQ",
        itunesSubtitle: "Geekyapar // Meram Youtube kanalı için Podcast akışı.",
        image: "https://yt3.ggpht.com/-dGNvm7rfF2w/AAAAAAAAAAI/AAAAAAAAAAA/d7X9GtVZOUs/s288-c-k-no-mo-rj-c0xffffff/photo.jpg",
        youtubeUrl: "http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ",
        lang: "tr"
    }
];
export let AppConfig: Config = {
    feedPath: "feeds/",
    filePath: "storage/",
    backlogSize: 3,
    pollInterval: 43200000,
    serverURL: "http://18.194.120.95",
    serverPort: 8080
};
export let API = {
    key: ""
};
