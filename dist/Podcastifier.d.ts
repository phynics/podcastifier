import { Config, Podcast } from "./Models";
export declare class Podcastifier {
    private _configuration;
    private _podcasts;
    private _expressServer;
    private _feedScrapper;
    private _feedTranspiler;
    private _feedGenerator;
    constructor(_configuration: Config, _podcasts: Podcast[]);
    private _setupExpress();
    private _saveXml(xml, podcast);
}
