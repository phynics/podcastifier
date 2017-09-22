import * as ydl from "ytdl-core";
import * as fs from "graceful-fs";
import * as ffmpeg from "fluent-ffmpeg";

import { Readable } from "stream";
import { ParsedFeedData, ParsedFeedEntry } from "./FeedData";
import { FeedScrapper } from "./FeedScrapper";
import { Observable, Observer, ConnectableObservable, ReplaySubject } from "rxjs";

export class FeedTranspiler {
    public downloadFeed: ReplaySubject<ParsedFeedData>;

    constructor(
        private _xmlFeed: Observable<ParsedFeedData>,
        private _kStoDir: string = "storage/"
    ) {
        this.downloadFeed = new ReplaySubject(1);
        _xmlFeed.map((value: ParsedFeedData, index: number) => {
            return Observable.create((observer: Observer<ParsedFeedData>) => {
                let obs: Observable<ParsedFeedEntry>[] = new Array<Observable<ParsedFeedEntry>>();
                let payload = {...value} as ParsedFeedData;
                payload.data = new Array<ParsedFeedEntry>();
                var count = value.data.length, completed=0;
                value.data.forEach(element => {
                    let exists = fs.existsSync(this._pathBuilder(element.id));
                    let entry: ParsedFeedEntry;
                    if (exists) {
                        //filefound therefore 
                        console.log("Found "+element.name+", skipping download.");
                        entry = {...element};
                        entry.localPath = this._pathBuilder(element.id);
                        payload.data.push(entry);
                        completed++;
                        if(completed == count) {
                            observer.next(payload);
                            observer.complete();
                        }
                    } else {
                        console.log("Starting download for " + element.name);
                        let stream = ydl(element.remoteUrl);
                        let subs = this._transpilePayload(stream, element).subscribe((result) => {
                            payload.data.push(result);
                            completed++;
                            if(completed == count) {
                                observer.next(payload);
                                observer.complete();
                            }
                            subs.unsubscribe();
                        });
                    }
                });
            });
        }).subscribe((value) => this.downloadFeed.next(value));
    }

    private _pathBuilder(entryId: string){
        return this._kStoDir + entryId + ".mp3";
    }

    private _transpilePayload(stream: Readable, entry: ParsedFeedEntry): Observable<ParsedFeedEntry> {
        let path = this._pathBuilder(entry.id);
        let obs: ConnectableObservable<ParsedFeedEntry> = Observable.create((observer: Observer<ParsedFeedEntry>) => {
            console.log("Transpiling %a ", entry.name);
            let transpiler = ffmpeg(stream)
                .withNoVideo()
                .audioBitrate('256k')
                .audioCodec('libmp3lame')
                .audioChannels(2)
                .format('mp3')
                .output(path)
                .on('end', function (video) {
                    let payload = { ...entry };
                    payload.localPath = path;
                    observer.next(payload);
                    observer.complete();
                });
            transpiler.run();
        })
        return obs;
    }
}
