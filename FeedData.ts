
export interface FeedEntry {
    name: string;
    description: string;
    id: string;
    date: string;
    update: string;
    image: string;
    remoteUrl: string;
}

export interface FeedData{
    name: string;
    fetchDate: number;
    data: FeedEntry[];
}