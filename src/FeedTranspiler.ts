import * as ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as ydl from "ytdl-core";

import { ConnectableObservable, Observable, Observer } from "rxjs";
import { Readable } from "stream";

import { PodcastFeedEntry } from "./Models";

export class FeedTranspiler {
    public static fetchAndTranspileEntry(
        entry: PodcastFeedEntry,
        storageDir: string,
        forceWrite: boolean = false,
    ): Observable<string> {
        return this._fetchPayload(entry, storageDir, forceWrite)
            .flatMap((stream) => this._transpilePayload(stream, entry, storageDir));
    }

    private static _fetchPayload(
        entry: PodcastFeedEntry,
        storageDir: string,
        force: boolean = false,
    ): Observable<Readable> {
        const exists = fs.existsSync(this._pathBuilder(entry.id, storageDir));

        return Observable.create((observer) => {
            if (exists) {
                if (force) {
                    fs.unlinkSync(entry.localPath);
                } else {
                    observer.error("File already exists.");
                }
                observer.next(entry);
                observer.error();
            } else {
                const stream = ydl(entry.remoteUrl);
                observer.next(stream);
                observer.complete();
            }
        });
    }

    private static _transpilePayload(
        stream: Readable,
        entry: PodcastFeedEntry,
        storageDir: string,
    ): Observable<string> {
        const path = this._pathBuilder(entry.id, storageDir);
        const obs: ConnectableObservable<string> =
            Observable.create((observer: Observer<string>) => {
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
                        observer.next(path);
                        observer.complete();
                    });
                transpiler.run();
            });
        return obs;
    }

    private static _pathBuilder(entryId: string, storageDir: string) {
        return storageDir + entryId + ".mp3";
    }
}
