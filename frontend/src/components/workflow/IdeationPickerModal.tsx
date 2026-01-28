import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, FileText, Type, Image as ImageIcon, Loader2 } from 'lucide-react';
import { labApi, type LibraryTemplate } from '../../utils/labApi';
import { useAuth } from '../../context/AuthContext';

interface IdeationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    type: 'title' | 'script' | 'thumbnail';
}

export function IdeationPickerModal({ isOpen, onClose, onSelect, type }: IdeationPickerModalProps) {
    const { token } = useAuth();
    const [templates, setTemplates] = useState<LibraryTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && token) {
            loadLibraryContent();
        }
    }, [isOpen, token]);

    const loadLibraryContent = async () => {
        setLoading(true);
        setError(null);
        try {
            // Map the modal type ('title' | 'script' | 'thumbnail') to API type ('titles' | 'scripts' | 'thumbnails')
            const apiType = type === 'title' ? 'titles' : type === 'script' ? 'scripts' : 'thumbnails';
            const data = await labApi.listTemplates(apiType);
            setTemplates(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load library content');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helper to get items from templates
    const getItems = (template: LibraryTemplate) => {
        let value = "";
        let label = "";

        if (type === 'title') {
            value = template.text || "";
            label = template.text || "Untitled";
        } else if (type === 'script') {
            value = template.structure || "";
            label = "Script Structure"; // Scripts might need a better label if available, or just truncating structure
            if (template.category) label = `${template.category} Script`;
        } else if (type === 'thumbnail') {
            value = template.description || "";
            label = template.description?.slice(0, 50) + "..." || "Thumbnail Description";
        }

        return {
            label,
            value,
            subLabel: template.category
        };
    };

    const filteredItems = templates
        .map(getItems)
        .filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.subLabel?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        {type === 'title' && <Type className="text-purple-400" size={20} />}
                        {type === 'script' && <FileText className="text-blue-400" size={20} />}
                        {type === 'thumbnail' && <ImageIcon className="text-pink-400" size={20} />}
                        <h2 className="text-lg font-semibold text-white">Import {type === 'thumbnail' ? 'Thumbnail Prompt' : type === 'title' ? 'Title' : 'Script'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${type}s...`}
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 placeholder:text-gray-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-xs">Loading library...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            No {type}s found in library.
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {filteredItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    className="w-full text-left p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                                    onClick={() => {
                                        onSelect(item.value);
                                        onClose();
                                    }}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-200 font-medium line-clamp-2 group-hover:text-white transition-colors">
                                                {item.label}
                                            </div>
                                            {item.subLabel && (
                                                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                    {item.subLabel}
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-white text-black px-2 py-1 rounded font-medium">
                                            Select
                                        </div>
                                    </div>
                                    {/* Preview full text for longer items on hover/expand could go here */}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}
