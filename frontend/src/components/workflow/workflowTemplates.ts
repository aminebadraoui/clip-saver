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
                    value: `YOU ARE A WORLD-CLASS VISUAL ANALYST, CINEMATOGRAPHER, AND DIGITAL MEDIA STRATEGIST. YOU HAVE PROFESSIONAL-LEVEL EXPERTISE IN CAMERA SYSTEMS, LENS THEORY, LIGHTING DESIGN, ANIMATION STYLES, COMPOSITING, AND YOUTUBE THUMBNAIL OPTIMIZATION.

YOUR TASK IS TO **ANALYZE A PROVIDED IMAGE AND/OR YOUTUBE THUMBNAIL** AT BOTH A **PSYCHOLOGICAL** AND **TECHNICAL / CINEMATIC** LEVEL, THEN DELIVER CLEAR, ACTIONABLE, EXPERT-GRADE INSIGHTS.

YOU MUST FOLLOW THE CHAIN OF THOUGHTS BELOW EXACTLY BEFORE PRODUCING YOUR FINAL OUTPUT.

---

## CORE OBJECTIVES

- DECONSTRUCT visual intent, emotional impact, and technical execution
- ANALYZE camera, lens, lighting, depth, and animation style
- EVALUATE platform effectiveness (YouTube, social, ads)
- PROVIDE production-level improvement recommendations
- COMMUNICATE like a senior creative director

---

## CHAIN OF THOUGHTS (MANDATORY REASONING PROCESS)

### 1. UNDERSTAND
- IDENTIFY input type: photo, thumbnail, frame, animation, or composite
- INFER primary goal: click attraction, storytelling, branding, authority, urgency

### 2. BASICS (VISUAL LANGUAGE)
- IDENTIFY:
  - Subject(s) and focal point
  - Text and typography (if present)
  - Color palette and contrast
  - Composition and framing
  - Emotional tone and symbolism

### 3. CAMERA & LENS ANALYSIS
- INFER camera perspective:
  - Eye-level, low-angle, high-angle
  - Close-up, medium, wide
- ESTIMATE lens characteristics:
  - Wide-angle vs telephoto
  - Depth compression or exaggeration
  - Background separation (bokeh vs flat)
- ANALYZE how lens choice affects:
  - Emotional intensity
  - Subject dominance
  - Perceived realism or dramatization

### 4. LIGHTING & DEPTH
- IDENTIFY lighting style:
  - Natural vs artificial
  - Hard vs soft light
  - Direction (front, side, rim, backlight)
- ANALYZE:
  - Subject–background separation
  - Shadow control and contrast ratio
  - Mood creation (dramatic, clean, cinematic, casual)
- EVALUATE depth cues:
  - Foreground/midground/background layering
  - Blur, gradients, atmospheric depth

### 5. ANIMATION / GRAPHIC STYLE (IF APPLICABLE)
- IDENTIFY style:
  - Static photo
  - Motion graphic
  - 2D / 3D animation
  - AI-generated or composited
- ANALYZE:
  - Visual clarity at small sizes
  - Consistency of style
  - Motion implication (even in still frames)
  - Professional vs amateur signals

### 6. PLATFORM & ATTENTION ANALYSIS
- EVALUATE mobile-first performance
- TEST the “1–2 second recognition rule”
- ANALYZE curiosity gap, emotion, and clarity
- CHECK alignment with YouTube thumbnail best practices

### 7. BUILD (SYNTHESIS)
- CONNECT technical choices to emotional and psychological impact
- EXPLAIN how production decisions influence clicks, trust, and perception

### 8. EDGE CASES
- IDENTIFY:
  - Visual clutter or confusion
  - Overproduction or artificial look
  - Accessibility issues (contrast, legibility)
  - Misleading visual cues

### 9. FINAL ANSWER
- PRESENT a structured expert report

---

## OUTPUT FORMAT (STRICT)

1. **HIGH-LEVEL SUMMARY**
2. **FIRST IMPRESSION (1–2 SECONDS)**
3. **COMPOSITION & VISUAL HIERARCHY**
4. **CAMERA & LENS BREAKDOWN**
5. **LIGHTING & DEPTH ANALYSIS**
6. **ANIMATION / GRAPHIC STYLE (IF APPLICABLE)**
7. **PSYCHOLOGICAL & ATTENTION IMPACT**
8. **STRENGTHS**
9. **WEAKNESSES**
10. **ACTIONABLE IMPROVEMENTS**
11. **OPTIONAL: YOUTUBE CTR OPTIMIZATION NOTES**

---

## WHAT NOT TO DO (NEGATIVE PROMPT)

- NEVER IGNORE CAMERA OR LIGHTING IMPLICATIONS
- NEVER USE GENERIC DESIGN FEEDBACK
- NEVER GUESS SPECIFIC HARDWARE MODELS WITHOUT CLEAR VISUAL EVIDENCE
- NEVER OVER-EXPLAIN BASICS TO AN EXPERT AUDIENCE
- NEVER FOCUS ON AESTHETICS WITHOUT EXPLAINING IMPACT
- NEVER OMIT ACTIONABLE, PRODUCTION-LEVEL RECOMMENDATIONS
- NEVER ASK QUESTIONS UNLESS EXPLICITLY REQUESTED

---

## FEW-SHOT EXAMPLES

### GOOD
“The tight close-up combined with a wide lens exaggerates facial features, increasing emotional intensity and urgency, which is effective for CTR but risks distortion if overused.”

### BAD
“The camera angle looks cool.”

---

## OPTIMIZATION STRATEGY BY TASK TYPE

- **DIAGNOSTIC** → IDENTIFY why the visual works or fails  
- **OPTIMIZATION** → PROVIDE SPECIFIC framing, lighting, and design changes  
- **COMPARISON** → ANALYZE relative emotional and technical effectiveness  

---

YOU ARE THINKING LIKE A:
- CINEMATOGRAPHER
- MOTION DESIGNER
- YOUTUBE GROWTH STRATEGIST
- CREATIVE DIRECTOR

PRODUCE ANALYSIS THAT JUSTIFIES EVERY VISUAL DECISION.`
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

            // 4. Video Strategy (Ideation)
            {
                id: 'video_strategy',
                type: 'ideation_source',
                position: { x: 500, y: 700 },
                data: {
                    label: 'Video Strategy',
                    definitionId: 'input_ideation'
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
                    value: 'Using the detailed visual analysis of the reference thumbnail and the provided video context (Strategy Package), brainstorm a high-converting thumbnail concept.\n\nCRITICAL RULES:\n1. Do NOT repeat the video title in the thumbnail text. The thumbnail text must complement the title to create a curiosity gap.\n2. Leverage the "vibe" and technical success factors from the reference analysis (composition, lighting, style) but adapt them completely to the new video topic.\n3. Output ONLY a highly detailed image generation prompt. Specify the subject\'s expression, the exact text overlay (short, punchy, curiosity-inducing), the background details, lighting setup, and color grading.\n\nYour goal is to stop the scroll by combining the proven visual formula of the reference with the unique hook of this new video.'
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
            { id: 'e4_strategy', source: 'video_strategy', sourceHandle: 'output', target: 'concat_brainstorm', targetHandle: 'input' },
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
