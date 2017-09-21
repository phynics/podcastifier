import * as ydl from "ytdl-core";
import * as fs from "graceful-fs";
import * as ffmpeg from "ffmpeg";
import { FeedData, FeedEntry } from "./FeedData";
import { FeedScrapper } from "./FeedScrapper";
import { Observable, Observer } from "rxjs";

export class FeedTranspiler {
    private static _kTmpDir: string = "tmp/";
    private static _kStoDir: string = "storage/";
    private _download: Observable<string>;
    
    constructor(
        private _scrapper: FeedScrapper,
        private _kTmpDir: string = "tmp/",
        private _kStoDir: string = "storage/"
    ) {
        this._download = _scrapper.feedSubject
            .flatMap((value: FeedData, index: number) => {
                return Observable.create((observer: Observer<string>) => {
                    var x = 0, y = 0;
                    value.data.slice(0,1).forEach(element => {
                        x++;
                        console.log("Starting download for " + element.name);
                        var vid = ydl(element.remoteUrl);
                        vid.pipe(fs.createWriteStream(FeedTranspiler._kTmpDir + element.id));
                        vid.on('finish', () => {
                            observer.next(element.id);
                            y++;
                            if( x == y ) {
                                observer.complete();
                            }
                        });
                    });
                });
            })
            .flatMap((value: string, index: number) => {
                return Observable.create((observer: Observer<string>) => {
                    console.log("Transpiling " + value);
                    var transpiler = ffmpeg(FeedTranspiler._kTmpDir + value);
                    transpiler.then(function (video) {
                        // Callback mode
                        video.fnExtractSoundToMP3(FeedTranspiler._kStoDir + value, function (error, file) {
                            if (!error) {
                                console.log('Audio id: ' + value);
                                observer.next(file);
                                observer.complete();
                            } else {
                                observer.error(JSON.stringify(error));
                                observer.complete();
                            }
                        });
                    });
                });

            });
        this._download.subscribe((value:string) => {
            fs.unlink(FeedTranspiler._kTmpDir + value, () => {});
            console.log("completed: " + value);
        });
    }
}