import { Observable } from "rxjs";
import * as Sequelize from "sequelize";

import { PodcastDefinition, PodcastFeedEntry } from "./Models";

export class DatabaseController {
    private _db: Sequelize.Sequelize;
    private _podcastModel: Sequelize.Model<PodcastDefinition, PodcastDefinition>;
    private _entryModel: Sequelize.Model<PodcastFeedEntry, PodcastFeedEntry>;

    constructor(private _databasePath: string) {
        this._db = new Sequelize("Podcasts", "", "", {
            logging: false,
            host: "localhost",
            dialect: "sqlite",
            storage: this._databasePath,
        });
        this._db.authenticate().then(() => {
            console.log("Database file loaded.");
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
        this._entryModel = this._db.define<PodcastFeedEntry, PodcastFeedEntry>("PodcastFeedEntry", {
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
            state: Sequelize.STRING,
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
        return Observable.fromPromise(
            this._podcastModel.findOne(condition),
        )
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
        return Observable.create((observer) => {
            this._entryModel.findOne(condition)
                .then((param) => {
                    observer.next(param);
                    observer.complete(param);
                })
                .catch((error) => {
                    observer.error(error);
                    observer.complete(error);
                });
        }).map((value) => {
            if (!value) {
                return false;
            } else {
                return true;
            }
        });
    }
    public tryAddPodcast(pod: PodcastDefinition): Observable<void> {
        return Observable.fromPromise(
            this._podcastModel.findOne({ where: { alias: pod.alias } })
                .then((item) => {
                    if (!item) {
                        return this._podcastModel.create(pod).then(() => { return; });
                    } else {
                        return this._podcastModel
                            .update(pod, { where: { alias: pod.alias } })
                            .then(() => { return; });
                    }
                })).map(() => { return; });
    }
    public tryAddEpisode(ep: PodcastFeedEntry): Observable<void> {
        return Observable.fromPromise(
            this._entryModel.findOne({ where: { id: ep.id } })
                .then((item) => {
                    if (!item) {
                        return this._entryModel.create(ep);
                    } else {
                        console.log("updating..");
                        return this._entryModel
                            .update(ep, { where: { id: ep.id } })
                            .then((map) => map[1][0]);
                    }
                })).map(() => { return; });
    }
    public listPodcasts(): Observable<PodcastDefinition[]> {
        return Observable.fromPromise(
            this._podcastModel.findAll(),
        );
    }
    public listEpisodes(alias: string): Observable<PodcastFeedEntry[]> {
        const condition = {
            where: { podcastAlias: alias },
        };
        return Observable.fromPromise(
            this._entryModel.findAll(condition));
    }
    public getPodcastFromAlias(alias: string): Observable<PodcastDefinition> {
        const condition = {
            where: { alias: alias },
        };
        return Observable.fromPromise(
            this._podcastModel.findOne(condition));
    }
    public getEpisodeFromId(id: string): Observable<PodcastFeedEntry> {
        const condition = {
            where: { id: id },
        };
        return Observable.fromPromise(
            this._entryModel.findOne(condition));
    }

}
