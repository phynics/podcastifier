import { DatabaseController } from "./DatabaseController";
import { FeedGenerator } from "./FeedGenerator";
import { FeedTranspiler } from "./FeedTranspiler";
import { Config, PodcastDefinition, PodcastEntryState, PodcastFeedEntry } from "./Models";
import { SourceAdapter } from "./SourceAdapter";
import { YoutubeAdapter } from "./YoutubeAdapter";

import * as chalk from "chalk";
import * as express from "express";
import * as fs from "fs";
import "rxjs/add/operators";
import { Observable } from "rxjs/Observable";

export class Podcastifier {
    private _expressServer: express.Express;
    private _databaseController: DatabaseController;
    private _adapters: { [type: number]: SourceAdapter };
    // TODO: Setup polling and push notifications.
    constructor(
        private _configuration: Config,
        private _podcasts: PodcastDefinition[],
    ) {
        this._setupExpress();
        this._setupDirectories();
        if (this._expressServer != null) {
            this._expressServer.listen(this._configuration.serverPort,
                () => console.log(chalk.default.green("Started") +
                    "express server at port " +
                    this._configuration.serverPort +
                    "."));
        }
        this._databaseController = new DatabaseController(this._configuration.dbFile);
        const ytAdapter = new YoutubeAdapter(this._databaseController, this._configuration.apiKey);
        this._adapters = {};
        this._adapters[ytAdapter.sourceType] = ytAdapter;
        /*
        this._feedGenerator = new Array<FeedGenerator>();
        this._feedTranspiler = new Array<FeedTranspiler>();
        */
        _podcasts.forEach((podcast) => {
            console.log("Found podcast", podcast.alias);
            this._adapters[podcast.sourceModule].addPodcast(podcast)
                .flatMap(() => {
                    console.log("Cheking updates for", podcast.alias);
                    return this._adapters[podcast.sourceModule].checkUpdates(podcast.alias);
                })
                .flatMap(() => this._pruneAndFetchFeedEntries(podcast.alias))
                .flatMap(() => this._generateFeed(podcast))
                .subscribe();
        });
    }

    private _pruneAndFetchFeedEntries(podcastAlias: string): Observable<void> {
        return this._databaseController
            .listEpisodes(podcastAlias)
            .flatMap((episodes) => {
                episodes.sort((a, b) => {
                    const aDate = Date.parse(a.pubDate);
                    const bDate = Date.parse(b.pubDate);
                    return aDate - bDate;
                });
                const obs: Array<Observable<void>> = [];
                episodes.slice(0, this._configuration.backlogSize - 1)
                    .forEach((pd) => {
                        if (pd.state === PodcastEntryState.NEW
                            || !pd.localPath) {
                            console.log(chalk.default.green("New episode " + pd.id +
                                " from Podcast " + pd.podcastAlias));
                            this._transpileFeedEntry(pd).subscribe((localPath) => {
                                pd.localPath = localPath;
                                pd.state = PodcastEntryState.TRANSPILED;
                                obs.push(this._databaseController.tryAddEpisode(pd));
                            });

                        }
                    });
                episodes.slice(this._configuration.backlogSize).forEach((pd) => {
                    if (pd.state !== PodcastEntryState.OLD
                        || pd.localPath) {
                        console.log(chalk.default.red("Prunning episode " + pd.id +
                            "from podcast " + pd.id));
                        pd.state = PodcastEntryState.OLD;
                        if (pd.localPath) {
                            fs.unlink(pd.localPath, () => {
                                pd.localPath = undefined;
                                obs.push(this._databaseController.tryAddEpisode(pd));
                            });
                        }
                    }
                });
                return Observable.zip(obs, () => { });
            });
    }

    private _transpileFeedEntry(pd: PodcastFeedEntry): Observable<string> {
        if (pd.state === PodcastEntryState.NEW) {
            return FeedTranspiler.fetchAndTranspileEntry(pd, this._configuration.filePath, true);
        } else {
            return Observable.empty();
        }
    }

    private _generateFeed(podcast: PodcastDefinition): Observable<NodeJS.ErrnoException> {
        return this._databaseController.listEpisodes(podcast.alias)
            .map((episodes) => {
                episodes = episodes.filter(
                    (pd) => pd.state === PodcastEntryState.PUBLISHED ||
                        pd.state === PodcastEntryState.TRANSPILED,
                );
                const xml = FeedGenerator.generateXml(podcast, episodes,
                    this._configuration.serverURL + ":" + this._configuration.serverPort);
                episodes.forEach((element) => {
                    element.state = PodcastEntryState.PUBLISHED;
                    this._databaseController.tryAddEpisode(element).subscribe();
                });
                return xml;
            })
            .flatMap((xml) => {
                return this._saveXml(xml, podcast.alias);
            });
    }

    private _setupDirectories() {
        fs.mkdir(__dirname + "/" + this._configuration.feedPath, () => { });
        fs.mkdir(__dirname + "/" + this._configuration.filePath, () => { });
    }

    private _setupExpress() {
        this._expressServer = express();
        const app = this._expressServer;

        app.get("/", (_, res) => {
            res.send("Podcastifier is serving the following feeds: <hr> <br>"
                + this._podcasts.map((value) => {
                    return "<a href=\"" + this._configuration.serverURL + ":" +
                        this._configuration.serverPort + "/feeds/" + value.alias +
                        "/podcast.xml\">" + value.title + "</a>";
                }).join("<br>"));
        });
        app.get("/feeds/:podcastid/podcast.xml", (req, res) => {
            const podcastId: string = req.params.podcastid;
            if (fs.existsSync(__dirname + "/" + this._configuration.feedPath + podcastId + ".xml")) {
                res.sendFile(__dirname + "/" + this._configuration.feedPath + podcastId + ".xml");
            }
        });
        /*
        app.get("/finicks", (_, res) => {
            this._databaseController.forEach((item) => {
                item.forceCheck();
            });
            res.sendStatus(418);
        });
        */
        app.get("/:fileid/ep.mp3", (req, res) => {
            const fileId: string = req.params.fileid;
            if (fs.existsSync(__dirname + "/" + this._configuration.filePath + fileId + ".mp3")) {
                res.sendFile(__dirname + "/" + this._configuration.filePath + fileId + ".mp3");
            }
        });
    }

    private _saveXml(xml: string, alias: string): Observable<NodeJS.ErrnoException> {
        return Observable.bindCallback(fs.writeFile)
            (__dirname + "/" + this._configuration.feedPath + alias + ".xml", xml);
    }
}
