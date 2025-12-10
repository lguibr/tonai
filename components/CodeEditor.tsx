import React, { useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';

import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isLoading?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, className, isLoading }) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      strict: true, // Enforce strict type checking
      baseUrl: 'file:///',
      paths: {
        tone: ['node_modules/tone/build/esm/index.d.ts'],
      },
    });

    // Load Tone.js types from bundled JSON
    import('../src/tone-types.json')
      .then((module) => {
        const typeMap = module.default;

        // Inject all files
        Object.keys(typeMap).forEach((path) => {
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            typeMap[path],
            'file:///node_modules/tone/build/esm/' + path
          );
        });

        // Add a global declaration that exports everything from the main index
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          `
        import * as Tone from './node_modules/tone/build/esm/index.d.ts';
        declare global {
          const Tone: typeof Tone;
        }
        `,
          'file:///global.d.ts'
        );
      })
      .catch((err) => console.error('Failed to load Tone types', err));
  };

  return (
    <div className={`relative ${className}`}>
      <Editor
        height="100%"
        defaultLanguage="typescript"
        path="script.ts" // Explicitly set path to force TypeScript mode
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 128 },
          readOnly: isLoading,
        }}
      />
      {isLoading && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-300 bg-zinc-900/90 px-3 py-1.5 rounded-full border border-zinc-700/50 shadow-xl backdrop-blur-md">
            <Loader2 className="animate-spin text-purple-500" size={14} />
            <span>Generating code...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
