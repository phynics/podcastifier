
import { Observable } from "rxjs/Observable";
import { DatabaseController } from "./DatabaseController";
import { PodcastDefinition, SourceModule } from "./Models";

export abstract class SourceAdapter {
    constructor(_db: DatabaseController) { }

    public get sourceType(): SourceModule {
        return SourceModule.None;
    }
    /*
    * This method is called when a new podcast is added,
    * such as when it is added or read from the configuration.
    */
    public abstract addPodcast(podcast: PodcastDefinition): Observable<void>;
    /*
    * This method is invoked to update all podcast feeds.
    */
    public abstract checkAllUpdates(): Observable<void>;
    /*
    * This method is invoked to update the a particular podcast feed.
    */
    public abstract checkUpdates(alias: string): Observable<void>;
    /*
    * This method is used when handling push updates.
    */
    public abstract handlePushUpdate(push: any);
}
