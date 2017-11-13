import { Observable } from "rxjs";
import * as Sequelize from "sequelize";

import { PodcastDefinition, PodcastFeedEntry } from "./Models";

export class DatabaseController {
    private _db: Sequelize.Sequelize;
    private _podcastModel: Sequelize.Model<Sequelize.Instance<PodcastDefinition>, PodcastDefinition>;
    private _entryModel: Sequelize.Model<Sequelize.Instance<PodcastFeedEntry>, PodcastFeedEntry>;

    constructor(private _databasePath: string) {
        this._db = new Sequelize("Podcasts", "", "", {
            logging: false,
            host: "localhost",
            dialect: "sqlite",
            storage: __dirname + "/" + this._databasePath,
        });
        this._db.authenticate()
            .then(() => {
                console.log("[DB] Database loaded.");
            })
            .catch((err) => {
                console.log("[DB] Error loading database file:", err);
            });
        this._podcastModel = this._db.define("Podcasts", {
            alias: {
                type: Sequelize.STRING,
                primaryKey: true,
            },
            author: Sequelize.STRING,
            description: Sequelize.STRING,
            image: Sequelize.STRING,
            itunesSubtitle: Sequelize.STRING,
            siteUrl: Sequelize.STRING,
            sourceId: Sequelize.STRING,
            sourceModule: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            sourcePlaylistId: Sequelize.STRING,
            sourceType: Sequelize.STRING,
            state: Sequelize.STRING,
            title: Sequelize.STRING,
        });
        this._entryModel = this._db.define("PodcastFeedEntry", {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
            },
            date: Sequelize.STRING,
            description: Sequelize.STRING,
            image: Sequelize.STRING,
            localPath: Sequelize.STRING,
            name: Sequelize.STRING,
            podcastAlias: Sequelize.STRING,
            pubDate: Sequelize.STRING,
            remoteUrl: Sequelize.STRING,
            state: Sequelize.INTEGER,
        });
    }
    public init(): Observable<void> {
        const a = Observable.fromPromise(this._podcastModel.sync());
        const b = Observable.fromPromise(this._entryModel.sync());
        return Observable.forkJoin([a, b], () => { return; });
    }
    public doesPodcastExist(name: string): Observable<boolean> {
        const condition = {
            where: { alias: name },
        };
        return Observable.fromPromise(this._podcastModel.findOne(condition))
            .map((value) => {
                if (!value) {
                    return false;
                } else {
                    return true;
                }
            });
    }
    public doesEpisodeExist(vidId: string): Observable<boolean> {
        const condition = {
            where: { id: vidId },
        };
        return Observable.fromPromise(this._entryModel.findOne(condition))
            .map((value) => {
                if (!value) {
                    return false;
                } else {
                    return true;
                }
            });
    }
    public addOrUpdatePodcast(pod: PodcastDefinition): Observable<boolean> {
        return Observable.fromPromise(
            this._podcastModel.findOne({ where: { alias: pod.alias } })
                .then((item) => {
                    if (!item) {
                        return this._podcastModel
                            .create(pod)
                            .then(() => true);
                    } else {
                        Object.keys(pod).forEach((key) => {
                            item[key] = pod[key];
                        });
                        return item.save()
                            .then(() => false);
                    }
                }))
            .do((result) => {
                if (result) {
                    console.log("[DB] Added podcast", pod.alias);
                } else {
                    console.log("[DB] Updated podcast", pod.alias);
                }
            });
    }
    public addOrUpdateEpisode(ep: PodcastFeedEntry): Observable<boolean> {
        return Observable.fromPromise(
            this._entryModel.findOne({ where: { id: ep.id } })
                .then((item) => {
                    if (!item) {
                        return this._entryModel.create(ep)
                            .then(() => {
                            })
                            .then(() => true);
                    } else {
                        Object.keys(ep).forEach((key) => {
                            item[key] = ep[key];
                        });
                        return item.save()
                            .then(() => false);
                    }
                }))
            .do((result) => {
                if (result) {
                    console.log("[DB]: Added episode", ep.id);
                } else {
                    console.log("[DB]: Updated episode", ep.id);
                }
            });
    }
    public listPodcasts(): Observable<PodcastDefinition[]> {
        return Observable.fromPromise(
            this._podcastModel.findAll()
                .then((instances) => instances.map((inst) => inst.get())),
        );
    }
    public listEpisodes(alias: string): Observable<PodcastFeedEntry[]> {
        const condition = {
            where: { podcastAlias: alias },
        };
        return Observable.fromPromise(
            this._entryModel.findAll(condition)
                .then((instances) => instances.map((inst) => inst.get())),
        );
    }
    public getPodcastFromAlias(alias: string): Observable<PodcastDefinition> {
        const condition = {
            where: { alias: alias },
        };
        return Observable.fromPromise(
            this._podcastModel.findOne(condition)
                .then((instance) => instance.get()),
        );
    }
    public getEpisodeFromId(id: string): Observable<PodcastFeedEntry> {
        const condition = {
            where: { id: id },
        };
        return Observable.fromPromise(
            this._entryModel.findOne(condition)
                .then((instance) => instance.get()),
        );
    }

}
