import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZenSparkEditor } from '@/components/sparks/ZenSparkEditor';
import { useSparkStore } from '@/stores/useSparkStore';
import { sparksApi } from '@/utils/sparksApi';
import { toast } from 'sonner';

export function SparkEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { openEditor, createNewSpark } = useSparkStore();

    useEffect(() => {
        const loadSpark = async () => {
            if (id === 'new') {
                createNewSpark();
            } else if (id) {
                try {
                    // Ideally we should check if we already have it in store or cache, 
                    // but for now let's fetch individual if needed or just use what we have?
                    // The store expects us to call openEditor with the spark object.
                    // If we came from a direct link, we might not have the spark object yet.

                    const spark = await sparksApi.get(id); // We might need to implement get(id) if not exists
                    openEditor(spark);
                } catch (error) {
                    console.error("Failed to load spark", error);
                    toast.error("Spark not found");
                    navigate('/sparks');
                }
            }
        };

        loadSpark();
    }, [id, createNewSpark, openEditor, navigate]);

    const handleClose = () => {
        navigate('/sparks');
    };

    return (
        <ZenSparkEditor
            isPage={true}
            onClose={handleClose}
        />
    );
}
