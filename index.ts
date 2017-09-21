import express = require('express');
import { FeedScrapper } from "./FeedScrapper";
import { FeedTranspiler } from "./FeedTranspiler";
import * as request from "request-promise-native";

import { FeedData, FeedEntry } from "./FeedData";
import * as parser from "xml-parser";

var req = request('http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ').then((xml:string)=> {
    console.log();
});

var FS = new FeedScrapper("gkypr","http://www.youtube.com/feeds/videos.xml?channel_id=UCg6pmeCcngcd07afcdiF1pQ");
var FT = new FeedTranspiler(FS);