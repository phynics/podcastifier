export interface ChannelResource {
    kind: string;
    etag: string;
    id: string;
    snippet?: {
        title: string,
        description: string,
        customUrl: string,
        publishedAt: string,
        thumbnails: {
            (key): {
                url: string,
                width: number,
                height: number
            }
        },
        defaultLanguage: string,
        localized: {
            title: string,
            description: string
        },
        country: string
    };
    contentDetails?: {
        relatedPlaylists: {
            likes: string,
            favorites: string,
            uploads: string,
            watchHistory: string,
            watchLater: string
        }
    };
    statistics?: {
        viewCount: number,
        commentCount: number,
        subscriberCount: number,
        hiddenSubscriberCount: boolean,
        videoCount: number
    };
    topicDetails?: {
        topicIds: string[],
        topicCategories: string[]
    };
    status?: {
        privacyStatus: string,
        isLinked: boolean,
        longUploadsStatus: string
    };
    brandingSettings?: {
        channel: {
            title: string,
            description: string,
            keywords: string,
            defaultTab: string,
            trackingAnalyticsAccountId: string,
            moderateComments: boolean,
            showRelatedChannels: boolean,
            showBrowseView: boolean,
            featuredChannelsTitle: string,
            featuredChannelsUrls: string[],
            unsubscribedTrailer: string,
            profileColor: string,
            defaultLanguage: string,
            country: string
        },
        watch: {
            textColor: string,
            backgroundColor: string,
            featuredPlaylistId: string
        },
        image: {
            bannerImageUrl: string,
            bannerMobileImageUrl: string,
            watchIconImageUrl: string,
            trackingImageUrl: string,
            bannerTabletLowImageUrl: string,
            bannerTabletImageUrl: string,
            bannerTabletHdImageUrl: string,
            bannerTabletExtraHdImageUrl: string,
            bannerMobileLowImageUrl: string,
            bannerMobileMediumHdImageUrl: string,
            bannerMobileHdImageUrl: string,
            bannerMobileExtraHdImageUrl: string,
            bannerTvImageUrl: string,
            bannerTvLowImageUrl: string,
            bannerTvMediumImageUrl: string,
            bannerTvHighImageUrl: string,
            bannerExternalUrl: string
        },
        hints:
        {
            property: string,
            value: string
        }[]

    };
    invideoPromotion?: {
        defaultTiming: {
            type: string,
            offsetMs: number,
            durationMs: number
        },
        position: {
            type: string,
            cornerPosition: string
        },
        items:
        {
            id: {
                type: string,
                videoId: string,
                websiteUrl: string,
                recentlyUploadedBy: string
            },
            timing: {
                type: string,
                offsetMs: number,
                durationMs: number
            },
            customMessage: string,
            promotedByContentOwner: boolean
        }[],
        useSmartTiming: boolean
    };
    auditDetails?: {
        overallGoodStanding: boolean,
        communityGuidelinesGoodStanding: boolean,
        copyrightStrikesGoodStanding: boolean,
        contentIdClaimsGoodStanding: boolean
    };
    contentOwnerDetails?: {
        contentOwner: string,
        timeLinked: string
    };
    localizations?: {
        (key): {
            title: string,
            description: string
        }
    };
}

export interface PlaylistItemResource {

    kind: string;
    etag: string;
    id: string;
    snippet?: {
        publishedAt: string,
        channelId: string,
        title: string,
        description: string,
        thumbnails: {
            (key): {
                url: string,
                width: number,
                height: number,
            }
        },
        channelTitle: string,
        playlistId: string,
        position: number,
        resourceId: {
            kind: string,
            videoId: string,
        }
    };
    contentDetails?: {
        videoId: string,
        startAt: string,
        endAt: string,
        note: string,
        videoPublishedAt: string
    };
    status?: {
        privacyStatus: string
    };
}

export interface PlaylistResource {
    kind: string;
    etag: string;
    id: string;
    snippet?: {
        publishedAt: string,
        channelId: string,
        title: string,
        description: string,
        thumbnails: {
            (key): {
                url: string,
                width: number,
                height: number
            }
        },
        channelTitle: string,
        tags: string[],
        defaultLanguage: string,
        localized: {
            title: string,
            description: string
        }
    };
    status?: {
        privacyStatus: string
    };
    contentDetails?: {
        itemCount: number
    };
    player?: {
        embedHtml: string
    };
    localizations?: {
        (key): {
            title: string,
            description: string
        }
    }
}

export interface VideosResource {
    kind: string;
    etag: string;
    id: string;
    snippet?: {
        publishedAt: string,
        channelId: string,
        title: string,
        description: string,
        thumbnails: {
            (key): {
                url: string,
                width: number,
                height: number
            }
        },
        channelTitle: string,
        tags: [
            string
        ],
        categoryId: string,
        liveBroadcastContent: string,
        defaultLanguage: string,
        localized: {
            title: string,
            description: string
        },
        defaultAudioLanguage: string
    };
    contentDetails?: {
        duration: string,
        dimension: string,
        definition: string,
        caption: string,
        licensedContent: boolean,
        regionRestriction: {
            allowed: string[],
            blocked: string[]
        },
        contentRating: {
            acbRating: string,
            agcomRating: string,
            anatelRating: string,
            bbfcRating: string,
            bfvcRating: string,
            bmukkRating: string,
            catvRating: string,
            catvfrRating: string,
            cbfcRating: string,
            cccRating: string,
            cceRating: string,
            chfilmRating: string,
            chvrsRating: string,
            cicfRating: string,
            cnaRating: string,
            cncRating: string,
            csaRating: string,
            cscfRating: string,
            czfilmRating: string,
            djctqRating: string,
            djctqRatingReasons: string[],
            ecbmctRating: string,
            eefilmRating: string,
            egfilmRating: string,
            eirinRating: string,
            fcbmRating: string,
            fcoRating: string,
            fmocRating: string,
            fpbRating: string,
            fpbRatingReasons: string[],
            fskRating: string,
            grfilmRating: string,
            icaaRating: string,
            ifcoRating: string,
            ilfilmRating: string,
            incaaRating: string,
            kfcbRating: string,
            kijkwijzerRating: string,
            kmrbRating: string,
            lsfRating: string,
            mccaaRating: string,
            mccypRating: string,
            mcstRating: string,
            mdaRating: string,
            medietilsynetRating: string,
            mekuRating: string,
            mibacRating: string,
            mocRating: string,
            moctwRating: string,
            mpaaRating: string,
            mpaatRating: string,
            mtrcbRating: string,
            nbcRating: string,
            nbcplRating: string,
            nfrcRating: string,
            nfvcbRating: string,
            nkclvRating: string,
            oflcRating: string,
            pefilmRating: string,
            rcnofRating: string,
            resorteviolenciaRating: string,
            rtcRating: string,
            rteRating: string,
            russiaRating: string,
            skfilmRating: string,
            smaisRating: string,
            smsaRating: string,
            tvpgRating: string,
            ytRating: string
        },
        projection: string,
        hasCustomThumbnail: boolean
    };
    status?: {
        uploadStatus: string,
        failureReason: string,
        rejectionReason: string,
        privacyStatus: string,
        publishAt: string,
        license: string,
        embeddable: boolean,
        publicStatsViewable: boolean
    };
    statistics?: {
        viewCount: number,
        likeCount: number,
        dislikeCount: number,
        favoriteCount: number,
        commentCount: number
    };
    player?: {
        embedHtml: string,
        embedHeight: number,
        embedWidth: number
    },
    topicDetails?: {
        topicIds: string[],
        relevantTopicIds: string[],
        topicCategories: string[]
    };
    recordingDetails?: {
        locationDescription: string,
        location: {
            latitude: number,
            longitude: number,
            altitude: number
        },
        recordingDate: string
    };
    fileDetails?: {
        fileName: string,
        fileSize: number,
        fileType: string,
        container: string,
        videoStreams:
        {
            widthPixels: number,
            heightPixels: number,
            frameRateFps: number,
            aspectRatio: number,
            codec: string,
            bitrateBps: number,
            rotation: string,
            vendor: string
        }[]
        ,
        audioStreams:
        {
            channelCount: number,
            codec: string,
            bitrateBps: number,
            vendor: string
        }[]
        ,
        durationMs: number,
        bitrateBps: number,
        creationTime: string
    };
    processingDetails?: {
        processingStatus: string,
        processingProgress: {
            partsTotal: number,
            partsProcessed: number,
            timeLeftMs: number
        },
        processingFailureReason: string,
        fileDetailsAvailability: string,
        processingIssuesAvailability: string,
        tagSuggestionsAvailability: string,
        editorSuggestionsAvailability: string,
        thumbnailsAvailability: string
    };
    suggestions?: {
        processingErrors: string[],
        processingWarnings: string[],
        processingHints: string[],
        tagSuggestions:
        {
            tag: string,
            categoryRestricts: string[]
        }[]
        ,
        editorSuggestions: string[]
    };
    liveStreamingDetails?: {
        actualStartTime: string,
        actualEndTime: string,
        scheduledStartTime: string,
        scheduledEndTime: string,
        concurrentViewers: number,
        activeLiveChatId: string
    };
    localizations?: {
        (key): {
            title: string,
            description: string
        }
    };
}

export interface ListResponse<T> {
    kind: string;
    etag: string;
    nextPageToken?: string;
    prevPageToken?: string;
    pageInfo: {
        totalResults: number,
        resultsPerPage: number
    };
    items: T[];
}

export interface VideosListResponse extends ListResponse<VideosResource> { };
export interface PlaylistListResponse extends ListResponse<PlaylistResource> { };
export interface PlaylistItemListResponse extends ListResponse<PlaylistItemResource> { };
export interface ChannelListResponse extends ListResponse<ChannelResource> { };
