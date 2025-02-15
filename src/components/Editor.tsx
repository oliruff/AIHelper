import { useRef, useState, useEffect } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Bot, Code2, Send, Terminal as TerminalIcon, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type { editor } from 'monaco-editor';
import { CodeGenRequest, type CodeGenResponse } from '../lib/types';
import { generateCode, searchTechnicalDocs } from '../lib/api';
import { withTimeout } from '../lib/utils';
import { Terminal } from './Terminal';
import { ProjectManager } from './ProjectManager';

export function CodeEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: "Hello! I'm your AI coding assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentModel, setCurrentModel] = useState<'GPT4' | 'CLAUDE' | 'CODEQWEN'>('GPT4');
  const [showTerminal, setShowTerminal] = useState(false);
  const [showProjects, setShowProjects] = useState(false);

  useEffect(() => {
    // Initialize Yjs
    const doc = new Y.Doc();
    const provider = new WebsocketProvider('wss://demos.yjs.dev', 'monaco-demo', doc);
    const type = doc.getText('monaco');

    if (editorRef.current) {
      new MonacoBinding(type, editorRef.current.getModel()!, new Set([editorRef.current]), provider.awareness);
    }

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, []);

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco settings
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1b26'
      }
    });
    monaco.editor.setTheme('custom-dark');
  }

  async function handleSubmit() {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    try {
      // Search for relevant documentation
      const docs = await searchTechnicalDocs(input);
      
      // Prepare the code generation request
      const request: CodeGenRequest = {
        prompt: input,
        model: currentModel,
        context: {
          files: [{
            path: 'current.ts',
            content: editorRef.current?.getValue() || ''
          }],
          language: 'typescript'
        }
      };

      // Generate code with fallback
      const response = await withTimeout(
        generateCode(request),
        15000, // 15 seconds timeout
        async () => {
          // Fallback to next model
          const models: Array<typeof currentModel> = ['GPT4', 'CLAUDE', 'CODEQWEN'];
          const currentIndex = models.indexOf(currentModel);
          const nextModel = models[(currentIndex + 1) % models.length];
          setCurrentModel(nextModel);
          
          return generateCode({
            ...request,
            model: nextModel
          });
        }
      );
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.code + (response.explanation ? '\n\n' + response.explanation : '')
      }]);

      if (editorRef.current && response.code) {
        editorRef.current.setValue(response.code);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">AI Development Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowTerminal(!showTerminal)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showTerminal ? "bg-gray-800 text-blue-400" : "hover:bg-gray-800"
              )}
            >
              <TerminalIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowProjects(!showProjects)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showProjects ? "bg-gray-800 text-blue-400" : "hover:bg-gray-800"
              )}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <PanelGroup direction="horizontal" className="h-[calc(100vh-64px)]">
        {showProjects && (
          <>
            <Panel defaultSize={25} minSize={20}>
              <ProjectManager />
            </Panel>
            <PanelResizeHandle className="w-2 bg-gray-800 hover:bg-gray-700 transition-colors" />
          </>
        )}

        <Panel defaultSize={60} minSize={30}>
          <div className="h-full">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              defaultValue="// Start coding here..."
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                bracketPairColorization: {
                  enabled: true
                }
              }}
            />
          </div>
        </Panel>
        
        <PanelResizeHandle className="w-2 bg-gray-800 hover:bg-gray-700 transition-colors" />
        
        <Panel minSize={30}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={showTerminal ? 70 : 100}>
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <ChatMessage 
                        key={index}
                        role={message.role}
                        content={message.content}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-800 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="Type your message..."
                      className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isProcessing}
                    />
                    <button 
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className={cn(
                        "rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
                        isProcessing && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Panel>

            {showTerminal && (
              <>
                <PanelResizeHandle className="h-2 bg-gray-800 hover:bg-gray-700 transition-colors" />
                <Panel defaultSize={30}>
                  <Terminal className="h-full" />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={cn(
      'flex gap-3 rounded-lg p-4',
      role === 'assistant' ? 'bg-gray-800' : 'bg-blue-500/10'
    )}>
      {role === 'assistant' ? (
        <Bot className="h-6 w-6 text-blue-400" />
      ) : (
        <div className="h-6 w-6 rounded-full bg-blue-500" />
      )}
      <p className="text-gray-100 whitespace-pre-wrap">{content}</p>
    </div>
  );
}