import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

// Import context files as raw strings
import systemPromptRaw from '../context/1_system_prompt.md?raw';
import featuresExamplesRaw from '../context/2_features_examples.md?raw';
import techInterfacesRaw from '../context/3_tech_interfaces.md?raw';
import wikiRaw from '../context/4_comprehensive_wiki.md?raw';

const STORAGE_KEY = 'tonai_gemini_api_key';

export const getApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const setApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, key);
};

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Most powerful model for complex tasks.',
    badge: 'Best',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Reasoning model for complex tasks.',
    badge: 'Recommended',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fastest and most capable model for most tasks.',
    badge: 'Fast',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    description: 'Optimized for cost efficiency and speed.',
    badge: 'Lite',
  },
];

export const DEFAULT_MODEL = 'gemini-3-pro-preview';

// --- RAG Implementation ---

let vectorStore: MemoryVectorStore | null = null;
let isIndexing = false;

const initRAG = async (apiKey: string) => {
  if (vectorStore || isIndexing) return;
  isIndexing = true;

  try {
    console.log('Initializing RAG System...');
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: 'embedding-001', // Or text-embedding-004
      apiKey: apiKey,
    });

    const docs = [
      new Document({ pageContent: featuresExamplesRaw, metadata: { source: 'features_examples' } }),
      new Document({ pageContent: techInterfacesRaw, metadata: { source: 'tech_interfaces' } }),
      new Document({ pageContent: wikiRaw, metadata: { source: 'wiki' } }),
    ];

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    vectorStore = new MemoryVectorStore(embeddings);
    await vectorStore.addDocuments(splitDocs);
    console.log(`RAG System Initialized with ${splitDocs.length} chunks.`);
  } catch (error) {
    console.error('Failed to initialize RAG:', error);
  } finally {
    isIndexing = false;
  }
};

const retrieveContext = async (query: string, apiKey: string): Promise<Document[]> => {
  if (!vectorStore) {
    await initRAG(apiKey);
  }

  if (!vectorStore) return []; // Fallback if init failed

  try {
    const results = await vectorStore.similaritySearch(query, 3); // Retrieve top 3 chunks
    return results;
  } catch (error) {
    console.error('RAG Retrieval Error:', error);
    return [];
  }
};

const formatSources = (docs: Document[]): string => {
  if (!docs || docs.length === 0) return '';

  const sourcesList = docs
    .map((doc) => {
      const sourceName = doc.metadata.source || 'Unknown';
      // Truncate content for display but PRESERVE NEWLINES
      const cleanContent = doc.pageContent.replace(/`/g, "'"); // minimal escaping
      let snippet = cleanContent.slice(0, 500); // Increased limit
      if (cleanContent.length > 500) snippet += '...';

      // Format as a blockquote, ensuring each line is quoted
      const quotedSnippet = snippet
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');

      return `
**Source: ${sourceName}**
${quotedSnippet}
`;
    })
    .join('\n\n');

  return `
<br/>

<details>
<summary><strong>📚 Referenced Sources (${docs.length})</strong></summary>

${sourcesList}

</details>
`;
};

// --------------------------

const getAI = (modelName: string = DEFAULT_MODEL, temperature: number = 0.7) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key not found. Please set your Gemini API Key in settings.');
  }
  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: apiKey,
    temperature: temperature,
  });
};

const cleanCode = (text: string) => {
  let code = text
    .replace(/```javascript/g, '')
    .replace(/```typescript/g, '')
    .replace(/```/g, '')
    .trim();

  // Programmatically ensure Tone import exists for TypeScript autocomplete
  if (!code.startsWith("import * as Tone from 'tone';")) {
    code = `import * as Tone from 'tone';\n\n${code}`;
  }

  return code;
};

export const generateMusicCode = async (
  prompt: string,
  model: string = DEFAULT_MODEL
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key required');

    const ai = getAI(model, 0.7);

    // RAG Retrieval
    const docs = await retrieveContext(prompt, apiKey);
    const context = docs
      .map((d) => `[Source: ${d.metadata.source}]\n${d.pageContent}`)
      .join('\n\n');

    const systemInstruction = `
${systemPromptRaw}

RETRIEVED CONTEXT FROM KNOWLEDGE BASE:
${context}

Use the above context to ensure your code uses correct Tone.js syntax and features.
`;

    const messages = [
      new SystemMessage(systemInstruction),
      new HumanMessage(`Create a Tone.js composition for: ${prompt}`),
    ];

    const response = await ai.invoke(messages);
    return cleanCode(response.content as string);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (error.message?.includes('API Key') || error.toString().includes('API Key')) {
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
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key required');

    const ai = getAI(model, 0.5); // Lower temperature for edits

    // RAG Retrieval for refinement
    const docs = await retrieveContext(instruction, apiKey);
    const context = docs
      .map((d) => `[Source: ${d.metadata.source}]\n${d.pageContent}`)
      .join('\n\n');

    const systemInstruction = `
${systemPromptRaw}

RETRIEVED CONTEXT:
${context}
`;

    let userPrompt = `
    EXISTING CODE:
    ${currentCode}

    USER INSTRUCTION:
    ${instruction}
    `;

    if (errorContext) {
      userPrompt += `
      
    PREVIOUS RUNTIME ERROR:
    ${errorContext}

    PRIORITY TASK:
    The EXISTING CODE crashed with the error above. 
    1. Fix the error in the code (check parameter ranges, undefined variables, or invalid Tone.js usage).
    2. Then, apply the USER INSTRUCTION.
    `;
    } else {
      userPrompt += `
    Task: Modify the EXISTING CODE to satisfy the USER INSTRUCTION. 
    Maintain the structure of the existing code unless the user asks to change it completely. 
    Ensure the code remains valid Tone.js code and ADHERES TO CRITICAL PARAMETER SAFETY (e.g. octaves < 6, Q < 5).
    `;
    }

    const messages = [new SystemMessage(systemInstruction), new HumanMessage(userPrompt)];

    const response = await ai.invoke(messages);
    return cleanCode(response.content as string);
  } catch (error: any) {
    console.error('Gemini API Refine Error:', error);
    if (error.message?.includes('API Key') || error.toString().includes('API Key')) {
      throw error;
    }
    throw new Error('Failed to refine music code. Please check your API Key or try again.');
  }
};

export const chatWithAI = async (
  messages: { role: 'user' | 'assistant'; content: string }[],
  currentCode: string,
  model: string = DEFAULT_MODEL
): Promise<{ text: string; code?: string }> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key required');

    const ai = getAI(model, 0.7);

    // Get the last user message for RAG
    const lastUserMessage =
      messages
        .slice()
        .reverse()
        .find((m) => m.role === 'user')?.content || '';
    const docs = await retrieveContext(lastUserMessage, apiKey);
    const context = docs
      .map((d) => `[Source: ${d.metadata.source}]\n${d.pageContent}`)
      .join('\n\n');

    const systemPrompt = `
${systemPromptRaw}

RETRIEVED CONTEXT:
${context}

ADDITIONAL INSTRUCTIONS FOR CHAT:
1. You are chatting with a user who wants to create music.
2. ALWAYS start your response with a <thinking> block where you analyze the request and plan your code.
3. Close the </thinking> block before generating the actual response/code.
4. If the user asks for a change or new music, GENERATE THE FULL CODE.
5. If you generate code, put it inside a markdown code block: \`\`\`javascript ... \`\`\`.
6. If the user just wants to chat or ask questions, just answer in text.
7. ALWAYS provide a brief explanation of what you did or answer the question.
8. When generating code, ensure it is COMPLETE and runnable. Do not return partial snippets unless explicitly asked.
    `;

    const chatHistory = messages.map((m) => {
      if (m.role === 'user') {
        return new HumanMessage(m.content);
      }
      return new AIMessage(m.content);
    });

    // Add current code context to the last message if it's a user message
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg instanceof HumanMessage) {
      lastMsg.content = `
      CURRENT CODE CONTEXT:
      ${currentCode}

      USER MESSAGE:
      ${lastMsg.content}
      `;
    }

    const finalMessages = [new SystemMessage(systemPrompt), ...chatHistory];

    const response = await ai.invoke(finalMessages);
    const content = response.content as string;

    // Extract code if present
    const codeMatch = content.match(/```(?:javascript|typescript)?\s*([\s\S]*?)\s*```/);
    let code: string | undefined;
    let text = content;

    if (codeMatch) {
      code = cleanCode(codeMatch[1]);
      text = content.replace(
        /```(?:javascript|typescript)?\s*([\s\S]*?)\s*```/,
        '[Code updated in Editor]'
      );
    }

    // Append sources
    text += formatSources(docs);

    return { text, code };
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    if (error.message?.includes('API Key') || error.toString().includes('API Key')) {
      throw error;
    }
    throw new Error('Failed to chat. Please check your API Key or try again.');
  }
};

export async function* streamChatWithAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  currentCode: string,
  model: string = DEFAULT_MODEL
): AsyncGenerator<string, void, unknown> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key required');

    const ai = getAI(model, 0.7);

    // Get the last user message for RAG
    const lastUserMessage =
      messages
        .slice()
        .reverse()
        .find((m) => m.role === 'user')?.content || '';
    const docs = await retrieveContext(lastUserMessage, apiKey);
    const context = docs
      .map((d) => `[Source: ${d.metadata.source}]\n${d.pageContent}`)
      .join('\n\n');

    const systemPrompt = `
${systemPromptRaw}

RETRIEVED CONTEXT:
${context}

ADDITIONAL INSTRUCTIONS FOR CHAT:
1. You are chatting with a user who wants to create music.
2. ALWAYS start your response with a <thinking> block where you analyze the request and plan your code.
3. Close the </thinking> block before generating the actual response/code.
4. If the user asks for a change or new music, GENERATE THE FULL CODE.
5. If you generate code, put it inside a markdown code block: \`\`\`javascript ... \`\`\`.
6. If the user just wants to chat or ask questions, just answer in text.
7. ALWAYS provide a brief explanation of what you did or answer the question.
8. When generating code, ensure it is COMPLETE and runnable. Do not return partial snippets unless explicitly asked.
    `;

    const chatHistory = messages.map((m) => {
      if (m.role === 'user') {
        return new HumanMessage(m.content);
      }
      return new AIMessage(m.content);
    });

    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg instanceof HumanMessage) {
      lastMsg.content = `
      CURRENT CODE CONTEXT:
      ${currentCode}

      USER MESSAGE:
      ${lastMsg.content}
      `;
    }

    const finalMessages = [new SystemMessage(systemPrompt), ...chatHistory];

    const stream = await ai.stream(finalMessages);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }

    // Append sources at the end of the stream
    const sourcesHtml = formatSources(docs);
    if (sourcesHtml) {
      yield sourcesHtml;
    }
  } catch (error: any) {
    console.error('Gemini Stream Error:', error);
    if (error.message?.includes('API Key') || error.toString().includes('API Key')) {
      throw error;
    }
    throw new Error('Failed to stream chat. Please check your API Key or try again.');
  }
}
