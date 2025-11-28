import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY = 'tonai_gemini_api_key';

export const getApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const setApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, key);
};

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.0-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Best for multimodal understanding and complex reasoning.',
    badge: 'Advanced',
  },
  {
    id: 'gemini-2.5-pro-preview',
    name: 'Gemini 2.5 Pro',
    description: 'State-of-the-art reasoning for code and complex problems.',
    badge: 'Smart',
  },
  {
    id: 'gemini-2.5-flash-preview',
    name: 'Gemini 2.5 Flash',
    description: 'Best cost-performance, low latency.',
    badge: 'Fast',
  },
  {
    id: 'gemini-2.5-flash-lite-preview',
    name: 'Gemini 2.5 Flash-Lite',
    description: 'Optimized for cost efficiency.',
    badge: 'Lite',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Second gen workhorse with 1M context.',
    badge: 'Stable',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    description: 'Fast second gen model.',
    badge: 'Lite',
  },
];

export const DEFAULT_MODEL = 'gemini-3.0-pro-preview';

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key not found. Please set your Gemini API Key in settings.');
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `
You are an expert audio engineer and JavaScript developer specializing in the 'tone' library (Tone.js).
Your task is to generate valid, executable JavaScript code that creates a music loop or soundscape based on the user's prompt.

Rules:
1. Use 'Tone' (it is globally available).
2. DO NOT import Tone. Assume 'Tone' is passed as an argument or available in scope.
3. Construct instruments (Synths, Samplers) and Effects (Reverb, Delay, Distortion).
4. Use 'Tone.Transport' to schedule events (e.g., Tone.Transport.schedule, Tone.Transport.scheduleRepeat, or Tone.Loop).
5. ALWAYS connect instruments to 'Tone.Destination' or via a chain ending in 'Tone.Destination'.
6. Set the BPM if relevant using 'Tone.Transport.bpm.value = ...'.
7. DO NOT call 'Tone.Transport.start()'. The wrapper will handle starting the transport.
8. DO NOT wrap the code in markdown blocks (like \`\`\`javascript). Return ONLY the raw code string.
9. Keep the code concise but interesting.
10. If the user asks for a specific genre, use appropriate scales and rhythms.

CRITICAL PARAMETER SAFETY:
- **Strictly adhere to these ranges to avoid crashes:**
  - 'wet', 'feedback', 'probability', 'humanize', 'mix': **0 to 1**. (NEVER > 1).
  - 'octaves' (for AutoWah, Phaser, etc): **1 to 6**. (NEVER > 6).
  - 'Q' (Quality factor): **0.5 to 5**. (NEVER > 5).
  - 'bits' (BitCrusher): **4 to 8**.
  - 'roomSize' (JCReverb): **0 to 0.9** (Avoid 1).
  - 'delayTime': **0 to 1** seconds or notation (e.g. "8n").
  - 'playbackRate': **0.5 to 2**.
- Volumes are in Decibels (dB) (e.g. -12, -6, 0). DO NOT use linear gain (0-1) for volume properties unless using a GainNode.
- If you are unsure of a parameter's max value, stick to the default or a conservative value (e.g. 0.5).
`;

const cleanCode = (text: string) => {
  return text
    .replace(/```javascript/g, '')
    .replace(/```/g, '')
    .trim();
};

export const generateMusicCode = async (
  prompt: string,
  model: string = DEFAULT_MODEL
): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: `Create a Tone.js composition for: ${prompt}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return cleanCode(response.text || '');
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (error.message.includes('API Key')) {
      throw error;
    }
    throw new Error('Failed to generate music code. Please check your API Key or try again.');
  }
};

export const refineMusicCode = async (
  currentCode: string,
  instruction: string,
  errorContext?: string | null,
  model: string = DEFAULT_MODEL
): Promise<string> => {
  try {
    const ai = getAI();
    let prompt = `
    EXISTING CODE:
    ${currentCode}

    USER INSTRUCTION:
    ${instruction}
    `;

    if (errorContext) {
      prompt += `
      
    PREVIOUS RUNTIME ERROR:
    ${errorContext}

    PRIORITY TASK:
    The EXISTING CODE crashed with the error above. 
    1. Fix the error in the code (check parameter ranges, undefined variables, or invalid Tone.js usage).
    2. Then, apply the USER INSTRUCTION.
    `;
    } else {
      prompt += `
    Task: Modify the EXISTING CODE to satisfy the USER INSTRUCTION. 
    Maintain the structure of the existing code unless the user asks to change it completely. 
    Ensure the code remains valid Tone.js code and ADHERES TO CRITICAL PARAMETER SAFETY (e.g. octaves < 6, Q < 5).
    `;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5, // Lower temperature for edits to be more precise
      },
    });

    return cleanCode(response.text || '');
  } catch (error: any) {
    console.error('Gemini API Refine Error:', error);
    if (error.message.includes('API Key')) {
      throw error;
    }
    throw new Error('Failed to refine music code. Please check your API Key or try again.');
  }
};
