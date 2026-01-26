const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:3001/api";

export interface Image {
    id: string;
    title: string;
    image_url: string;
    source_url?: string;
    source_domain?: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
    notes?: string;
    createdAt: number;
    user_id: string;
    space_id?: string;
    tags?: any[];
}

export interface ImageCreateData {
    title: string;
    image_url: string;
    source_url?: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
    notes?: string;
    tagIds?: string[];
}

export interface ImageUpdateData {
    title?: string;
    notes?: string;
    tagIds?: string[];
}

export interface ImageFilters {
    search?: string;
    tag_ids?: string;
    limit?: number;
    offset?: number;
}

export async function fetchImages(
    token: string,
    spaceId?: string,
    filters?: ImageFilters
): Promise<Image[]> {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.tag_ids) params.append("tag_ids", filters.tag_ids);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
    };

    if (spaceId) {
        headers["X-Space-Id"] = spaceId;
    }

    const response = await fetch(
        `${API_BASE}/images?${params.toString()}`,
        { headers }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch images");
    }

    return response.json();
}

export async function saveImage(
    token: string,
    imageData: ImageCreateData,
    spaceId?: string
): Promise<Image> {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };

    if (spaceId) {
        headers["X-Space-Id"] = spaceId;
    }

    const response = await fetch(`${API_BASE}/images`, {
        method: "POST",
        headers,
        body: JSON.stringify(imageData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to save image");
    }

    return response.json();
}

export async function updateImage(
    token: string,
    imageId: string,
    updates: ImageUpdateData
): Promise<Image> {
    const response = await fetch(`${API_BASE}/images/${imageId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update image");
    }

    return response.json();
}

export async function deleteImage(
    token: string,
    imageId: string
): Promise<void> {
    const response = await fetch(`${API_BASE}/images/${imageId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete image");
    }
}
