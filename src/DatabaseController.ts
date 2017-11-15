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

    /**
     * Syncs ORMs to the database.
     * @returns Observable to indicate end of the operation.
     */
    public init(): Observable<void> {
        const a = Observable.fromPromise(this._podcastModel.sync());
        const b = Observable.fromPromise(this._entryModel.sync());
        return Observable.forkJoin([a, b], () => { return; });
    }

    /**
     * Checks whether a podcast is already on the database.
     * @param alias Podcast alias to be checked
     * @returns Boolean Observable that returns true if the podcast exists.
     */
    public doesPodcastExist(alias: string): Observable<boolean> {
        const condition = {
            where: { alias: alias },
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

    /**
     * Checks whether an episode is already on the database.
     * @param id id for the episode
     * @returns Boolean Observable that returns true if the episode exists.
     */
    public doesEpisodeExist(id: string): Observable<boolean> {
        const condition = {
            where: { id: id },
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

    /**
     * Tries to add the podcast to the database, updates its entry
     * if it already exists.
     * @param pod PodcastDefinition for the podcast to be added
     * @returns Boolean Observable that returns true if the podcast is newly added.
     */
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

    /**
     * Tries to add the episode to the database, updates its entry
     * if it already exists.
     * @param ep PodcastFeedEntry for the episode to be added
     * @returns Boolean Observable that returns true if the episode is newly added.
     */
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

    /**
     * Lists all podcasts on the database.
     * @returns Observable that return an array of Podcast definitions.
     */
    public listPodcasts(): Observable<PodcastDefinition[]> {
        return Observable.fromPromise(
            this._podcastModel.findAll()
                .then((instances) => instances.map((inst) => inst.get())),
        );
    }

    /**
     * Lists all podcasts on the database, which belong to a SourceAdapter.
     * @param sourceModule the enum sourceModule value for the SourceAdapter.
     * @returns Observable that return an array of Podcast definitions.
     */
    public listPodcastsFromSource(sourceModule: number): Observable<PodcastDefinition[]> {
        const condition = {
            where: { sourceModule: sourceModule },
        };
        return Observable.fromPromise(
            this._podcastModel.findAll(condition)
                .then((instances) => instances.map((inst) => inst.get())),
        );
    }

    /**
     * Lists all episodes on the database, which belong to a Podcast.
     * @param alias Alias of the podcast
     * @returns Observable that return an array of PodcastFeedEntry.
     */
    public listEpisodes(alias: string): Observable<PodcastFeedEntry[]> {
        const condition = {
            where: { podcastAlias: alias },
        };
        return Observable.fromPromise(
            this._entryModel.findAll(condition)
                .then((instances) => instances.map((inst) => inst.get())),
        );
    }

    /**
     * Gets the podcast definition for a given alias.
     * @param alias alias to be checked
     * @returns Observable that return a PodcastDefinition
     */
    public getPodcastFromAlias(alias: string): Observable<PodcastDefinition> {
        const condition = {
            where: { alias: alias },
        };
        return Observable.fromPromise(
            this._podcastModel.findOne(condition)
                .then((instance) => instance.get()),
        );
    }

    /**
     * Gets the episode for a given id.
     * @param id episode's id
     * @return Observable that returns a PodcastFeedEntry
     */
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
