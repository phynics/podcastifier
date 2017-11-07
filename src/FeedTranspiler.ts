import * as ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as ydl from "ytdl-core";

import { ConnectableObservable, Observable, Observer, ReplaySubject } from "rxjs";
import { Readable } from "stream";

import { PodcastFeedEntry, PodcastFetch } from "./Models";

export class FeedTranspiler {
    public downloadFeed: ReplaySubject<PodcastFetch>;

    constructor(
        _xmlFeed: Observable<PodcastFetch>,
        private _kStoDir: string = "storage/",
    ) {
        this.downloadFeed = new ReplaySubject(1);
        _xmlFeed.subscribe((value: PodcastFetch) => {
            const dataObservables: Array<Observable<PodcastFeedEntry>> = new Array<Observable<PodcastFeedEntry>>();
            value.data.forEach((element) => {
                const exists = fs.existsSync(this._pathBuilder(element.id));
                let entry: PodcastFeedEntry;

                const obs: Observable<PodcastFeedEntry> = new Observable((observer) => {
                    if (exists) {
                        // filefound therefore 
                        console.log("Found " + element.name + ", skipping download.");
                        entry = { ...element };
                        entry.localPath = this._pathBuilder(element.id);
                        observer.next(entry);
                        observer.complete();
                    } else {
                        console.log("Starting download for " + element.name);
                        let stream = ydl(element.remoteUrl);
                        let subs = this._transpilePayload(stream, element).subscribe((result) => {
                            observer.next(result);
                            observer.complete();
                            subs.unsubscribe();
                        });
                    }
                });
                dataObservables.push(obs);
            });
            Observable.forkJoin(dataObservables).subscribe((data) => {
                const payload: PodcastFetch = {...value};
                payload.data = data;
                this.downloadFeed.next(payload);
            });
        });
    }

    private _pathBuilder(entryId: string) {
        return this._kStoDir + entryId + ".mp3";
    }

    private _transpilePayload(stream: Readable, entry: PodcastFeedEntry): Observable<PodcastFeedEntry> {
        const path = this._pathBuilder(entry.id);
        let obs: ConnectableObservable<PodcastFeedEntry> = Observable.create((observer: Observer<PodcastFeedEntry>) => {
            console.log("Transpiling ", entry.name);
            const transpiler = ffmpeg(stream)
                .withNoVideo()
                .audioBitrate("256k")
                .audioCodec("libmp3lame")
                .audioChannels(2)
                .format("mp3")
                .output(path)
                .on("info", (arg) => {
                    console.log(JSON.stringify(arg));
                })
                .on("end", () => {
                    const payload = { ...entry };
                    payload.localPath = path;
                    observer.next(payload);
                    observer.complete();
                });
            transpiler.run();
        });
        return obs;
    }
}
