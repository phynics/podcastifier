import { AppConfig, Podcasts } from "./Configuration";
import { Podcastifier } from "./Podcastifier";

const app = new Podcastifier(AppConfig, Podcasts);
app.start();
