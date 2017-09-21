
export interface ParsedFeedEntry {
    name: string;
    description: string;
    id: string;
    date: string;
    update: string;
    image: string;
    remoteUrl: string;
}

export interface ParsedFeedData{
    name: string;
    fetchDate: number;
    data: ParsedFeedEntry[];
}

export interface FilledFeedEntry extends ParsedFeedEntry {
    localUrl: string;
}

export interface FilledFeedData extends FilledFeedEntry {
    data: FilledFeedEntry[];
}