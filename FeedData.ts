
export interface ParsedFeedEntry {
    name: string;
    description: string;
    id: string;
    date: string;
    update: string;
    image: string;
    remoteUrl: string;
    localPath: string;
}

export interface ParsedFeedData{
    name: string;
    fetchDate: number;
    data: ParsedFeedEntry[];
}