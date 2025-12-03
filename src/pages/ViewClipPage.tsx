import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClips, updateClip, getFolders, getTags } from "@/utils/storage";
import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import YouTube from "react-youtube";

export function ViewClipPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [clip, setClip] = useState<Clip | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    // Edit State
    const [notes, setNotes] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    useEffect(() => {
        const allClips = getClips();
        const foundClip = allClips.find((c) => c.id === id);
        if (foundClip) {
            setClip(foundClip);
            setNotes(foundClip.notes || "");
            setAiPrompt(foundClip.aiPrompt || "");
            setSelectedTagIds(foundClip.tagIds || []);
        }
        setFolders(getFolders());
        setTags(getTags());
    }, [id]);

    const handleSave = () => {
        if (!clip) return;
        const updatedClip = {
            ...clip,
            notes,
            aiPrompt,
            tagIds: selectedTagIds
        };
        updateClip(updatedClip);
        setClip(updatedClip);
        alert("Changes saved!");
    };

    const toggleTag = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
        } else {
            setSelectedTagIds([...selectedTagIds, tagId]);
        }
    };

    if (!clip) return <div className="p-8">Clip not found</div>;

    const folder = folders.find(f => f.id === clip.folderId);

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                        <YouTube
                            videoId={clip.videoId}
                            opts={{
                                playerVars: {
                                    start: clip.start,
                                    end: clip.end,
                                    autoplay: 1,
                                },
                            }}
                            className="w-full h-full"
                            iframeClassName="w-full h-full"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{clip.title}</h1>
                        {folder && (
                            <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md mt-2">
                                {folder.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-6 bg-card p-6 rounded-xl border">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Metadata</h2>
                        <Button size="sm" onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" /> Save
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <div
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1 rounded-full text-xs cursor-pointer border transition-colors ${selectedTagIds.includes(tag.id)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted hover:bg-muted/80 border-transparent"
                                        }`}
                                >
                                    {tag.name}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="min-h-[150px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>AI Prompt</Label>
                        <Textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="AI Prompt..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
