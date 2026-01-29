import { create } from 'zustand';
import { sparksApi, type Spark } from '../utils/sparksApi';
import { toast } from 'sonner';

interface SparkStore {
    isOpen: boolean;
    currentSpark: Spark | null;
    isSaving: boolean;

    // Actions
    openEditor: (spark?: Spark) => void;
    closeEditor: () => void;
    saveSpark: (content: string, title?: string) => Promise<void>;
    createNewSpark: () => void;
}

export const useSparkStore = create<SparkStore>((set, get) => ({
    isOpen: false,
    currentSpark: null,
    isSaving: false,

    openEditor: (spark) => {
        set({ isOpen: true, currentSpark: spark || null });
    },

    closeEditor: () => {
        set({ isOpen: false, currentSpark: null });
    },

    createNewSpark: () => {
        set({ isOpen: true, currentSpark: null });
    },

    saveSpark: async (content: string, title?: string) => {
        set({ isSaving: true });
        try {
            const { currentSpark } = get();

            if (currentSpark) {
                // Update existing
                const updated = await sparksApi.update(currentSpark.id, { content, title });
                set({ currentSpark: updated, isSaving: false });
            } else {
                // Create new
                const created = await sparksApi.create(content, title);
                set({ currentSpark: created, isSaving: false });
            }
            // Optional: toast.success('Saved'); // Too noisy for auto-save
        } catch (error) {
            console.error('Failed to save spark:', error);
            toast.error('Failed to save spark');
            set({ isSaving: false });
        }
    }
}));
