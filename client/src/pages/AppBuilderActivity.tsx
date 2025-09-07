import React, { useState, useRef, useEffect } from 'react';

interface Block {
  id: string;
  type: string;
  category: 'ui' | 'logic' | 'ai';
  content: string;
  config?: any;
}

const AppBuilderActivity: React.FC = () => {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [droppedBlocks, setDroppedBlocks] = useState<Block[]>([]);
  const [currentConfigBlock, setCurrentConfigBlock] = useState<Block | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [blocksAdded, setBlocksAdded] = useState(0);
  const [achievementsUnlocked, setAchievementsUnlocked] = useState<string[]>([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState({ title: '', description: '' });

  const dropZoneRef = useRef<HTMLDivElement>(null);

  const achievements = [
    { id: 'first_block', title: 'First Block Master', description: 'Added your first block!' },
    { id: 'ui_expert', title: 'UI Designer', description: 'Added 3 UI blocks!' },
    { id: 'logic_guru', title: 'Logic Wizard', description: 'Added a logic block!' },
    { id: 'ai_pioneer', title: 'AI Pioneer', description: 'Added an AI block!' },
    { id: 'app_builder', title: 'App Builder', description: 'Built an app with 5+ blocks!' }
  ];

  const toolboxBlocks = [
    // UI Elements
    { type: 'button', category: 'ui' as const, icon: '🔘', label: 'Button' },
    { type: 'textbox', category: 'ui' as const, icon: '📝', label: 'Text Box' },
    { type: 'image', category: 'ui' as const, icon: '🖼️', label: 'Image' },
    { type: 'heading', category: 'ui' as const, icon: '📰', label: 'Heading' },
    
    // Logic & Actions
    { type: 'onclick', category: 'logic' as const, icon: '👆', label: 'Click Trigger' },
    { type: 'condition', category: 'logic' as const, icon: '🔀', label: 'If/Then' },
    { type: 'timer', category: 'logic' as const, icon: '⏱️', label: 'Timer' },
    
    // AI Powers
    { type: 'chatbot', category: 'ai' as const, icon: '🤖', label: 'AI Chat' },
    { type: 'recommendation', category: 'ai' as const, icon: '💡', label: 'Smart Tips' },
    { type: 'generator', category: 'ai' as const, icon: '✨', label: 'Content Magic' }
  ];

  const getDefaultBlockContent = (type: string) => {
    const defaults: Record<string, string> = {
      button: '🔘 Click Me!',
      textbox: '📝 Enter text here...',
      image: '🖼️ [Your Image]',
      heading: '📰 Your Amazing Title',
      onclick: '👆 Click Action Ready',
      condition: '🔀 If condition then...',
      timer: '⏱️ Timer: 5 seconds',
      chatbot: '🤖 "Hi! How can I help you today?"',
      recommendation: '💡 Smart suggestion appears here',
      generator: '✨ AI-generated content will appear here'
    };
    return defaults[type] || '🔘 New Block';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      ui: 'border-l-red-500 bg-red-50',
      logic: 'border-l-teal-500 bg-teal-50',
      ai: 'border-l-purple-500 bg-purple-50'
    };
    return colors[category as keyof typeof colors] || colors.ui;
  };

  const getBlockColor = (category: string) => {
    const colors = {
      ui: 'from-red-500 to-red-600',
      logic: 'from-teal-500 to-teal-600',
      ai: 'from-purple-500 to-purple-600'
    };
    return colors[category as keyof typeof colors] || colors.ui;
  };

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    setDraggedBlock(blockType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedBlock) {
      const toolboxBlock = toolboxBlocks.find(b => b.type === draggedBlock);
      if (toolboxBlock) {
        const newBlock: Block = {
          id: `${draggedBlock}-${Date.now()}`,
          type: draggedBlock,
          category: toolboxBlock.category,
          content: getDefaultBlockContent(draggedBlock)
        };

        setDroppedBlocks(prev => [...prev, newBlock]);
        setBlocksAdded(prev => prev + 1);
        showConfetti();
        checkAchievements(toolboxBlock.category);
      }
      setDraggedBlock(null);
    }
  };

  const openConfigModal = (block: Block) => {
    setCurrentConfigBlock(block);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentConfigBlock(null);
  };

  const saveConfiguration = (config: any) => {
    if (currentConfigBlock) {
      setDroppedBlocks(prev =>
        prev.map(block =>
          block.id === currentConfigBlock.id
            ? { ...block, content: config.content || block.content, config }
            : block
        )
      );
      
      displayAchievement('Configuration Master', 'You configured a block like a pro!');
      closeModal();
    }
  };

  const checkAchievements = (category: string) => {
    const uiBlocks = droppedBlocks.filter(b => b.category === 'ui').length;
    const logicBlocks = droppedBlocks.filter(b => b.category === 'logic').length;
    const aiBlocks = droppedBlocks.filter(b => b.category === 'ai').length;

    if (blocksAdded === 1 && !achievementsUnlocked.includes('first_block')) {
      unlockAchievement('first_block');
    }

    if (uiBlocks >= 3 && !achievementsUnlocked.includes('ui_expert')) {
      unlockAchievement('ui_expert');
    }

    if (logicBlocks >= 1 && !achievementsUnlocked.includes('logic_guru')) {
      unlockAchievement('logic_guru');
    }

    if (aiBlocks >= 1 && !achievementsUnlocked.includes('ai_pioneer')) {
      unlockAchievement('ai_pioneer');
    }

    if (blocksAdded >= 5 && !achievementsUnlocked.includes('app_builder')) {
      unlockAchievement('app_builder');
    }
  };

  const unlockAchievement = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && !achievementsUnlocked.includes(achievementId)) {
      setAchievementsUnlocked(prev => [...prev, achievementId]);
      displayAchievement(achievement.title, achievement.description);
    }
  };

  const displayAchievement = (title: string, description: string) => {
    setAchievementData({ title, description });
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 3000);
  };

  const showConfetti = () => {
    // Create confetti elements
    const colors = ['#ef4444', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}vw;
          top: -10px;
          pointer-events: none;
          z-index: 1000;
          border-radius: 50%;
        `;
        
        document.body.appendChild(confetti);
        
        confetti.animate([
          { transform: 'translateY(-10px) rotate(0deg)', opacity: 1 },
          { transform: 'translateY(100vh) rotate(360deg)', opacity: 0 }
        ], {
          duration: 2000 + Math.random() * 1000,
          easing: 'ease-out'
        }).onfinish = () => {
          confetti.remove();
        };
      }, i * 50);
    }
  };

  useEffect(() => {
    // Welcome achievement
    setTimeout(() => {
      displayAchievement('Welcome Builder', 'Ready to create your first digital LEGO app?');
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="flex gap-5 h-full max-w-7xl mx-auto">
        {/* Instructions Panel */}
        <div className="w-64 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl">
          <h2 className="text-lg font-bold text-gray-700 mb-4">🎯 Mission</h2>
          <p className="text-sm text-gray-600 mb-4">Build your first app using digital LEGO blocks!</p>
          
          <div className="bg-gray-200 rounded-lg h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-lg transition-all duration-500"
              style={{ width: `${Math.min((blocksAdded / 5) * 100, 100)}%` }}
            />
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Steps:</strong></p>
            <p>1. Drag blocks from the toolbox</p>
            <p>2. Drop them in the canvas</p>
            <p>3. Click ⚙️ to configure</p>
            <p>4. Watch your app come to life!</p>
          </div>

          {achievementsUnlocked.length > 0 && (
            <div className="mt-4">
              <p className="font-bold text-green-600 mb-2">🏆 Achievements:</p>
              <div className="space-y-1">
                {achievementsUnlocked.map(id => {
                  const achievement = achievements.find(a => a.id === id);
                  return (
                    <div key={id} className="text-xs text-green-600">
                      ✅ {achievement?.title}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Toolbox */}
        <div className="w-52 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl">
          <h3 className="text-center font-bold text-gray-700 mb-4">🧰 Block Toolbox</h3>
          
          <div className="space-y-4">
            {/* UI Elements */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">UI Elements</div>
              {toolboxBlocks.filter(b => b.category === 'ui').map(block => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.type)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gradient-to-r ${getBlockColor(block.category)} text-white p-3 mb-2 rounded-xl cursor-grab text-xs font-bold text-center transition-all hover:scale-105 hover:shadow-lg active:scale-95 active:cursor-grabbing`}
                >
                  {block.icon} {block.label}
                </div>
              ))}
            </div>

            {/* Logic & Actions */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Logic & Actions</div>
              {toolboxBlocks.filter(b => b.category === 'logic').map(block => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.type)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gradient-to-r ${getBlockColor(block.category)} text-white p-3 mb-2 rounded-xl cursor-grab text-xs font-bold text-center transition-all hover:scale-105 hover:shadow-lg active:scale-95 active:cursor-grabbing`}
                >
                  {block.icon} {block.label}
                </div>
              ))}
            </div>

            {/* AI Powers */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">AI Powers</div>
              {toolboxBlocks.filter(b => b.category === 'ai').map(block => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.type)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gradient-to-r ${getBlockColor(block.category)} text-white p-3 mb-2 rounded-xl cursor-grab text-xs font-bold text-center transition-all hover:scale-105 hover:shadow-lg active:scale-95 active:cursor-grabbing`}
                >
                  {block.icon} {block.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-700 mb-2">🎨 Your App Canvas</h1>
            <p className="text-gray-600">Drag blocks here to build your amazing app!</p>
          </div>

          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-3 border-dashed border-gray-300 rounded-2xl min-h-96 p-5 transition-all ${
              draggedBlock ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'bg-gray-50/50'
            }`}
          >
            {droppedBlocks.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                <h3 className="text-xl mb-2">Ready to Build? 🚀</h3>
                <p>Drag your first block from the toolbox to get started.<br />Watch the magic happen as you build!</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {droppedBlocks.map(block => (
                  <div
                    key={block.id}
                    className={`relative bg-white border-l-4 ${getCategoryColor(block.category)} rounded-xl p-4 shadow-lg min-w-32 transition-all hover:scale-105 hover:shadow-xl cursor-pointer`}
                    onClick={() => openConfigModal(block)}
                  >
                    <div className="text-sm text-gray-700 mb-2">{block.content}</div>
                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded inline-block">
                      {toolboxBlocks.find(b => b.type === block.type)?.label}
                    </div>
                    <button
                      className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full w-6 h-6 text-xs hover:bg-indigo-600 transition-all hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfigModal(block);
                      }}
                    >
                      ⚙️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showModal && currentConfigBlock && (
        <ConfigModal
          block={currentConfigBlock}
          onSave={saveConfiguration}
          onClose={closeModal}
        />
      )}

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="fixed top-5 right-5 bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-2xl shadow-xl z-50 transform transition-transform duration-500">
          <h4 className="font-bold">🎉 {achievementData.title}!</h4>
          <p className="text-sm opacity-90">{achievementData.description}</p>
        </div>
      )}
    </div>
  );
};

// Configuration Modal Component
interface ConfigModalProps {
  block: Block;
  onSave: (config: any) => void;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ block, onSave, onClose }) => {
  const [config, setConfig] = useState({
    content: block.content,
    buttonText: '',
    buttonColor: 'blue',
    clickAction: 'alert',
    customMessage: 'Hello from your button!',
    placeholderText: '',
    inputType: 'text',
    headingText: '',
    headingSize: 'h2',
    aiPersonality: 'friendly',
    welcomeMessage: '',
    recommendationType: 'tips',
    recommendationContext: ''
  });

  const handleSave = () => {
    let newContent = block.content;
    
    switch (block.type) {
      case 'button':
        newContent = `🔘 ${config.buttonText || 'Click Me!'}`;
        break;
      case 'textbox':
        newContent = `📝 ${config.placeholderText || 'Enter text here...'}`;
        break;
      case 'heading':
        newContent = `📰 ${config.headingText || 'Your Amazing Title'}`;
        break;
      case 'chatbot':
        newContent = `🤖 "${config.welcomeMessage || 'Hi! How can I help you today?'}"`;
        break;
      case 'recommendation':
        newContent = `💡 ${config.recommendationType} ${config.recommendationContext ? '- ' + config.recommendationContext : ''}`;
        break;
    }

    onSave({ ...config, content: newContent });
  };

  const renderConfigForm = () => {
    switch (block.type) {
      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Button Text:</label>
              <input
                type="text"
                value={config.buttonText}
                onChange={(e) => setConfig(prev => ({ ...prev, buttonText: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="Click Me!"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Button Color:</label>
              <select
                value={config.buttonColor}
                onChange={(e) => setConfig(prev => ({ ...prev, buttonColor: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="red">Red</option>
                <option value="purple">Purple</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Click Action:</label>
              <select
                value={config.clickAction}
                onChange={(e) => setConfig(prev => ({ ...prev, clickAction: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              >
                <option value="alert">Show Alert</option>
                <option value="confetti">Show Confetti</option>
                <option value="change_text">Change Text</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Custom Message:</label>
              <input
                type="text"
                value={config.customMessage}
                onChange={(e) => setConfig(prev => ({ ...prev, customMessage: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="Hello from your button!"
              />
            </div>
          </div>
        );

      case 'textbox':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Placeholder Text:</label>
              <input
                type="text"
                value={config.placeholderText}
                onChange={(e) => setConfig(prev => ({ ...prev, placeholderText: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="Enter text here..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Input Type:</label>
              <select
                value={config.inputType}
                onChange={(e) => setConfig(prev => ({ ...prev, inputType: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="password">Password</option>
                <option value="number">Number</option>
              </select>
            </div>
          </div>
        );

      case 'heading':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Heading Text:</label>
              <input
                type="text"
                value={config.headingText}
                onChange={(e) => setConfig(prev => ({ ...prev, headingText: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="Your Amazing Title"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Heading Size:</label>
              <select
                value={config.headingSize}
                onChange={(e) => setConfig(prev => ({ ...prev, headingSize: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              >
                <option value="h1">Large (H1)</option>
                <option value="h2">Medium (H2)</option>
                <option value="h3">Small (H3)</option>
              </select>
            </div>
          </div>
        );

      case 'chatbot':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">AI Personality:</label>
              <select
                value={config.aiPersonality}
                onChange={(e) => setConfig(prev => ({ ...prev, aiPersonality: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              >
                <option value="friendly">Friendly Helper</option>
                <option value="professional">Professional Assistant</option>
                <option value="funny">Funny Companion</option>
                <option value="wise">Wise Mentor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Welcome Message:</label>
              <textarea
                value={config.welcomeMessage}
                onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="Hi! How can I help you today?"
                rows={3}
              />
            </div>
          </div>
        );

      case 'recommendation':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Recommendation Type:</label>
              <select
                value={config.recommendationType}
                onChange={(e) => setConfig(prev => ({ ...prev, recommendationType: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              >
                <option value="Helpful Tips">Helpful Tips</option>
                <option value="Product Suggestions">Product Suggestions</option>
                <option value="Learning Resources">Learning Resources</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Context:</label>
              <input
                type="text"
                value={config.recommendationContext}
                onChange={(e) => setConfig(prev => ({ ...prev, recommendationContext: e.target.value }))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="Based on user preferences..."
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Block Content:</label>
            <textarea
              value={config.content}
              onChange={(e) => setConfig(prev => ({ ...prev, content: e.target.value }))}
              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              rows={3}
              placeholder="Customize your block content..."
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-gray-700 mb-6 text-center">
          Configure {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block
        </h3>
        
        {renderConfigForm()}
        
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={handleSave}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold transition-all hover:scale-105"
          >
            💾 Save
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-bold transition-all hover:scale-105"
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppBuilderActivity;