import { Config, Podcast } from "./Models";
import { FeedScrapper } from "./FeedScrapper";
import { FeedTranspiler } from "./FeedTranspiler";
import { PodFeedGenerator } from "./PodFeedGenerator";
import * as express from "express";
import * as fs from "fs";

export class Podcastifier {
    private _expressServer: express.Express;
    private _feedScrapper: FeedScrapper;
    constructor(
        private _configuration: Config,
        private _podcasts: Podcast[]
    ) {
        this._setupExpress();
    }

    start() {
        if(this._expressServer != null) {
            this._expressServer.listen(this._configuration.serverPort,
                 () => console.log("Started express server at port " + this._configuration.serverPort + "."));
        }
    }

    private _setupExpress() {
        this._expressServer = express();
        let exp = this._expressServer;

        exp.get("/", (req, res) => {
            res.send("Podcastifier is serving the following feeds: <hr> <br>"
                + this._podcasts.map((value) => value.title).join("<br>"));
        });
        exp.get("/feeds/:podcastid/podcast.xml", (req,res) => {
            var podcastId: string = req.params["podcastid"];
            if(fs.existsSync(this._configuration.feedPath + "/" + podcastId + ".xml")){
                res.sendFile(this._configuration.feedPath + "/" + podcastId + ".xml");
            }
        });
        exp.get("/feeds/:podcastid/:fileid", (req,res) => {
            var fileId: string = req.params["fileid"];
            if(fs.existsSync(this._configuration.filePath + "/" + fileId + ".mp3")){
                res.sendFile(this._configuration.filePath + "/" + fileId + ".mp3");
            }
        });
    }
}