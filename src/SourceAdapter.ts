
import { DatabaseController } from "./DatabaseController";
import { Podcast, SourceModule } from "./Models";

export abstract class SourceAdapter {
    constructor(_db: DatabaseController) {/**/};

    public get sourceType(): SourceModule {
        return SourceModule.None;
    }
    /*
    * This method is called when a new podcast is added,
    * such as when it is added or read from the configuration.
    */
    public abstract addPodcast(podcast: Podcast);
    /*
    * This method is invoked to update the podcast feed.
    */
    public abstract checkUpdates();
    /*
    * This method is used when handling push updates.
    */
    public abstract handlePushUpdate(push: any);
}
