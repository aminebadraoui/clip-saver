export interface Tag {
    id: string;
    name: string;
    color: string;
    category?: string; // 'video' | 'title' | 'thumbnail'
    createdAt: number;
    user_id?: string | null;
}
