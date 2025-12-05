import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFolders, getTags, saveClip, saveTag } from "@/utils/storage";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import type { Clip } from "@/types/clip";
import { Save, Plus } from "lucide-react";
import { toast } from "sonner";

interface SaveAssetFormProps {
    initialAssets: Partial<Clip>[];
    initialUrl?: string; // Added this
    onSave: () => void;
    onCancel?: () => void;
}

export function SaveAssetForm({ initialAssets, initialUrl, onSave, onCancel }: SaveAssetFormProps) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    // Normalize input to an array of clips
    const [assets, setAssets] = useState<Partial<Clip>[]>([]);

    useEffect(() => {
        if (initialAssets && initialAssets.length > 0) {
            setAssets(initialAssets);
        } else {
            // Manual entry mode default
            setAssets([{ title: "", videoId: "", thumbnail: "" }]);
        }
    }, [initialAssets]);

    // Form State (Common for all assets for now)
    const [title, setTitle] = useState(""); // Only used if single asset
    const [url, setUrl] = useState(initialUrl || ""); // Initialize with prop
    const [selectedFolderId, setSelectedFolderId] = useState<string>("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [newTagName, setNewTagName] = useState("");

    // Initialize title/url if single asset
    useEffect(() => {
        if (assets.length === 1) {
            setTitle(assets[0].title || "");
            if (assets[0].videoId) {
                setUrl(`https://www.youtube.com/watch?v=${assets[0].videoId}`);
            } else if (initialUrl) {
                setUrl(initialUrl);
            }
        }
    }, [assets, initialUrl]);

    // Load initial data
    useEffect(() => {
        const init = async () => {
            setFolders(await getFolders());
            setTags(await getTags());
        };
        init();
    }, []);

    const handleSave = async () => {
        if (assets.length === 0) return;

        // If manual entry, validate title
        if (assets.length === 1 && !assets[0].videoId && !url && !title) {
            toast.error("Please enter at least a title or URL");
            return;
        }

        const updatedAssets = assets.map(asset => {
            let videoId = asset.videoId;
            let assetTitle = asset.title;
            let thumbnail = asset.thumbnail;

            // Handle manual entry updates
            if (assets.length === 1) {
                assetTitle = title;
                if (!videoId && url) {
                    try {
                        const urlObj = new URL(url);
                        videoId = urlObj.searchParams.get("v") || "";
                    } catch (e) {
                        console.error("Invalid URL", e);
                    }
                }
                if (!videoId) videoId = uuidv4();
                if (!thumbnail) thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }

            return {
                ...asset,
                id: uuidv4(),
                videoId: videoId || uuidv4(),
                title: assetTitle || "Untitled",
                thumbnail: thumbnail || "",
                createdAt: Date.now(),
                folderId: selectedFolderId || null,
                tagIds: selectedTagIds,
                notes,
                aiPrompt,
                originalTitle: assetTitle
            } as Clip;
        });

        for (const clip of updatedAssets) {
            await saveClip(clip);
        }
        onSave();
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        const newTag: Tag = {
            id: uuidv4(),
            name: newTagName,
            color: "#3b82f6", // Default blue
            createdAt: Date.now()
        };
        await saveTag(newTag);
        setTags(await getTags()); // Refresh
        setSelectedTagIds([...selectedTagIds, newTag.id]); // Auto-select
        setNewTagName("");
    };

    const toggleTag = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
        } else {
            setSelectedTagIds([...selectedTagIds, tagId]);
        }
    };

    // Group folders by category
    const videoFolders = folders.filter(f => f.category === 'video' || !f.category);
    const imageFolders = folders.filter(f => f.category === 'image');

    return (
        <div className="grid gap-6">
            {/* Asset Preview */}
            {assets.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {assets.map((asset, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
                            {asset.thumbnail ? (
                                <img src={asset.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Preview</div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs p-2 text-center">
                                {asset.title}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {assets.length === 1 && (
                <>
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a title..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>URL (Optional)</Label>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                </>
            )}

            {assets.length > 1 && (
                <div className="text-sm text-muted-foreground">
                    Saving {assets.length} clips to the selected folder.
                </div>
            )}

            <div className="space-y-2">
                <Label>Folder</Label>
                <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                >
                    <option value="" disabled>Select a folder...</option>
                    {videoFolders.length > 0 && (
                        <optgroup label="Video Folders">
                            {videoFolders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </optgroup>
                    )}
                    {imageFolders.length > 0 && (
                        <optgroup label="Image Folders">
                            {imageFolders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>

            <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                        <div
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`px-3 py-1 rounded-full text-sm cursor-pointer border transition-colors ${selectedTagIds.includes(tag.id)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted hover:bg-muted/80 border-transparent"
                                }`}
                        >
                            {tag.name}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Create new tag..."
                        onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                    />
                    <Button variant="outline" onClick={handleCreateTag}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    placeholder="Add some notes..."
                    className="min-h-[100px]"
                />
            </div>

            <div className="space-y-2">
                <Label>AI Prompt</Label>
                <Textarea
                    value={aiPrompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiPrompt(e.target.value)}
                    placeholder="Enter AI prompt used or inspired by this..."
                    className="min-h-[80px]"
                />
            </div>

            <div className="flex gap-2">
                {onCancel && (
                    <Button variant="outline" className="w-full" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button size="lg" className="w-full" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save to Library
                </Button>
            </div>
        </div>
    );
}
