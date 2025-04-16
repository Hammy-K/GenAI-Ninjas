import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Code, RefreshCw } from 'lucide-react';
import { useStageState } from '@/hooks/useStageState';
import { useXpTracker } from '@/hooks/useXpTracker';
import { Confetti } from '@/components/ui/confetti';
import { useTranslation } from 'react-i18next';

// Import CodeMirror components and language packages
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

interface CodeEditorStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface CodeEditorState {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  activeTab: string;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>My First Web App</title>
</head>
<body>
  <h1>Hello World!</h1>
  <p>This is my first AI-powered web app.</p>
  <button id="changeColorBtn">Change Color</button>
</body>
</html>`;

const DEFAULT_CSS = `body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  padding: 20px;
}

h1 {
  color: #2c3e50;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9;
}`;

const DEFAULT_JS = `// This is a simple JavaScript example
document.getElementById('changeColorBtn').addEventListener('click', function() {
  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  document.body.style.backgroundColor = randomColor;
  
  // Add a message to show what happened
  const message = document.createElement('p');
  message.textContent = 'Color changed to: ' + randomColor;
  document.body.appendChild(message);
});

// You can use console.log to debug your code
console.log('JavaScript loaded!');`;

export function CodeEditorStage({ onComplete, onEarnXp, onUnlockBadge, onBack }: CodeEditorStageProps) {
  const { t } = useTranslation();
  const { isAlreadyAwarded, markAsAwarded, awardIfNotAlreadyAwarded } = useXpTracker();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Initialize state with localStorage values or defaults
  const [state, setState] = useStageState<CodeEditorState>('code_editor', {
    htmlCode: localStorage.getItem('code_editor_html') || DEFAULT_HTML,
    cssCode: localStorage.getItem('code_editor_css') || DEFAULT_CSS,
    jsCode: localStorage.getItem('code_editor_js') || DEFAULT_JS,
    activeTab: 'html',
    hasEarnedXp: false,
    hasUnlockedBadge: false
  });
  
  // Save code to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('code_editor_html', state.htmlCode);
    localStorage.setItem('code_editor_css', state.cssCode);
    localStorage.setItem('code_editor_js', state.jsCode);
  }, [state.htmlCode, state.cssCode, state.jsCode]);
  
  // Combined code for the preview
  const processedHtml = state.htmlCode
    .replace(/<html>/g, '')
    .replace(/<\/html>/g, '')
    .replace(/<head>[\s\S]*?<\/head>/g, '')
    .replace(/<body>/g, '')
    .replace(/<\/body>/g, '');

  const combinedCode = `
    <html>
      <head>
        <style>${state.cssCode}</style>
      </head>
      <body>
        ${processedHtml}
        <script>${state.jsCode}</script>
      </body>
    </html>
  `;

  // Handle tab change
  const handleTabChange = (value: string) => {
    setState(prev => ({ ...prev, activeTab: value }));
  };
  
  // Update code based on active tab
  const handleCodeChange = (value: string) => {
    switch (state.activeTab) {
      case 'html':
        setState(prev => ({ ...prev, htmlCode: value }));
        break;
      case 'css':
        setState(prev => ({ ...prev, cssCode: value }));
        break;
      case 'js':
        setState(prev => ({ ...prev, jsCode: value }));
        break;
    }
    
    // Award XP for making changes if not already awarded
    if (!state.hasEarnedXp) {
      if (awardIfNotAlreadyAwarded(onEarnXp, 20, 'code_editor_changes')) {
        setState(prev => ({ ...prev, hasEarnedXp: true }));
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };
  
  // Reset to defaults
  const handleReset = () => {
    setState(prev => ({
      ...prev,
      htmlCode: DEFAULT_HTML,
      cssCode: DEFAULT_CSS,
      jsCode: DEFAULT_JS
    }));
  };
  
  // Award badge when user continues to next stage
  const handleContinue = () => {
    // Award developer badge if not already awarded
    if (!state.hasUnlockedBadge) {
      if (!isAlreadyAwarded('code_editor_badge', 'web_developer_badge')) {
        onUnlockBadge('web_developer_badge', 'code_editor_badge');
        markAsAwarded('code_editor_badge', 'web_developer_badge');
        setState(prev => ({ ...prev, hasUnlockedBadge: true }));
      }
    }
    onComplete();
  };

  return (
    <div className="code-editor-stage">
      {showConfetti && <Confetti />}
      <div className="max-w-5xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Web Code Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Use this editor to create your own web page with HTML, CSS, and JavaScript.
              See your changes in real-time and save your work automatically.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Code Editor Panel */}
              <div className="flex flex-col h-[500px] border rounded-md overflow-hidden">
                <Tabs defaultValue="html" value={state.activeTab} onValueChange={handleTabChange} className="w-full">
                  <div className="bg-gray-100 border-b px-2 py-1">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="html" className="text-sm">
                        HTML
                      </TabsTrigger>
                      <TabsTrigger value="css" className="text-sm">
                        CSS
                      </TabsTrigger>
                      <TabsTrigger value="js" className="text-sm">
                        JavaScript
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="flex-grow overflow-auto">
                    <TabsContent value="html" className="h-full m-0 p-0">
                      <CodeMirror
                        value={state.htmlCode}
                        height="100%"
                        extensions={[html()]}
                        onChange={handleCodeChange}
                        theme="dark"
                      />
                    </TabsContent>
                    <TabsContent value="css" className="h-full m-0 p-0">
                      <CodeMirror
                        value={state.cssCode}
                        height="100%"
                        extensions={[css()]}
                        onChange={handleCodeChange}
                        theme="dark"
                      />
                    </TabsContent>
                    <TabsContent value="js" className="h-full m-0 p-0">
                      <CodeMirror
                        value={state.jsCode}
                        height="100%"
                        extensions={[javascript()]}
                        onChange={handleCodeChange}
                        theme="dark"
                      />
                    </TabsContent>
                  </div>
                </Tabs>
                
                <div className="bg-gray-100 border-t p-2 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReset}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
              
              {/* Preview Panel */}
              <div className="flex flex-col h-[500px] border rounded-md overflow-hidden">
                <div className="bg-gray-100 border-b px-4 py-2 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="font-medium text-sm">Live Preview</span>
                </div>
                <div className="flex-grow bg-white">
                  <iframe
                    title="Code Preview"
                    className="w-full h-full border-0"
                    srcDoc={combinedCode}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-2">Tips for Web Development:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                <li>HTML is for structure, CSS for styling, and JavaScript for interactivity</li>
                <li>Try changing colors, text content, or adding new elements</li>
                <li>Use the "Reset" button if you want to start over</li>
                <li>All your code is automatically saved in your browser</li>
                <li>Experiment and have fun! This is a safe environment to learn</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={onBack} 
              variant="outline" 
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Previous Stage</span>
            </Button>
            <Button 
              onClick={handleContinue} 
              size="lg"
            >
              <span>Continue to Next Stage</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}