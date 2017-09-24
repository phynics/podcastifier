import { Podcast, Config } from "./Models"
export let Podcasts: Podcast[] = [
    {
        title: "Geekyapar // Meram",
        id: "gkyprmrm",
        description: 
        "Geekyapar // Meram Youtube kanalı için Podcast uyumlu akış. \
        \n Akış son 3 videonun ses dosyalarını içerir.",
        author: "Meramfer",
        itunesSubtitle: "Geekyapar // Meram Youtube kanalı için Podcast akışı.",
        itunesImage: "https://yt3.ggpht.com/-dGNvm7rfF2w/AAAAAAAAAAI/AAAAAAAAAAA/d7X9GtVZOUs/s288-c-k-no-mo-rj-c0xffffff/photo.jpg",
        youtubeUrl: "http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ"
    }
]
export let AppConfig: Config = {
    feedPath: "feeds/",
    filePath: "storage/",
    serverPort: 8080
}