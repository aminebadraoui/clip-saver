
import {
    Type, Image as ImageIcon, Video, Mic,
    Sparkles, // Generic AI
    MessageSquare, // Text
    Palette, // Image gen
    Wand2, // Image edit
    Film, // Video
    Music, // Audio
    Layers, // Utils
    Lightbulb // Ideation
} from 'lucide-react';

export type NodeType = 'input' | 'llm_model' | 'output' | 'utility' | 'media_input' | 'ideation_source';

export interface NodeParam {
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
    options?: string[]; // for select
    defaultValue?: any;
    description?: string;
    required?: boolean;
}

export interface NodeDefinition {
    id: string;
    type: NodeType;
    label: string;
    description: string;
    icon: any;
    modelId?: string;
    category: string;
    inputs: { name: string; type: string; label?: string }[];
    outputs: { name: string; type: string; label?: string }[];
    parameters?: NodeParam[];
    data?: any;
}

export const NODE_CATEGORIES = [
    { id: 'inputs', label: 'Inputs', color: 'bg-zinc-600', icon: Type },
    { id: 'text_models', label: 'Text Models', color: 'bg-blue-600', icon: MessageSquare },
    { id: 'image_gen', label: 'Image Generation', color: 'bg-purple-600', icon: Palette },
    { id: 'image_edit', label: 'Image Editing', color: 'bg-pink-600', icon: Wand2 },
    { id: 'video_models', label: 'Video Models', color: 'bg-orange-600', icon: Film },
    { id: 'audio_models', label: 'Audio Models', color: 'bg-green-600', icon: Music },
    { id: 'utils', label: 'Utilities', color: 'bg-gray-600', icon: Layers },
];

export const NODE_DEFINITIONS: NodeDefinition[] = [
    // --- INPUTS ---
    {
        id: 'input_text',
        type: 'input',
        label: 'Text Input',
        description: 'Provide a text prompt',
        icon: Type,
        category: 'inputs',
        inputs: [],
        outputs: [{ name: 'output', type: 'string', label: 'Text' }],
        parameters: [
            { name: 'value', label: 'Initial Value', type: 'textarea' }
        ]
    },
    {
        id: 'input_image',
        type: 'media_input',
        label: 'Image Input',
        description: 'Upload or provide image URL',
        icon: ImageIcon,
        category: 'inputs',
        inputs: [],
        outputs: [{ name: 'output', type: 'image', label: 'Image' }],
        parameters: [
            { name: 'url', label: 'Image URL', type: 'string' }
        ]
    },
    {
        id: 'input_audio',
        type: 'media_input',
        label: 'Audio Input',
        description: 'Upload or provide audio URL',
        icon: Mic,
        category: 'inputs',
        inputs: [],
        outputs: [{ name: 'output', type: 'audio', label: 'Audio' }],
        parameters: [
            { name: 'url', label: 'Audio URL', type: 'string' }
        ]
    },
    {
        id: 'input_video',
        type: 'media_input',
        label: 'Video Input',
        description: 'Upload or provide video URL',
        icon: Video,
        category: 'inputs',
        inputs: [],
        outputs: [{ name: 'output', type: 'video', label: 'Video' }],
        parameters: [
            { name: 'url', label: 'Video URL', type: 'string' }
        ]
    },
    {
        id: 'input_title',
        type: 'input',
        label: 'Title Input',
        description: 'Import a video title from your library',
        icon: Type,
        category: 'inputs',
        inputs: [],
        outputs: [{ name: 'output', type: 'string', label: 'Title' }],
        data: { subtype: 'title' },
        parameters: [
            { name: 'value', label: 'Title', type: 'textarea' }
        ]
    },
    {
        id: 'input_script',
        type: 'input',
        label: 'Script Input',
        description: 'Import a video script from your library',
        icon: Type,
        category: 'inputs',
        inputs: [],
        outputs: [{ name: 'output', type: 'string', label: 'Script' }],
        data: { subtype: 'script' },
        parameters: [
            { name: 'value', label: 'Script', type: 'textarea' }
        ]
    },
    {
        id: 'input_thumbnail',
        type: 'media_input',
        label: 'Thumbnail Input',
        description: 'Import a thumbnail from your library',
        icon: ImageIcon,
        category: 'inputs',
        inputs: [],
        outputs: [{ name: 'output', type: 'image', label: 'Thumbnail' }],
        data: { subtype: 'thumbnail' },
        parameters: [
            { name: 'url', label: 'Image URL', type: 'string' }
        ]
    },
    {
        id: 'input_ideation',
        type: 'ideation_source',
        label: 'Video Ideation Source',
        description: 'Import strategy from Video Ideation',
        icon: Lightbulb,
        category: 'inputs',
        inputs: [],
        outputs: [{ name: 'output', type: 'object', label: 'Strategy' }], // Output is an object
        parameters: []
    },

    // --- TEXT MODELS ---
    {
        id: 'gpt-5',
        type: 'llm_model',
        modelId: 'openai/gpt-5',
        label: 'GPT-5',
        description: 'OpenAI\'s new model excelling at coding, writing, and reasoning.',
        icon: Sparkles,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }, { name: 'image', type: 'image', label: 'Image (Optional)' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: [
            { name: 'reasoning_effort', label: 'Reasoning Effort', type: 'select', options: ['minimal', 'low', 'medium', 'high'], defaultValue: 'medium' }
        ]
    },
    {
        id: 'gpt-5-structured',
        type: 'llm_model',
        modelId: 'openai/gpt-5-structured',
        label: 'GPT-5 Structured',
        description: 'Structured outputs, web search and custom tools',
        icon: Sparkles,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'gpt-5-nano',
        type: 'llm_model',
        modelId: 'openai/gpt-5-nano',
        label: 'GPT-5 Nano',
        description: 'Fastest, most cost-effective GPT-5 model',
        icon: Sparkles,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'gpt-5-mini',
        type: 'llm_model',
        modelId: 'openai/gpt-5-mini',
        label: 'GPT-5 Mini',
        description: 'Faster version of OpenAI\'s flagship GPT-5 model',
        icon: Sparkles,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'gpt-4.1',
        type: 'llm_model',
        modelId: 'openai/gpt-4.1',
        label: 'GPT-4.1',
        description: 'OpenAI\'s Flagship GPT model for complex tasks',
        icon: MessageSquare,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'gpt-4.1-nano',
        type: 'llm_model',
        modelId: 'openai/gpt-4.1-nano',
        label: 'GPT-4.1 Nano',
        description: 'Fastest, most cost-effective GPT-4.1 model',
        icon: MessageSquare,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'gpt-4.1-mini',
        type: 'llm_model',
        modelId: 'openai/gpt-4.1-mini',
        label: 'GPT-4.1 Mini',
        description: 'Fast, affordable version of GPT-4.1',
        icon: MessageSquare,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'gpt-4o',
        type: 'llm_model',
        modelId: 'openai/gpt-4o',
        label: 'GPT-4o',
        description: 'OpenAI\'s high-intelligence chat model',
        icon: MessageSquare,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }, { name: 'image', type: 'image', label: 'Image (Optional)' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'o1',
        type: 'llm_model',
        modelId: 'openai/o1',
        label: 'o1',
        description: 'OpenAI\'s first o-series reasoning model',
        icon: Sparkles,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'o4-mini',
        type: 'llm_model',
        modelId: 'openai/o4-mini',
        label: 'o4 Mini',
        description: 'Fast, lightweight reasoning model',
        icon: Sparkles,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'gemini-3-flash',
        type: 'llm_model',
        modelId: 'google/gemini-3-flash',
        label: 'Gemini 3 Flash',
        description: 'Speed with frontier intelligence and search',
        icon: Sparkles,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }, { name: 'media', type: 'any' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: [
            { name: 'thinking_level', label: 'Thinking Level', type: 'select', options: ['minimal', 'low', 'medium', 'high'] }
        ]
    },
    {
        id: 'kimi-k2.5',
        type: 'llm_model',
        modelId: 'moonshotai/kimi-k2.5',
        label: 'Kimi k2.5',
        description: 'Unifies vision, text, thinking and non-thinking modes',
        icon: Sparkles,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }, { name: 'media', type: 'any' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },
    {
        id: 'llama-4-maverick',
        type: 'llm_model',
        modelId: 'meta/llama-4-maverick-instruct',
        label: 'Llama 4 Maverick',
        description: 'A 17 billion parameter model with 128 experts',
        icon: MessageSquare,
        category: 'text_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'string' }],
        parameters: []
    },

    // --- IMAGE GENERATION ---
    {
        id: 'gpt-image-1.5',
        type: 'llm_model',
        modelId: 'openai/gpt-image-1.5',
        label: 'GPT Image 1.5',
        description: 'Better instruction following and adherence to prompts',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'gpt-image-1-mini',
        type: 'llm_model',
        modelId: 'openai/gpt-image-1-mini',
        label: 'GPT Image 1 Mini',
        description: 'Cost-efficient version of GPT Image 1',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'dall-e-3',
        type: 'llm_model',
        modelId: 'openai/dall-e-3',
        label: 'DALL-E 3',
        description: 'Realistic images from natural language',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'dall-e-2',
        type: 'llm_model',
        modelId: 'openai/dall-e-2',
        label: 'DALL-E 2',
        description: 'The original classic DALL-E 2',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'flux-2-klein-9b',
        type: 'llm_model',
        modelId: 'black-forest-labs/flux-2-klein-9b',
        label: 'FLUX.2 Klein 9B',
        description: 'Distilled foundation model, maximum flexibility',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'flux-2-klein-9b-base',
        type: 'llm_model',
        modelId: 'black-forest-labs/flux-2-klein-9b-base',
        label: 'FLUX.2 Klein 9B Base',
        description: 'Un-distilled version for control',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'flux-2-klein-4b-base',
        type: 'llm_model',
        modelId: 'black-forest-labs/flux-2-klein-4b-base',
        label: 'FLUX.2 Klein 4B Base',
        description: 'Optimized for fine-tuning and post-training',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'qwen-image',
        type: 'llm_model',
        modelId: 'qwen/qwen-image',
        label: 'Qwen Image',
        description: 'Advances in complex text rendering',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'qwen-image-2512',
        type: 'llm_model',
        modelId: 'qwen/qwen-image-2512',
        label: 'Qwen Image 2512',
        description: 'Improved human generation and finer textures',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'z-image-turbo',
        type: 'llm_model',
        modelId: 'prunaai/z-image-turbo',
        label: 'Z-Image Turbo',
        description: 'Super fast text-to-image (6B params)',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'p-image',
        type: 'llm_model',
        modelId: 'prunaai/p-image',
        label: 'P-Image',
        description: 'Sub 1 second text-to-image for production',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'riverflow-v2-max',
        type: 'llm_model',
        modelId: 'sourceful/riverflow-v2-max-preview',
        label: 'Riverflow V2 Max',
        description: 'Most powerful Riverflow model for brand assets',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'riverflow-v2-std',
        type: 'llm_model',
        modelId: 'sourceful/riverflow-v2-standard-preview',
        label: 'Riverflow V2 Std',
        description: 'Main version for brand design',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'riverflow-v2-fast',
        type: 'llm_model',
        modelId: 'sourceful/riverflow-v2-fast-preview',
        label: 'Riverflow V2 Fast',
        description: 'Fast version for brand assets',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },

    {
        id: 'nano-banana-pro-gen',
        type: 'llm_model',
        modelId: 'google/nano-banana-pro',
        label: 'Nano Banana Pro',
        description: 'SOTA image generation 🍌🍌',
        icon: Palette,
        category: 'image_gen',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },

    // --- IMAGE EDITING ---
    {
        id: 'nano-banana-pro',
        type: 'llm_model',
        modelId: 'google/nano-banana-pro',
        label: 'Nano Banana Pro',
        description: 'SOTA image generation and editing 🍌🍌',
        icon: Wand2,
        category: 'image_edit',
        inputs: [{ name: 'image', type: 'image' }, { name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'flux-2-klein-4b',
        type: 'llm_model',
        modelId: 'black-forest-labs/flux-2-klein-4b',
        label: 'FLUX.2 Klein 4B',
        description: 'Fast generation and editing (distilled)',
        icon: Wand2,
        category: 'image_edit',
        inputs: [{ name: 'image', type: 'image' }, { name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'qwen-image-edit',
        type: 'llm_model',
        modelId: 'qwen/qwen-image-edit-2511',
        label: 'Qwen Image Edit',
        description: 'Enhanced editing with better consistency',
        icon: Wand2,
        category: 'image_edit',
        inputs: [{ name: 'image', type: 'image' }, { name: 'prompt', type: 'string' }, { name: 'mask', type: 'mask', label: 'Mask (Optional)' }],
        outputs: [{ name: 'output', type: 'image' }],
        parameters: []
    },
    {
        id: 'crystal-video-upscaler',
        type: 'llm_model',
        modelId: 'philz1337x/crystal-video-upscaler',
        label: 'Crystal Video Upscaler',
        description: 'High-precision upscaler for portraits/faces',
        icon: Wand2,
        category: 'image_edit', // Technically video edit but fits here for now or separate
        inputs: [{ name: 'video', type: 'video' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },

    // --- VIDEO MODELS ---
    {
        id: 'sora-2-pro',
        type: 'llm_model',
        modelId: 'openai/sora-2-pro',
        label: 'Sora 2 Pro',
        description: 'Most advanced synced-audio video generation',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'sora-2',
        type: 'llm_model',
        modelId: 'openai/sora-2',
        label: 'Sora 2',
        description: 'Flagship video generation with synced audio',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'wan-2.2-t2v',
        type: 'llm_model',
        modelId: 'wan-video/wan-2.2-t2v-fast',
        label: 'Wan 2.2 T2V Fast',
        description: 'Fast and cheap PrunaAI optimized Text-to-Video',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'wan-2.2-i2v',
        type: 'llm_model',
        modelId: 'wan-video/wan-2.2-i2v-fast',
        label: 'Wan 2.2 I2V Fast',
        description: 'Fast and cheap PrunaAI optimized Image-to-Video',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'image', type: 'image' }, { name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'kling-v2.6',
        type: 'llm_model',
        modelId: 'kwaivgi/kling-v2.6',
        label: 'Kling 2.6 Pro',
        description: 'Top-tier I2V with cinematic visuals and audio',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'image', type: 'image' }, { name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'kling-v2.6-motion',
        type: 'llm_model',
        modelId: 'kwaivgi/kling-v2.6-motion-control',
        label: 'Kling 2.6 Motion',
        description: 'Precise control of character actions from reference',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'image', type: 'image' }, { name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'kling-v2.5-turbo',
        type: 'llm_model',
        modelId: 'kwaivgi/kling-v2.5-turbo-pro',
        label: 'Kling 2.5 Turbo Pro',
        description: 'Pro-level creation with smooth motion',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'image', type: 'image' }, { name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'audio-to-video',
        type: 'llm_model',
        modelId: 'lightricks/audio-to-video',
        label: 'Audio to Video',
        description: 'Use audio input with an image or prompt',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'audio', type: 'audio' }, { name: 'image', type: 'image' }, { name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'ltx-2-distilled',
        type: 'llm_model',
        modelId: 'lightricks/ltx-2-distilled',
        label: 'LTX 2 Distilled',
        description: 'First open source audio-video model',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },
    {
        id: 'seedance-1.5',
        type: 'llm_model',
        modelId: 'bytedance/seedance-1.5-pro',
        label: 'Seedance 1.5 Pro',
        description: 'Joint audio-video model following complex instructions',
        icon: Film,
        category: 'video_models',
        inputs: [{ name: 'prompt', type: 'string' }],
        outputs: [{ name: 'output', type: 'video' }],
        parameters: []
    },

    // --- AUDIO MODELS ---
    {
        id: 'qwen3-tts',
        type: 'llm_model',
        modelId: 'qwen/qwen3-tts',
        label: 'Qwen3 TTS',
        description: 'Unified Text-to-Speech: Voice, Clone, Design',
        icon: Music,
        category: 'audio_models',
        inputs: [{ name: 'text', type: 'string' }],
        outputs: [{ name: 'output', type: 'audio' }],
        parameters: []
    }
];

export function getNodeDefinition(id: string): NodeDefinition | undefined {
    return NODE_DEFINITIONS.find(def => def.id === id);
}
