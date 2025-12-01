import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClips } from "@/utils/storage";
import type { Clip } from "@/types/clip";
import { ClipPlayer } from "@/components/ClipPlayer";

export function ViewClipPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [clip, setClip] = useState<Clip | null>(null);

    useEffect(() => {
        const clips = getClips();
        const found = clips.find((c) => c.id === id);
        if (found) {
            setClip(found);
        } else {
            // Handle not found
            navigate("/");
        }
    }, [id, navigate]);

    if (!clip) return null;

    return (
        <div className="py-6">
            <ClipPlayer clip={clip} />
        </div>
    );
}
