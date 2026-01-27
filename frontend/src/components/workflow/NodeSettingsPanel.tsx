import { type Node } from 'reactflow';
import { X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface NodeSettingsPanelProps {
    node: Node | null;
    onClose: () => void;
    onChange: (nodeId: string, data: any) => void;
}

export function NodeSettingsPanel({ node, onClose, onChange }: NodeSettingsPanelProps) {
    if (!node) return null;

    const handleChange = (key: string, value: any) => {
        const newData = { ...node.data, [key]: value };
        onChange(node.id, newData);
    };

    const handleParameterChange = (key: string, value: any) => {
        const params = { ...(node.data.parameters || {}), [key]: value };
        handleChange('parameters', params);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-h-[85vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white tracking-tight">Node Settings</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{node.type} ({node.id})</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-white/10">
                        <X size={16} />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Common Props */}
                    <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Node Name</Label>
                        <Input
                            type="text"
                            className="bg-black/20 border-white/10 focus:border-primary/50 text-white placeholder:text-muted-foreground/50"
                            value={node.data.label || node.data.name || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                            placeholder="Custom label"
                        />
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Type Specific Props */}
                    {node.type === 'input' && (
                        <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Default Value</Label>
                            <Textarea
                                className="bg-black/20 border-white/10 focus:border-primary/50 text-white placeholder:text-muted-foreground/50 min-h-[120px] font-mono text-xs leading-relaxed"
                                value={node.data.value || ''}
                                onChange={(e) => handleChange('value', e.target.value)}
                                placeholder="Enter default text..."
                            />
                        </div>
                    )}

                    {node.type === 'concat' && (
                        <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Separator</Label>
                            <Input
                                type="text"
                                className="bg-black/20 border-white/10 focus:border-primary/50 text-white font-mono"
                                value={node.data.separator || ''}
                                onChange={(e) => handleChange('separator', e.target.value)}
                                placeholder="e.g. space, comma..."
                            />
                        </div>
                    )}

                    {/* Replicate / Inpaint / RemoveBG */}
                    {['replicate', 'inpaint', 'remove_bg'].includes(node.type || '') && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Model ID</Label>
                                <Input
                                    type="text"
                                    className="bg-black/20 border-white/10 focus:border-primary/50 text-white font-mono text-xs"
                                    value={node.data.model_id || ''}
                                    disabled={node.type !== 'replicate'} // Only generic replicate allows changing model
                                    onChange={(e) => handleChange('model_id', e.target.value)}
                                />
                            </div>


                            {/* Remove BG Specific options */}
                            {node.type === 'remove_bg' && (
                                <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={node.data.parameters?.return_mask || false}
                                            onChange={(e) => handleParameterChange('return_mask', e.target.checked)}
                                            className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary focus:ring-offset-0 transition-colors"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Output Mask Only</span>
                                            <span className="text-[10px] text-muted-foreground">Returns a B&W mask instead of the cutout subject.</span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="space-y-5">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                                    Parameters
                                </h3>

                                <div className="space-y-3">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Prompt</Label>
                                    <Textarea
                                        className="bg-black/20 border-white/10 focus:border-primary/50 text-white placeholder:text-muted-foreground/50 min-h-[100px]"
                                        value={node.data.parameters?.prompt || ''}
                                        onChange={(e) => handleParameterChange('prompt', e.target.value)}
                                        placeholder="Describe what you want to generate..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Negative Prompt</Label>
                                    <Textarea
                                        className="bg-black/20 border-white/10 focus:border-primary/50 text-white placeholder:text-muted-foreground/50 min-h-[80px]"
                                        value={node.data.parameters?.negative_prompt || ''}
                                        onChange={(e) => handleParameterChange('negative_prompt', e.target.value)}
                                        placeholder="what to avoid (e.g. blurry, distorted)..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Aspect Ratio</Label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-white/10 bg-black/20 text-white text-sm focus:border-primary/50 focus:ring-0"
                                        value={node.data.parameters?.aspect_ratio || '1:1'}
                                        onChange={(e) => handleParameterChange('aspect_ratio', e.target.value)}
                                    >
                                        <option value="1:1">1:1 Square</option>
                                        <option value="16:9">16:9 Landscape</option>
                                        <option value="9:16">9:16 Portrait</option>
                                        <option value="4:3">4:3 Standard</option>
                                        <option value="3:4">3:4 Portrait</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
