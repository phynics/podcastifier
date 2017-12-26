import { DatabaseController } from "./DatabaseController";
import { FeedGenerator } from "./FeedGenerator";
import { FeedTranspiler } from "./FeedTranspiler";
import { Config, PodcastDefinition, PodcastEntryState, PodcastFeedEntry } from "./Models";
import { SourceAdapter } from "./SourceAdapter";
import { YoutubeAdapter } from "./YoutubeAdapter";

import * as chalk from "chalk";
import * as express from "express";
import * as fs from "fs";
import * as morgan from "morgan";
import * as rfs from "rotating-file-stream";

import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";

export class Podcastifier {
    private _expressServer: express.Express;
    private _databaseController: DatabaseController;
    private _adapters: { [type: number]: SourceAdapter };
    private _timer: Subject<number>;
    private _logStream = rfs("access.log", {
        interval: "1d",
        path: __dirname + "/" + this._configuration.logsPath,
        initialRotation: true,
    });

    constructor(
        private _configuration: Config,
        private _podcasts: PodcastDefinition[],
    ) {
        this._setupDirectories();
        this._timer = new Subject();
        this._databaseController = new DatabaseController(this._configuration.dbFile);
    }

    public start() {
        this._databaseController.init().subscribe(() => {
            this._expressServer = express();
            if (this._expressServer != null) {
                this._expressServer.listen(this._configuration.serverPort,
                    () => console.log(chalk.default.green("Started") +
                        " express server at port " +
                        this._configuration.serverPort + "."),
                );
            } else {
                throw new Error("Cannot find an express server instance.");
            }
            this._startAdapters();
            this._setupExpress();
        });
    }

    private _startAdapters() {
        console.log(chalk.default.green("Starting Adapters..."));

        // Setup your adapters here. TODO: Use reflections to setup adapters
        const ytAdapter = new YoutubeAdapter(this._databaseController, this._configuration.apiKey);

        this._adapters = {};
        this._adapters[ytAdapter.sourceModuleType] = ytAdapter;
        this._initialRun()
            .subscribe(() => {
                console.log(chalk.default.green("Initial run completed."));
                if (this._configuration.pollInterval > 0) {
                    console.log(chalk.default.green("Starting polling with " + this._configuration.pollInterval));
                    this._startPolling(true);
                } else {
                    this._startPolling(false);
                    console.log(chalk.default.yellow("No polling is setup"));
                }
                console.log(chalk.default.yellow("Setting up push notifications"));
                this._setupPushNotifications();
            });

    }

    private _startPolling(shouldPoll: boolean = false) {
        this._timer
            .throttleTime(3600000) // Don't poll more than once an hour, even if forced.
            .subscribe(() => this._checkAllRun());
        if (shouldPoll) {
            Observable.interval(this._configuration.pollInterval)
                .subscribe(() => {
                    this._timer.next(0);
                });
        }
    }

    /**
     * Makes sure that the working directories exist.
     */
    private _setupDirectories() {
        const directories = [
            __dirname + "/" + this._configuration.feedPath,
            __dirname + "/" + this._configuration.filePath,
            __dirname + "/" + this._configuration.logsPath,
        ];
        directories.filter((directory) => !fs.existsSync(directory))
            .forEach((directory) => fs.mkdirSync(directory));
    }

    private _setupExpress() {
        const app = this._expressServer;
        app.use(morgan("short", { stream: this._logStream }));

        // Serves the landing screen.
        app.get("/", (_, res) => {
            res.send("Podcastifier is serving the following feeds: <hr> <br>"
                + this._podcasts.map((value) => {
                    return "<a href=\"" + this._configuration.serverURL + ":" +
                        this._configuration.serverPort + "/feeds/" + value.alias +
                        "/podcast.xml\">" + value.title + "</a>";
                }).join("<br>"));
        });

        // Serves feeds for each podcast.
        app.get("/feeds/:podcastid/podcast.xml", (req, res) => {
            const podcastId: string = req.params.podcastid;
            if (fs.existsSync(__dirname + "/" + this._configuration.feedPath + podcastId + ".xml")) {
                res.sendFile(__dirname + "/" + this._configuration.feedPath + podcastId + ".xml");
            }
        });

        // Forces a poll.
        app.get("/finicks", (_, res) => {
            this._timer.next(0);
            res.sendStatus(418);
        });

        // Serves mp3 files for each episode.
        app.get("/files/:fileid/ep.mp3", (req, res) => {
            const fileId: string = req.params.fileid;
            if (fs.existsSync(__dirname + "/" + this._configuration.filePath + fileId + ".mp3")) {
                res.sendFile(__dirname + "/" + this._configuration.filePath + fileId + ".mp3");
            } else {
                res.sendStatus(404);
            }
        });
    }

    private _initialRun(): Observable<void> {
        const addPodcasts = Observable.forkJoin(
            this._podcasts.map((podcast) =>
                this._adapters[podcast.sourceModule]
                    .addPodcast(podcast)
                    .flatMap((result) => {
                        if (result) {
                            console.log(chalk.default.yellow("Loaded podcast"), podcast.alias);
                            return Observable.of(podcast);
                        } else {
                            console.log(chalk.default.yellow("Podcast already exists"), podcast.alias);
                            return Observable.empty<PodcastDefinition>();
                        }
                    }),
            ),
        );
        return addPodcasts.defaultIfEmpty().map(() => this._checkAllRun());
    }

    private _checkAllRun() {
        const updateObservables = Object.keys(this._adapters)
            .map((adapterKey) => this._adapters[adapterKey] as SourceAdapter)
            .map((adapter) => adapter.checkAllUpdates());
        Observable.merge(...updateObservables)
            .flatMap((updatedPods: string[]) => {
                if (updatedPods) {
                    return Observable.from(updatedPods);
                } else {
                    return Observable.empty<string>();
                }
            })
            .flatMap((updatedPod) =>
                this._processPodcast(updatedPod)
                    .filter((result) => result)
                    .map(() => updatedPod))
            .toArray()
            .defaultIfEmpty([])
            .subscribe((updatedPods) => {
                console.log(chalk.default.yellow("Update run completed."), "Following podcasts are updated:",
                    updatedPods.length > 0 ?
                        updatedPods.reduce((a, b) => a + "," + b) : "None");
            });
    }

    private _processPodcast(alias: string): Observable<boolean> {
        return this._databaseController.getPodcastFromAlias(alias)
            .flatMap((podcast) => {
                return this._adapters[podcast.sourceModule]
                    .checkUpdates(podcast.alias);
            })
            .flatMap(() => this._pruneAndFetchFeedEntries(alias))
            .flatMap(() => this._generateFeed(alias))
            .map(() => true)
            .defaultIfEmpty(false);
    }

    private _setupPushNotifications() {
        Object.keys(this._adapters)
            .filter((adapterKey) => {
                return (this._adapters[adapterKey] as SourceAdapter).supportsPushNotifications;
            })
            .forEach((adapterKey) => {
                const uri = this._configuration.serverURL + ":"
                    + this._configuration.serverPort + "/"
                    + "push/"
                    + adapterKey;
                const adapter = (this._adapters[adapterKey] as SourceAdapter);
                this._expressServer.all("/push/" + adapterKey, (req, res) => {
                    console.log("Received push notification event", req.headers, req.body);
                    const handlerResult = adapter.pushUpdateHandler([req, res]);
                    if (handlerResult) {
                        this._databaseController
                            .getPodcastsFromChannel(handlerResult)
                            .flatMap((arr) => Observable.from(arr))
                            .flatMap((pd) => adapter.checkUpdates(pd.alias)
                                .filter((result) => result)
                                .map(() => pd.alias))
                            .flatMap((val) => this._processPodcast(val))
                            .defaultIfEmpty(false)
                            .subscribe((podcast) => {
                                if (podcast) {
                                    console.log(chalk.default.green("Updated"), podcast, "via push notification.");
                                } else {
                                    console.log(chalk.default.green("Push notification resulted in no updates"));
                                }
                            });
                    }
                });

                adapter.setupPushUpdates(uri).subscribe(() => {
                    console.log("Successfully set up push notifications.");
                });
            });
    }

    private _pruneAndFetchFeedEntries(podcastAlias: string): Observable<void> {
        return this._databaseController
            .listEpisodes(podcastAlias)
            .map((array) => {
                return array.sort((a, b) => {
                    const aDate = Date.parse(a.pubDate);
                    const bDate = Date.parse(b.pubDate);
                    return bDate - aDate;
                });
            })
            .flatMap((episodes) => {
                console.log(chalk.default.yellow("Fetching episodes ") + "for", podcastAlias);
                const observables = new Array<Observable<void>>();
                episodes.slice(0, this._configuration.backlogSize)
                    .forEach((pd) => {
                        if (pd.state === PodcastEntryState.NEW
                            || !pd.localPath) {
                            console.log(chalk.default.green("New episode " + pd.id +
                                " from Podcast", pd.podcastAlias, pd.name));
                            observables.push(
                                this._transpileFeedEntry(pd)
                                    .flatMap((localPath) => {
                                        pd.localPath = localPath;
                                        pd.state = PodcastEntryState.TRANSPILED;
                                        return this._databaseController
                                            .addOrUpdateEpisode(pd)
                                            .map(() => { })
                                            .do(() => {
                                                console.log(chalk.default.green("Transpiled " + pd.id +
                                                    " from Podcast " + pd.podcastAlias));
                                            });
                                    }),
                            );
                        }
                    });
                episodes.slice(this._configuration.backlogSize).forEach((pd) => {
                    if (pd.state !== PodcastEntryState.OLD
                        || pd.localPath) {
                        console.log(chalk.default.red("Prunning episode " + pd.id +
                            " from podcast " + pd.podcastAlias));
                        pd.state = PodcastEntryState.OLD;
                        if (pd.localPath) {
                            console.log(chalk.default.red("Deleting episode " + pd.id));
                            observables.push(
                                Observable
                                    .bindCallback(fs.unlink)(pd.localPath)
                                    .flatMap(() => {
                                        pd.localPath = undefined;
                                        return this._databaseController.addOrUpdateEpisode(pd)
                                            .map(() => { });
                                    }),
                            );
                        } else {
                            observables.push(
                                this._databaseController
                                    .addOrUpdateEpisode(pd)
                                    .map(() => { }),
                            );
                        }
                    }
                });
                return Observable.forkJoin(observables).map(() => { });
            });
    }

    private _transpileFeedEntry(pd: PodcastFeedEntry): Observable<string> {
        if (pd.state === PodcastEntryState.NEW) {
            return FeedTranspiler.fetchAndTranspileEntry(pd, this._configuration.filePath, true);
        } else {
            console.log("Podcast is not marked new.", pd.id);
            return Observable.throw("Podcast is not marked new.");
        }
    }

    private _generateFeed(alias: string): Observable<NodeJS.ErrnoException> {
        return this._databaseController.listEpisodes(alias)
            .zip(this._databaseController.getPodcastFromAlias(alias))
            .flatMap(([episodes, podcast]) => {
                episodes = episodes.filter(
                    (pd) => pd.state === PodcastEntryState.PUBLISHED ||
                        pd.state === PodcastEntryState.TRANSPILED,
                );
                const xml = FeedGenerator.generateXml(podcast, episodes,
                    this._configuration.serverURL + ":" + this._configuration.serverPort);
                const obs = new Array<Observable<boolean>>();
                episodes.forEach((element) => {
                    element.state = PodcastEntryState.PUBLISHED;
                    obs.push(this._databaseController.addOrUpdateEpisode(element));
                });
                return Observable.forkJoin(obs).map(() => xml);
            })
            .flatMap((xml) => {
                return this._saveXml(xml, alias);
            })
            .do(() => console.log(chalk.default.green("Written feed for " + alias)));
    }

    private _saveXml(xml: string, alias: string): Observable<NodeJS.ErrnoException> {
        return Observable.bindCallback(fs.writeFile)
            (__dirname + "/" + this._configuration.feedPath + alias + ".xml", xml);
    }
}
