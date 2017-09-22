import express = require('express');
import { FeedScrapper } from "./FeedScrapper";
import { FeedTranspiler } from "./FeedTranspiler";
import { PodFeedGenerator } from "./PodFeedGenerator";
import * as request from "request-promise-native";
import * as parser from "xml-parser";
import * as fs from "fs";

var req = request('http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ').then((xml:string)=> {
    console.log();
});

var FS = new FeedScrapper("gkypr","http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ");
var FT = new FeedTranspiler(FS.feedSubject);
var PFG = new PodFeedGenerator(FT.downloadFeed, FS.feedSubject, "http://localhost:8080/", "podcast");
var i = 0;
PFG.podFilledFeed.subscribe((item) => fs.writeFile(("current" + (i++) + ".xml"),item, () => {}));