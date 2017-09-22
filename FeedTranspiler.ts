import * as ydl from "ytdl-core";
import * as fs from "graceful-fs";
import * as ffmpeg from "fluent-ffmpeg";

import { Readable } from "stream";
import { ParsedFeedData, ParsedFeedEntry, IdMap } from "./FeedData";
import { FeedScrapper } from "./FeedScrapper";
import { Observable, Observer } from "rxjs";

interface TranspilePayload {
    stream: Readable,
    name: string
}

export class FeedTranspiler {
    public downloadFeed: Observable<IdMap>;

    constructor(
        private _downloadFeed: Observable<ParsedFeedData>,
        private _kStoDir: string = "storage/"
    ) 
    {
        this.downloadFeed = _downloadFeed
            .flatMap((value: ParsedFeedData, index: number) => {
                return Observable.create((observer: Observer<TranspilePayload>) => {
                    value.data.forEach(element => {
                        console.log("Starting download for " + element.name);
                        var payload: TranspilePayload = {
                            stream: ydl(element.remoteUrl),
                            name: element.id
                        };
                        observer.next(payload);
                        observer.complete();
                    });
                });
            })
            .flatMap((value: TranspilePayload, index: number) => {
                return Observable.create((observer: Observer<string>) => {
                    console.log("Transpiling from stream");
                    var transpiler = ffmpeg(value.stream)
                        .withNoVideo()
                        .audioBitrate('256k')
                        .audioCodec('libmp3lame')
                        .audioChannels(2)
                        .format('mp3')
                        .output(this._kStoDir + value.name + ".mp3")
                        .on('end', function (video) {
                            observer.next(value.name);
                            observer.complete();
                        });
                    transpiler.run();

                });
            })
            .map((value: string, _) => {
                return {id: value, path: this._kStoDir + value + ".mp3"} as IdMap;
            });
    }
}
