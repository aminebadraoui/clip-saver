export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    category: 'video' | 'image';
    createdAt: number;
}
