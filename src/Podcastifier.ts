import { DatabaseController } from "./DatabaseController";
import { FeedGenerator } from "./FeedGenerator";
import { FeedTranspiler } from "./FeedTranspiler";
import { Config, PodcastDefinition, PodcastEntryState, PodcastFeedEntry } from "./Models";
import { SourceAdapter } from "./SourceAdapter";
import { YoutubeAdapter } from "./YoutubeAdapter";

import * as chalk from "chalk";
import * as express from "express";
import * as fs from "fs";

import { Observable } from "rxjs/Observable";
import { ReplaySubject } from "rxjs/ReplaySubject";

// Push notifications and teardown logic
export class Podcastifier {
    private _expressServer: express.Express;
    private _databaseController: DatabaseController;
    private _adapters: { [type: number]: SourceAdapter };
    private _timer: ReplaySubject<number>;

    constructor(
        private _configuration: Config,
        private _podcasts: PodcastDefinition[],
    ) {
        this._setupExpress();
        this._setupDirectories();
        if (this._expressServer != null) {
            this._expressServer.listen(this._configuration.serverPort,
                () => console.log(chalk.default.green("Started") +
                    " express server at port " +
                    this._configuration.serverPort + "."),
            );
        }

        this._databaseController = new DatabaseController(this._configuration.dbFile);
        this._databaseController.init().subscribe(() => {
            this._startAdapters();
        });
    }

    private _startAdapters() {
        console.log(chalk.default.green("Starting Adapters"));
        const ytAdapter = new YoutubeAdapter(this._databaseController, this._configuration.apiKey);
        this._adapters = {};
        this._adapters[ytAdapter.sourceModuleType] = ytAdapter;
        this._initialRun();
        this._startPolling();
        this._setupPushNotifications();
    }

    private _startPolling() {
        this._timer = new ReplaySubject(0);
        this._timer
            .throttleTime(3600000)
            .subscribe(() => {
                console.log(chalk.default.yellow("Polling with " + this._configuration.pollInterval));
                this._checkAllRun();
            });
        Observable.interval(this._configuration.pollInterval)
            .subscribe(() => {
                this._timer.next(0);
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

        app.get("/finicks", (_, res) => {
            this._timer.next(0);
            res.sendStatus(418);
        });

        app.get("/files/:fileid/ep.mp3", (req, res) => {
            const fileId: string = req.params.fileid;
            if (fs.existsSync(__dirname + "/" + this._configuration.filePath + fileId + ".mp3")) {
                res.sendFile(__dirname + "/" + this._configuration.filePath + fileId + ".mp3");
            } else {
                res.sendStatus(404);
            }
        });
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
                    console.log("Received push notification event");
                    const handlerResult = adapter.pushUpdateHandler([req, res]);
                    if (handlerResult) {
                        handlerResult
                            .flatMap((toUpdate) => {
                                const obs = new Array<Observable<any>>();
                                if (toUpdate !== undefined) {
                                    toUpdate.forEach((pod) => {
                                        obs.push(
                                            this._databaseController.getPodcastFromAlias(pod)
                                                .flatMap((podcast) => {
                                                    return this._adapters[podcast.sourceModule]
                                                        .checkUpdates(pod);
                                                }));
                                    });
                                }
                                return Observable.forkJoin(obs);
                            })
                            .subscribe();
                    } else {
                        res.sendStatus(404);
                    }
                });
                adapter.setupPushUpdates(uri).subscribe(() => {
                    console.log("Successfully set up push notifications.");
                });
            });
    }

    private _initialRun() {
        this._podcasts.forEach((podcast) => {
            console.log(chalk.default.yellow("Loaded podcast"), podcast.alias);
            this._adapters[podcast.sourceModule].addPodcast(podcast)
                .flatMap(() => {
                    console.log(chalk.default.yellow("Checking updates"), "for", podcast.alias);
                    return this._adapters[podcast.sourceModule].checkUpdates(podcast.alias);
                })
                .flatMap(() => this._pruneAndFetchFeedEntries(podcast.alias))
                .flatMap(() => this._generateFeed(podcast))
                .subscribe(() => { console.log(chalk.default.yellow("Initial run completed.")); });
        });
    }

    private _checkAllRun() {
        Observable.merge(
            ...Object.keys(this._adapters)
                .map((adapterKey) => {
                    return (this._adapters[adapterKey] as SourceAdapter).checkAllUpdates();
                },
            ),
        )
            .flatMap((updatedPods) => {
                return Observable.of(...updatedPods);
            })
            .flatMap((updatedPod) => {
                return this._pruneAndFetchFeedEntries(updatedPod.alias)
                    .map(() => updatedPod);
            })
            .flatMap((pod) => this._generateFeed(pod).map(() => pod))
            .toArray()
            .retry(3)
            .subscribe((updatedPods) => {
                console.log(chalk.default.yellow("Update run completed."), "Following podcasts are updated:");
                console.log(updatedPods.length > 0 ?
                    updatedPods.map((pod) => pod.alias).reduce((a, b) => a + "," + b)
                    : "None");
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

    private _generateFeed(podcast: PodcastDefinition): Observable<NodeJS.ErrnoException> {
        return this._databaseController.listEpisodes(podcast.alias)
            .flatMap((episodes) => {
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
                return this._saveXml(xml, podcast.alias);
            });
    }

    private _saveXml(xml: string, alias: string): Observable<NodeJS.ErrnoException> {
        return Observable.bindCallback(fs.writeFile)
            (__dirname + "/" + this._configuration.feedPath + alias + ".xml", xml);
    }
}
