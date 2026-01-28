import type { Node, Edge } from 'reactflow';


export interface WorkflowTemplate {
    id: string;
    label: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'thumbnail-remix',
        label: 'Thumbnail Remix',
        description: 'Analysis -> Brainstorming -> Creation using Vision & Reasoning models',
        nodes: [
            // 1. Original Thumbnail Input
            {
                id: 'media_input_1',
                type: 'media_input',
                position: { x: 0, y: 0 },
                data: {
                    label: 'Original Thumbnail',
                    definitionId: 'input_thumbnail'
                }
            },

            // 1.5. Reference Image Input (Style/Subject Ref)
            {
                id: 'media_input_ref',
                type: 'media_input',
                position: { x: 1500, y: 200 },
                data: {
                    label: 'Reference Image',
                    definitionId: 'input_thumbnail'
                }
            },

            // 2. Analysis Prompt
            {
                id: 'text_input_analysis',
                type: 'input',
                position: { x: 0, y: 500 },
                data: {
                    label: 'Analysis Prompt',
                    definitionId: 'input_text',
                    value: 'Analyze this thumbnail in extreme detail. If it is a photograph, specify the camera angle, lens type, lighting setup, and depth of field. If it is an illustration, describe the art style, brushwork, and line quality. For both, meticulously analyze the color palette, composition, subject expression, and text overlays (fonts, placement, hierarchy). Leave no stone unturned in explaining exactly why this image works.'
                }
            },

            // 3. Vision Analysis (GPT-4o)
            {
                id: 'llm_vision_analysis',
                type: 'llm_model',
                position: { x: 500, y: 150 },
                data: {
                    definitionId: 'gpt-4o',
                    model_id: 'openai/gpt-4o'
                }
            },

            // 4. Video Context: Title
            {
                id: 'input_title_node',
                type: 'input',
                position: { x: 500, y: 600 },
                data: {
                    label: 'Video Title',
                    definitionId: 'input_title',
                    value: '[Your Title Here]'
                }
            },

            // 5. Video Context: Script
            {
                id: 'input_script_node',
                type: 'input',
                position: { x: 500, y: 800 },
                data: {
                    label: 'Video Script',
                    definitionId: 'input_script',
                    value: '[Paste script or summary here]'
                }
            },

            // 6. Brainstorm Instruction
            {
                id: 'text_input_instruction',
                type: 'input',
                position: { x: 500, y: 1100 },
                data: {
                    label: 'Brainstorm Instruction',
                    definitionId: 'input_text',
                    value: 'Using the detailed visual analysis of the reference thumbnail and the provided video context (Title & Script), brainstorm a high-converting thumbnail concept.\n\nCRITICAL RULES:\n1. Do NOT repeat the video title in the thumbnail text. The thumbnail text must complement the title to create a curiosity gap.\n2. Leverage the "vibe" and technical success factors from the reference analysis (composition, lighting, style) but adapt them completely to the new video topic.\n3. Output ONLY a highly detailed image generation prompt. Specify the subject\'s expression, the exact text overlay (short, punchy, curiosity-inducing), the background details, lighting setup, and color grading.\n\nYour goal is to stop the scroll by combining the proven visual formula of the reference with the unique hook of this new video.'
                }
            },

            // 7. Concat Node
            {
                id: 'concat_brainstorm',
                type: 'concat',
                position: { x: 1000, y: 550 },
                data: {
                    label: 'Combine Inputs',
                    separator: '\n\n---\n\n'
                }
            },

            // 8. Reasoning LLM (Brainstorming)
            {
                id: 'llm_brainstorm',
                type: 'llm_model',
                position: { x: 1500, y: 550 },
                data: {
                    definitionId: 'o1',
                    model_id: 'openai/o1'
                }
            },

            // 9. Image Gen (Nano Banana Pro)
            {
                id: 'image_gen_final',
                type: 'llm_model',
                position: { x: 2000, y: 300 },
                data: {
                    definitionId: 'nano-banana-pro',
                    model_id: 'google/nano-banana-pro'
                }
            }
        ],
        edges: [
            // Connect to Vision Analysis
            { id: 'e1', source: 'media_input_1', sourceHandle: 'output', target: 'llm_vision_analysis', targetHandle: 'image' },
            { id: 'e2', source: 'text_input_analysis', sourceHandle: 'output', target: 'llm_vision_analysis', targetHandle: 'prompt' },

            // Connect to Concat
            { id: 'e3', source: 'llm_vision_analysis', sourceHandle: 'output', target: 'concat_brainstorm', targetHandle: 'input' },
            { id: 'e4_title', source: 'input_title_node', sourceHandle: 'output', target: 'concat_brainstorm', targetHandle: 'input' },
            { id: 'e4_script', source: 'input_script_node', sourceHandle: 'output', target: 'concat_brainstorm', targetHandle: 'input' },
            { id: 'e5', source: 'text_input_instruction', sourceHandle: 'output', target: 'concat_brainstorm', targetHandle: 'input' },

            { id: 'e6', source: 'concat_brainstorm', sourceHandle: 'output', target: 'llm_brainstorm', targetHandle: 'prompt' },

            // Connect to Final Gen (Nano Banana Pro)
            // It receives the Prompt + Original Image + Reference Image
            { id: 'e7', source: 'llm_brainstorm', sourceHandle: 'output', target: 'image_gen_final', targetHandle: 'prompt' },
            { id: 'e8', source: 'media_input_1', sourceHandle: 'output', target: 'image_gen_final', targetHandle: 'image' },
            { id: 'e9', source: 'media_input_ref', sourceHandle: 'output', target: 'image_gen_final', targetHandle: 'image' },
        ]
    }
];
