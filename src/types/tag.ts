export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: number;
    user_id?: string | null;
}
