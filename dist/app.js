"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Podcastifier_1 = require("./Podcastifier");
var Configuration_1 = require("./Configuration");
var app = new Podcastifier_1.Podcastifier(Configuration_1.AppConfig, Configuration_1.Podcasts);
