/**
 * Pre-built workflow templates for ClipCoba
 */

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    estimatedCredits: number;
    workflow: {
        nodes: any[];
        edges: any[];
    };
}

export const THUMBNAIL_GENERATOR_TEMPLATE: WorkflowTemplate = {
    id: 'youtube-thumbnail-generator',
    name: 'YouTube Thumbnail Generator',
    description: 'Generate eye-catching thumbnails from your clip using Google Nano Banana Pro',
    category: 'content-creation',
    estimatedCredits: 2,
    workflow: {
        nodes: [
            {
                id: 'input-1',
                type: 'input',
                data: {
                    name: 'clip_title',
                    label: 'Clip Title',
                    value: '',
                },
                position: { x: 100, y: 100 },
            },
            {
                id: 'replicate-1',
                type: 'replicate',
                data: {
                    model_id: 'google/nano-banana-pro',
                    model_name: 'Google Nano Banana Pro',
                    parameters: {
                        prompt: 'Create a bold, eye-catching YouTube thumbnail for: $input-1. Use vibrant colors, dramatic lighting, and make it attention-grabbing. Professional quality, high contrast, engaging composition.',
                        aspect_ratio: '16:9',
                        resolution: '2K',
                        output_format: 'png',
                        safety_filter_level: 'block_only_high',
                    },
                },
                position: { x: 400, y: 100 },
            },
            {
                id: 'output-1',
                type: 'output',
                data: {
                    name: 'thumbnail',
                    label: 'Generated Thumbnail',
                },
                position: { x: 700, y: 100 },
            },
        ],
        edges: [
            {
                id: 'e1',
                source: 'input-1',
                target: 'replicate-1',
                sourceHandle: 'output',
                targetHandle: 'input',
            },
            {
                id: 'e2',
                source: 'replicate-1',
                target: 'output-1',
                sourceHandle: 'output',
                targetHandle: 'input',
            },
        ],
    },
};

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    THUMBNAIL_GENERATOR_TEMPLATE,
    // More templates can be added here
];

/**
 * Execute a pre-built workflow template with input data
 */
export async function executeTemplate(
    templateId: string,
    inputData: Record<string, any>
): Promise<string> {
    const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
        throw new Error(`Template ${templateId} not found`);
    }

    // Replace input values in the workflow
    const workflow = JSON.parse(JSON.stringify(template.workflow));
    workflow.nodes.forEach((node: any) => {
        if (node.type === 'input' && inputData[node.data.name]) {
            node.data.value = inputData[node.data.name];
        }
    });

    return JSON.stringify(workflow);
}
