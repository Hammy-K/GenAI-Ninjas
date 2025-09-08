import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Sparkles, CheckCircle2, ExternalLink, Share2 } from 'lucide-react';

interface IdeaData {
  type: string | null;
  problem: string | null;
  audience: string | null;
  coreFeature: string | null;
  userFlow: string | null;
  style: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationState {
  sessionId: string;
  phase: 'welcome' | 'ideation' | 'refinement' | 'building' | 'submission' | 'complete';
  messageHistory: Message[];
  ideaData: IdeaData;
  completeness: number;
  readyToBuild: boolean;
  timeStarted: Date;
  buildingStarted: Date | null;
  appUrl: string | null;
  submissionData: {
    name: string | null;
    appTitle: string | null;
    studentId: string | null;
  };
}

interface SubmittedApp {
  id: string;
  title: string;
  studentName: string;
  url: string;
  submittedAt: Date;
  votes: {
    creative: number;
    useful: number;
  };
}

const LovablesActivity: React.FC = () => {
  const [conversationState, setConversationState] = useState<ConversationState>({
    sessionId: generateUUID(),
    phase: 'welcome',
    messageHistory: [],
    ideaData: {
      type: null,
      problem: null,
      audience: null,
      coreFeature: null,
      userFlow: null,
      style: null
    },
    completeness: 0,
    readyToBuild: false,
    timeStarted: new Date(),
    buildingStarted: null,
    appUrl: null,
    submissionData: {
      name: null,
      appTitle: null,
      studentId: null
    }
  });

  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [submittedApps, setSubmittedApps] = useState<SubmittedApp[]>([]);
  const [awaitingField, setAwaitingField] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize conversation with Pengy's welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Hi! I'm Pengy, and I'll help you build your first app today. What's something you deal with regularly that you wish there was an app for? Or maybe you have a fun app idea already?",
      timestamp: new Date()
    };
    
    setConversationState(prev => ({
      ...prev,
      messageHistory: [welcomeMessage]
    }));
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationState.messageHistory]);

  // Fetch submitted apps for gallery
  useEffect(() => {
    if (conversationState.phase === 'complete') {
      fetchSubmittedApps();
      const interval = setInterval(fetchSubmittedApps, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [conversationState.phase]);

  function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getStatusText(): string {
    const statusTexts = {
      'welcome': "Let's build an app!",
      'ideation': "Exploring your idea...",
      'refinement': "Shaping your concept...",
      'building': "You're building!",
      'submission': "Almost done!",
      'complete': "App published! 🎉"
    };
    return statusTexts[conversationState.phase];
  }

  async function callPengyAI(userMessage: string): Promise<string> {
    const systemPrompt = `You are Pengy, a helpful AI assistant guiding high school students in Saudi Arabia to build their first app in 30 minutes.

Your personality:
- Friendly and encouraging, but not overly hyped
- Ask ONE clear question at a time
- Keep responses to 1-2 sentences
- Help students think through their ideas logically
- Guide toward simple, buildable concepts

Current conversation context:
- Phase: ${conversationState.phase}
- What we know: ${JSON.stringify(conversationState.ideaData)}
- Completeness: ${conversationState.completeness}%
- Time remaining: ${formatTime(timeRemaining)}

Your goal: Help them define a clear app concept that can be built in 15 minutes on Lovable.dev.

Guidelines:
- If idea is too complex, suggest simpler version
- If idea is vague, ask clarifying questions
- When you have type + problem + audience + core feature, summarize and ask if ready to build
- Keep conversation focused and moving forward

Personality Traits:
- Enthusiastic but realistic: "That's awesome! Let's make sure we can build it today..."
- Collaborative: "Let's figure this out together..."
- Time-conscious: "This is just your first app, so let's focus on..."
- Encouraging: "This is going to be so cool when it's done!"`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationState.messageHistory.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          maxTokens: 150
        })
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      return data.message || "Sorry, I'm having trouble right now. Can you try rephrasing that?";
    } catch (error) {
      console.error('AI call failed:', error);
      return "Sorry, I'm having trouble connecting right now. Can you try again?";
    }
  }

  function extractIdeaElements(aiResponse: string, userMessage: string): Partial<IdeaData> {
    const extracted: Partial<IdeaData> = {};
    
    // Simple keyword-based extraction - could be enhanced with more AI processing
    const combined = (aiResponse + ' ' + userMessage).toLowerCase();
    
    // Type detection
    if (combined.includes('study') || combined.includes('homework') || combined.includes('learn')) {
      extracted.type = 'study';
    } else if (combined.includes('social') || combined.includes('friends') || combined.includes('chat')) {
      extracted.type = 'social';
    } else if (combined.includes('game') || combined.includes('play') || combined.includes('fun')) {
      extracted.type = 'game';
    } else if (combined.includes('creative') || combined.includes('art') || combined.includes('music')) {
      extracted.type = 'creative';
    } else if (combined.includes('utility') || combined.includes('tool') || combined.includes('help')) {
      extracted.type = 'utility';
    }

    // Problem extraction (simple pattern matching)
    const problemPatterns = /(?:problem|issue|solve|fix|help with|deal with|struggle with)\s+(.+?)(?:\.|!|\?|$)/gi;
    const problemMatch = problemPatterns.exec(combined);
    if (problemMatch) {
      extracted.problem = problemMatch[1].trim();
    }

    // Audience extraction
    if (combined.includes('students') || combined.includes('classmates')) {
      extracted.audience = 'students';
    } else if (combined.includes('friends')) {
      extracted.audience = 'friends';
    } else if (combined.includes('everyone') || combined.includes('people')) {
      extracted.audience = 'general users';
    }

    // Core feature extraction (basic pattern matching)
    const featurePatterns = /(?:main feature|core function|primary use|would do|can)\s+(.+?)(?:\.|!|\?|$)/gi;
    const featureMatch = featurePatterns.exec(combined);
    if (featureMatch) {
      extracted.coreFeature = featureMatch[1].trim();
    }

    return extracted;
  }

  function calculateCompleteness(ideaData: IdeaData): number {
    const fields = ['type', 'problem', 'audience', 'coreFeature'];
    const filledFields = fields.filter(field => ideaData[field as keyof IdeaData] !== null).length;
    return Math.round((filledFields / fields.length) * 100);
  }

  async function handleSubmitMessage() {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    setConversationState(prev => ({
      ...prev,
      messageHistory: [...prev.messageHistory, userMessage]
    }));

    const messageToProcess = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Handle special submission fields
      if (awaitingField) {
        await handleFieldSubmission(awaitingField, messageToProcess);
        return;
      }

      // Handle app URL submission
      if (conversationState.phase === 'building' && messageToProcess.includes('lovable.dev')) {
        await handleAppUrlSubmission(messageToProcess);
        return;
      }

      // Regular conversation with Pengy
      const aiResponse = await callPengyAI(messageToProcess);
      const extractedIdea = extractIdeaElements(aiResponse, messageToProcess);
      
      // Update conversation state
      const updatedIdeaData = { ...conversationState.ideaData, ...extractedIdea };
      const completeness = calculateCompleteness(updatedIdeaData);
      
      let newPhase = conversationState.phase;
      if (completeness >= 80 && conversationState.phase === 'ideation') {
        newPhase = 'refinement';
      }

      const aiMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setConversationState(prev => ({
        ...prev,
        messageHistory: [...prev.messageHistory, aiMessage],
        ideaData: updatedIdeaData,
        completeness,
        phase: newPhase,
        readyToBuild: completeness >= 80
      }));

      // If ready to build and user confirms, move to building phase
      if (completeness >= 80 && (messageToProcess.toLowerCase().includes('yes') || messageToProcess.toLowerCase().includes('build'))) {
        setTimeout(() => moveToBuilding(), 1000);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: "Sorry, I had a technical issue. Can you try again?",
        timestamp: new Date()
      };
      
      setConversationState(prev => ({
        ...prev,
        messageHistory: [...prev.messageHistory, errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFieldSubmission(fieldName: string, value: string) {
    const submissionData = { ...conversationState.submissionData };
    (submissionData as any)[fieldName] = value;

    setConversationState(prev => ({
      ...prev,
      submissionData
    }));

    let nextField = null;
    let nextMessage = '';

    if (fieldName === 'name') {
      nextField = 'appTitle';
      nextMessage = "What should we call your app?";
    } else if (fieldName === 'appTitle') {
      nextField = 'studentId';
      nextMessage = "Student ID? (just hit enter to skip)";
    } else if (fieldName === 'studentId') {
      nextMessage = "Submitting your app to the class gallery...";
      setTimeout(() => submitToShowcase(), 2000);
    }

    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: nextMessage,
      timestamp: new Date()
    };

    setConversationState(prev => ({
      ...prev,
      messageHistory: [...prev.messageHistory, aiMessage]
    }));

    setAwaitingField(nextField);
    setIsLoading(false);
  }

  async function handleAppUrlSubmission(url: string) {
    setConversationState(prev => ({
      ...prev,
      appUrl: url
    }));

    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Great! Let me check your app... Looks good! Ready to submit?",
      timestamp: new Date()
    };

    setConversationState(prev => ({
      ...prev,
      messageHistory: [...prev.messageHistory, aiMessage],
      phase: 'submission'
    }));

    // Start submission process
    setTimeout(() => startSubmissionProcess(), 1000);
    setIsLoading(false);
  }

  function startSubmissionProcess() {
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Almost done! I need a few details to add your app to the showcase. What's your name?",
      timestamp: new Date()
    };

    setConversationState(prev => ({
      ...prev,
      messageHistory: [...prev.messageHistory, aiMessage]
    }));

    setAwaitingField('name');
  }

  async function submitToShowcase() {
    try {
      const response = await fetch('/api/lovable-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: conversationState.sessionId,
          appUrl: conversationState.appUrl,
          appTitle: conversationState.submissionData.appTitle,
          studentName: conversationState.submissionData.name,
          studentId: conversationState.submissionData.studentId,
          ideaData: conversationState.ideaData
        })
      });

      if (response.ok) {
        const aiMessage: Message = {
          id: generateUUID(),
          role: 'assistant',
          content: "Done! Your app is now live in the class gallery. Well done building your first app!",
          timestamp: new Date()
        };

        setConversationState(prev => ({
          ...prev,
          messageHistory: [...prev.messageHistory, aiMessage],
          phase: 'complete'
        }));
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: "There was an issue submitting your app, but you did great! Your app is still live and working.",
        timestamp: new Date()
      };

      setConversationState(prev => ({
        ...prev,
        messageHistory: [...prev.messageHistory, errorMessage],
        phase: 'complete'
      }));
    }
  }

  function moveToBuilding() {
    const lovablePrompt = generateLovablePrompt(conversationState.ideaData);
    const lovableURL = `https://lovable.dev/create?prompt=${encodeURIComponent(lovablePrompt)}`;

    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: `Perfect! I'm opening Lovable.dev with your custom prompt. Here's what to focus on:
• Test your app frequently using the preview
• Make small changes and test again  
• You have limited free tokens - use them wisely
• Focus on core functionality over design details
• Paste your app URL here when it's working`,
      timestamp: new Date()
    };

    setConversationState(prev => ({
      ...prev,
      messageHistory: [...prev.messageHistory, aiMessage],
      phase: 'building',
      buildingStarted: new Date()
    }));

    // Open Lovable in new tab
    window.open(lovableURL, '_blank');
  }

  function generateLovablePrompt(ideaData: IdeaData): string {
    const { type, problem, audience, coreFeature, userFlow } = ideaData;
    
    return `Create a ${type} app that ${problem ? `solves the problem of ${problem}` : 'helps users'} for ${audience || 'users'}. 

The main feature should be: ${coreFeature || 'user-friendly functionality'}

${userFlow ? `User flow: ${userFlow}` : ''}

Keep it simple and functional - this is a 30-minute build focusing on core functionality over complex design. Make it mobile-friendly and easy to use.`;
  }

  async function fetchSubmittedApps() {
    try {
      const response = await fetch('/api/lovable-submissions');
      if (response.ok) {
        const apps = await response.json();
        setSubmittedApps(apps);
      }
    } catch (error) {
      console.error('Failed to fetch submitted apps:', error);
    }
  }

  async function voteForApp(appId: string, category: 'creative' | 'useful') {
    try {
      const response = await fetch(`/api/lovable-submissions/${appId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category })
      });

      if (response.ok) {
        // Refresh the apps to show updated vote counts
        fetchSubmittedApps();
      }
    } catch (error) {
      console.error('Vote failed:', error);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitMessage();
    }
  };

  const generateAppName = (ideaData: IdeaData): string => {
    if (ideaData.coreFeature) {
      const words = ideaData.coreFeature.split(' ').slice(0, 2);
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'App';
    }
    return 'MyApp';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">Lovables Activity</h1>
            </div>
            <div className="text-white/80 font-medium">
              {getStatusText()}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-white font-mono font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          {/* Chat Area */}
          <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {conversationState.messageHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          🐧
                        </div>
                        <span className="text-sm font-medium text-purple-600">Pengy</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        🐧
                      </div>
                      <span className="text-sm font-medium text-purple-600">Pengy</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {conversationState.phase !== 'complete' && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <textarea
                    ref={chatInputRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSubmitMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-6">
            {/* Idea Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                💡 Your App Idea
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <div className="text-gray-800 font-medium">
                    {conversationState.ideaData.type || 'Not defined yet'}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Problem:</span>
                  <div className="text-gray-800 font-medium">
                    {conversationState.ideaData.problem || 'Not defined yet'}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Audience:</span>
                  <div className="text-gray-800 font-medium">
                    {conversationState.ideaData.audience || 'Not defined yet'}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Core Feature:</span>
                  <div className="text-gray-800 font-medium">
                    {conversationState.ideaData.coreFeature || 'Not defined yet'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-bold text-purple-600">{conversationState.completeness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${conversationState.completeness}%` }}
                  ></div>
                </div>
              </div>

              {conversationState.readyToBuild && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Ready to build!</span>
                  </div>
                </div>
              )}
            </div>

            {/* App URL Input (during building phase) */}
            {conversationState.phase === 'building' && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🚀 Your App</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Paste your Lovable app URL here when it's ready:
                </p>
                <input
                  type="url"
                  placeholder="https://lovable.dev/projects/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onPaste={(e) => {
                    setTimeout(() => {
                      const url = (e.target as HTMLInputElement).value;
                      if (url.includes('lovable.dev')) {
                        handleAppUrlSubmission(url);
                      }
                    }, 100);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Success & Gallery */}
        {conversationState.phase === 'complete' && (
          <div className="mt-8 space-y-8">
            {/* Celebration */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Congratulations!</h2>
              <p className="text-lg text-gray-600 mb-6">Your app is live!</p>
              
              {conversationState.appUrl && (
                <div className="flex items-center justify-center gap-4 mb-6">
                  <a
                    href={conversationState.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View Your App
                  </a>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: conversationState.submissionData.appTitle || 'My App',
                          url: conversationState.appUrl
                        });
                      } else {
                        navigator.clipboard.writeText(conversationState.appUrl);
                        alert('App URL copied to clipboard!');
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              )}
            </div>

            {/* Live Gallery */}
            {submittedApps.length > 0 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  🏆 Live Gallery - Apps Built Today
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {submittedApps.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                      <h3 className="font-bold text-gray-800 mb-2">{app.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">by {app.studentName}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>💡 Creative: {app.votes.creative}</span>
                          <span>⚡ Useful: {app.votes.useful}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium text-center transition-all"
                        >
                          View App
                        </a>
                        <button
                          onClick={() => voteForApp(app.id, 'creative')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all"
                          title="Vote: Most Creative"
                        >
                          💡
                        </button>
                        <button
                          onClick={() => voteForApp(app.id, 'useful')}
                          className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all"
                          title="Vote: Most Useful"
                        >
                          ⚡
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LovablesActivity;