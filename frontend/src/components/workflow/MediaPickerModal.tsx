import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { fetchSpaceAssets, type SpaceAsset } from '../../utils/imageApi';
import { toast } from 'sonner';

interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    token: string;
    spaceId: string | null;
}

export function MediaPickerModal({ isOpen, onClose, onSelect, token, spaceId }: MediaPickerModalProps) {
    const [assets, setAssets] = useState<SpaceAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

    useEffect(() => {
        if (isOpen && spaceId && token) {
            loadAssets();
        }
    }, [isOpen, spaceId, token]);

    const loadAssets = async () => {
        if (!spaceId) return;
        try {
            setLoading(true);
            const data = await fetchSpaceAssets(token, spaceId);
            setAssets(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load space assets");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredAssets = assets.filter(a => filter === 'all' || a.type === filter);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Select Media</h2>
                        <p className="text-sm text-gray-400">Choose from your space's assets</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-gray-400 hover:text-white">
                        <X size={20} />
                    </Button>
                </div>

                <div className="p-4 border-b border-white/10 flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className={cn("text-xs", filter !== 'all' && "text-gray-400 hover:text-white hover:bg-white/5")}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'image' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('image')}
                        className={cn("text-xs flex gap-2", filter !== 'image' && "text-gray-400 hover:text-white hover:bg-white/5")}
                    >
                        <ImageIcon size={14} /> Images
                    </Button>
                    <Button
                        variant={filter === 'video' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('video')}
                        className={cn("text-xs flex gap-2", filter !== 'video' && "text-gray-400 hover:text-white hover:bg-white/5")}
                    >
                        <Film size={14} /> Thumbnails
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 min-h-[300px] custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-primary">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredAssets.map(asset => (
                                <div
                                    key={asset.id}
                                    className="group relative aspect-video bg-black/40 border border-white/5 rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all shadow-lg hover:shadow-primary/20"
                                    onClick={() => {
                                        onSelect(asset.url);
                                        onClose();
                                    }}
                                >
                                    <img
                                        src={asset.thumbnail}
                                        alt={asset.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                            Select
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent">
                                        <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-medium truncate">
                                            <div className={cn("p-1 rounded bg-white/10", asset.type === 'video' ? "text-blue-400" : "text-purple-400")}>
                                                {asset.type === 'video' ? <Film size={10} /> : <ImageIcon size={10} />}
                                            </div>
                                            <span className="truncate">{asset.title}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredAssets.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                                    <div className="p-4 rounded-full bg-white/5 mb-3">
                                        <ImageIcon size={32} className="opacity-50" />
                                    </div>
                                    <p className="text-sm">No media found in this space</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
