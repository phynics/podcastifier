
import { Request, Response } from "express";
import { Observable } from "rxjs/Observable";

import { DatabaseController } from "./DatabaseController";
import { PodcastDefinition, SourceModule } from "./Models";

export abstract class SourceAdapter {
    constructor(_db: DatabaseController) { }

    public get sourceModuleType(): SourceModule {
        return SourceModule.None;
    }

    public get supportsPushNotifications(): boolean {
        return false;
    }

    /*
    * This method is called when a new podcast is added,
    * such as when it is read from the configuration file.
    * Returns true if passed podcast is new.
    */
    public addPodcast(podcast: PodcastDefinition): Observable<boolean> {
        if (podcast.sourceModule === this.sourceModuleType) {
            return this._onAddPodcast(podcast);
        }
    }

    /*
    * This updates all podcast feeds which is managed by this SourceAdapter.
    * Returns definitions for updated podcasts.
    */
    public abstract checkAllUpdates(): Observable<PodcastDefinition[]>;

    /*
    * This method is invoked to update the a particular podcast feed.
    * Return true if there are updates.
    */
    public abstract checkUpdates(alias: string): Observable<boolean>;

    /**
     * This is method should setup Push subscriptions.
     * Returns true if the operation is supported.
     */
    public abstract setupPushUpdates(uri: string): Observable<void>;

    /*
    * This method is used to handle push notifications.
    * Returns the channel_id of the update
    */
    public abstract pushUpdateHandler(update: [Request, Response]): string ;

    /**
     * This method implements addPodcat logic, returning
     * true if podcast is new, false if it already exists.
     */
    protected abstract _onAddPodcast(podcast: PodcastDefinition): Observable<boolean>;
}
