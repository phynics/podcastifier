import { Observable } from "rxjs";
import "rxjs/add/opertor/map";
import "rxjs/add/opertor/take";
import * as Sequelize from "sequelize";

import { PodcastDefinition, PodcastFeedEntry } from "./Models";

export class DatabaseController {
    private _db: Sequelize.Sequelize;
    private _podcastModel: Sequelize.Model<PodcastDefinition, PodcastDefinition>;
    private _entryModel: Sequelize.Model<PodcastFeedEntry, PodcastFeedEntry>;

    constructor(private _databasePath: string) {
        this._db = new Sequelize("Podcasts", {
            dialect: "sqlite",
            storage: this._databasePath,
        });
        this._db.authenticate().then(() => {
            console.log("Database file loaded.");
        });
        this._podcastModel = this._db.define("Podcasts", {
            alias: {
                type: Sequelize.STRING,
                unique: true,
            },
            author: Sequelize.STRING,
            description: Sequelize.STRING,
            image: Sequelize.STRING,
            itunesSubtitle: Sequelize.STRING,
            siteUrl: Sequelize.STRING,
            sourceId: Sequelize.STRING,
            sourceModule: Sequelize.STRING,
            sourcePlaylistId: Sequelize.STRING,
            sourceType: Sequelize.STRING,
            title: Sequelize.STRING,
        });
        this._entryModel = this._db.define<PodcastFeedEntry, PodcastFeedEntry>("PodcastFeedEntry", {
            date: Sequelize.STRING,
            description: Sequelize.STRING,
            id: {
                type: Sequelize.STRING,
                unique: true,
            },
            image: Sequelize.STRING,
            localPath: Sequelize.STRING,
            name: Sequelize.STRING,
            podcastAlias: Sequelize.STRING,
            pubDate: Sequelize.STRING,
            remoteUrl: Sequelize.STRING,
        });
        this._podcastModel.sync();
        this._entryModel.sync();
    }
    public doesPodcastExist(name: string): Observable<boolean> {
        return Observable.fromPromise(
            this._podcastModel.find({ where: Sequelize.where("alias", name) }),
        )
            .map((value) => {
                if (!!value) {
                    return true;
                } else {
                    return false;
                }
            });
    }
    public doesEpisodeExist(id: string): Observable<boolean> {
        return Observable.fromPromise(
            this._entryModel.find({ where: Sequelize.where("id", id) }),
        )
            .map((value) => {
                if (!!value) {
                    return true;
                } else {
                    return false;
                }
            });
    }
    public tryAddPodcast(pod: PodcastDefinition): Observable<void> {
        return Observable.fromPromise(
            this._podcastModel.insertOrUpdate(pod),
        ).map(() => { return; });
    }
    public tryAddEpisode(ep: PodcastFeedEntry): Observable<void> {
        return Observable.fromPromise(
            this._entryModel.insertOrUpdate(ep),
        ).map(() => { return; });
    }
    public listPodcasts(): Observable<PodcastDefinition[]> {
        return Observable.fromPromise(
            this._podcastModel.findAll(),
        );
    }
    public listEpisodes(alias: string): Observable<PodcastFeedEntry[]> {
        return Observable.fromPromise(
            this._entryModel.findAll({
                where: Sequelize.where("podcastAlias", alias),
            }));
    }
    public getPodcastFromAlias(alias: string): Observable<PodcastDefinition> {
        return Observable.fromPromise(
            this._podcastModel.find({
                where: Sequelize.where("podcastAlias", alias),
            }));
    }
    public getEpisodeFromId(id: string): Observable<PodcastFeedEntry> {
        return Observable.fromPromise(
            this._entryModel.find({
                where: Sequelize.where("id", id),
            }));
    }

}
