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
    { id: 'first_block', title: '🎯 First Block Master', description: 'Added your first magical block!' },
    { id: 'ui_expert', title: '🎨 UI Design Wizard', description: 'Created 3 beautiful UI blocks!' },
    { id: 'logic_guru', title: '⚡ Logic Mastermind', description: 'Added powerful logic to your app!' },
    { id: 'ai_pioneer', title: '🤖 AI Superhero', description: 'Unleashed AI powers in your app!' },
    { id: 'app_builder', title: '🏆 Legendary App Builder', description: 'Built an amazing app with 5+ blocks!' }
  ];

  const toolboxBlocks = [
    // UI Elements
    { type: 'button', category: 'ui' as const, icon: '🔘', label: 'Magic Button' },
    { type: 'textbox', category: 'ui' as const, icon: '📝', label: 'Text Portal' },
    { type: 'image', category: 'ui' as const, icon: '🖼️', label: 'Image Frame' },
    { type: 'heading', category: 'ui' as const, icon: '📰', label: 'Title Hero' },

    // Logic & Actions
    { type: 'onclick', category: 'logic' as const, icon: '👆', label: 'Click Trigger' },
    { type: 'condition', category: 'logic' as const, icon: '🔀', label: 'Smart Decision' },
    { type: 'timer', category: 'logic' as const, icon: '⏱️', label: 'Time Master' },

    // AI Powers
    { type: 'chatbot', category: 'ai' as const, icon: '🤖', label: 'AI Companion' },
    { type: 'recommendation', category: 'ai' as const, icon: '💡', label: 'Genius Tips' },
    { type: 'generator', category: 'ai' as const, icon: '✨', label: 'Content Wizard' }
  ];

  const getDefaultBlockContent = (type: string) => {
    const defaults: Record<string, any> = {
      button: { text: 'Click Me!', color: 'blue', action: 'alert', message: 'Hello from your button!' },
      textbox: { placeholder: 'Enter text here...', type: 'text' },
      image: { src: 'https://via.placeholder.com/150x100/667eea/white?text=Your+Image', alt: 'Your Image' },
      heading: { text: 'Your Amazing Title', size: 'h2' },
      onclick: { trigger: 'Click Action Ready', action: 'Show alert when clicked' },
      condition: { condition: 'If user clicks then...', action: 'Show success message' },
      timer: { duration: 5, action: 'Show notification after 5 seconds' },
      chatbot: { personality: 'friendly', message: 'Hi! How can I help you today?' },
      recommendation: { type: 'tips', context: 'Smart suggestion appears here' },
      generator: { type: 'content', prompt: 'AI-generated content will appear here' }
    };
    return defaults[type] || { text: 'New Block' };
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
      ui: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      logic: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
      ai: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    };
    return colors[category as keyof typeof colors] || colors.ui;
  };

  // Render actual UI components based on block type
  const renderBlockUI = (block: Block) => {
    const config = block.config || getDefaultBlockContent(block.type);

    const handleBlockClick = (action?: string, message?: string) => {
      if (action === 'alert' || !action) {
        alert(message || 'Button clicked!');
      } else if (action === 'confetti') {
        showConfetti();
        alert(message || 'Confetti time! 🎉');
      }
    };

    switch (block.type) {
      case 'button':
        const buttonColors = {
          blue: 'bg-blue-500 hover:bg-blue-600 text-white',
          green: 'bg-green-500 hover:bg-green-600 text-white',
          red: 'bg-red-500 hover:bg-red-600 text-white',
          purple: 'bg-purple-500 hover:bg-purple-600 text-white'
        };
        return (
          <button
            className={`px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg ${
              buttonColors[config.color as keyof typeof buttonColors] || buttonColors.blue
            }`}
            onClick={() => handleBlockClick(config.action, config.message)}
          >
            {config.text || 'Click Me!'}
          </button>
        );

      case 'textbox':
        return (
          <input
            type={config.type || 'text'}
            placeholder={config.placeholder || 'Enter text here...'}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none w-full max-w-xs"
          />
        );

      case 'image':
        return (
          <div className="relative group">
            <img
              src={config.src || 'https://via.placeholder.com/150x100/667eea/white?text=Your+Image'}
              alt={config.alt || 'Your Image'}
              className="rounded-lg shadow-lg max-w-xs transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-bold">🖼️ Image Block</span>
            </div>
          </div>
        );

      case 'heading':
        const HeadingTag = config.size || 'h2';
        const headingSizes = {
          h1: 'text-3xl',
          h2: 'text-2xl',
          h3: 'text-xl'
        };
        return React.createElement(
          HeadingTag,
          {
            className: `font-bold text-gray-800 ${headingSizes[HeadingTag as keyof typeof headingSizes] || headingSizes.h2}`
          },
          config.text || 'Your Amazing Title'
        );

      case 'onclick':
        return (
          <div 
            className="bg-teal-100 border-2 border-teal-300 rounded-lg p-4 cursor-pointer hover:bg-teal-200 transition-colors"
            onClick={() => alert(config.action || 'Click trigger activated!')}
          >
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👆</span>
              <div>
                <div className="font-bold text-teal-800">{config.trigger || 'Click Trigger'}</div>
                <div className="text-sm text-teal-600">{config.action || 'Click to test!'}</div>
              </div>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔀</span>
              <div>
                <div className="font-bold text-teal-800">If/Then Logic</div>
                <div className="text-sm text-teal-600">{config.condition || 'If condition then...'}</div>
                <div className="text-xs text-teal-500 mt-1">{config.action || 'Execute action'}</div>
              </div>
            </div>
          </div>
        );

      case 'timer':
        return (
          <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="font-bold text-teal-800">Timer Block</div>
                <div className="text-sm text-teal-600">Duration: {config.duration || 5} seconds</div>
                <div className="text-xs text-teal-500 mt-1">{config.action || 'Timer action'}</div>
              </div>
            </div>
          </div>
        );

      case 'chatbot':
        return (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 max-w-xs">
            <div className="flex items-start space-x-3">
              <div className="bg-purple-500 rounded-full p-2">
                <span className="text-white text-lg">🤖</span>
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-sm text-gray-800">
                    {config.message || 'Hi! How can I help you today?'}
                  </div>
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  AI Personality: {config.personality || 'Friendly'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'recommendation':
        return (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💡</span>
              <div>
                <div className="font-bold text-purple-800">Smart Recommendation</div>
                <div className="text-sm text-purple-600">Type: {config.type || 'Tips'}</div>
                <div className="text-xs text-purple-500 mt-1">{config.context || 'Smart suggestion appears here'}</div>
              </div>
            </div>
          </div>
        );

      case 'generator':
        return (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✨</span>
              <div>
                <div className="font-bold text-purple-800">Content Generator</div>
                <div className="text-sm text-purple-600">Type: {config.type || 'Content'}</div>
                <div className="text-xs text-purple-500 mt-1">{config.prompt || 'AI-generated content will appear here'}</div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4">
            <div className="text-gray-700">{block.content}</div>
          </div>
        );
    }
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
          content: toolboxBlock.label,
          config: getDefaultBlockContent(draggedBlock)
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
            ? { ...block, config }
            : block
        )
      );

      displayAchievement('⚙️ Configuration Master', 'You configured a block like a pro!');
      closeModal();
    }
  };

  const checkAchievements = (category: string) => {
    setTimeout(() => {
      const uiBlocks = droppedBlocks.filter(b => b.category === 'ui').length + (category === 'ui' ? 1 : 0);
      const logicBlocks = droppedBlocks.filter(b => b.category === 'logic').length + (category === 'logic' ? 1 : 0);
      const aiBlocks = droppedBlocks.filter(b => b.category === 'ai').length + (category === 'ai' ? 1 : 0);

      if (blocksAdded === 0 && !achievementsUnlocked.includes('first_block')) {
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

      if (blocksAdded >= 4 && !achievementsUnlocked.includes('app_builder')) {
        unlockAchievement('app_builder');
      }
    }, 100);
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
    const colors = ['#ef4444', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];
    const emojis = ['🎉', '✨', '🌟', '💫', '🎊'];

    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        const isEmoji = Math.random() > 0.6;

        if (isEmoji) {
          confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
          confetti.style.fontSize = '16px';
        } else {
          confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          confetti.style.width = '8px';
          confetti.style.height = '8px';
          confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
        }

        confetti.style.cssText += `
          position: fixed;
          left: ${Math.random() * 100}vw;
          top: -10px;
          pointer-events: none;
          z-index: 1000;
        `;

        document.body.appendChild(confetti);

        const rotation = Math.random() * 720 - 360;
        confetti.animate([
          { transform: 'translateY(-10px) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translateY(100vh) rotate(${rotation}deg) scale(0.3)`, opacity: 0 }
        ], {
          duration: 3000 + Math.random() * 2000,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
          confetti.remove();
        };
      }, i * 30);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      displayAchievement('🎮 Game Mode Activated!', 'Welcome to the ultimate app building adventure!');
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="flex gap-5 h-full max-w-7xl mx-auto">
        {/* Instructions Panel */}
        <div className="w-72 bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-conic from-transparent via-indigo-200/20 to-transparent animate-spin" style={{animationDuration: '8s'}}></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text mb-4 text-center">
              🎯 Epic Mission
            </h2>
            <p className="text-sm text-gray-600 mb-4">Build your first app using digital LEGO blocks!</p>

            <div className="bg-gray-200 rounded-lg h-3 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-lg transition-all duration-700 shadow-lg"
                style={{ width: `${Math.min((blocksAdded / 5) * 100, 100)}%` }}
              />
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Power-Up Steps:</strong></p>
              <p>1. 🎯 Drag blocks from the magic toolbox</p>
              <p>2. 🚀 Drop them in the glowing canvas</p>
              <p>3. ⚙️ Click the spinning gear to configure</p>
              <p>4. ✨ Watch your app come alive with magic!</p>
            </div>

            {achievementsUnlocked.length > 0 && (
              <div className="mt-4">
                <p className="font-bold text-green-600 mb-2">🏆 Achievements Unlocked:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {achievementsUnlocked.map(id => {
                    const achievement = achievements.find(a => a.id === id);
                    return (
                      <div key={id} className="text-xs text-green-600 bg-green-50 rounded px-2 py-1">
                        ✅ {achievement?.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toolbox */}
        <div className="w-56 bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-white/20 relative">
          <div className="absolute top-3 right-4 text-2xl animate-bounce">🧰</div>
          <h3 className="text-center font-bold text-gray-700 mb-4">✨ Magic Block Toolbox</h3>

          <div className="space-y-4">
            {/* UI Elements */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">🎨 UI Elements</div>
              {toolboxBlocks.filter(b => b.category === 'ui').map(block => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.type)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gradient-to-r ${getBlockColor(block.category)} text-white p-3 mb-2 rounded-xl cursor-grab text-xs font-bold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 active:scale-95 active:cursor-grabbing transform perspective-1000 hover:rotate-1`}
                >
                  {block.icon} {block.label}
                </div>
              ))}
            </div>

            {/* Logic & Actions */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">⚡ Logic & Actions</div>
              {toolboxBlocks.filter(b => b.category === 'logic').map(block => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.type)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gradient-to-r ${getBlockColor(block.category)} text-white p-3 mb-2 rounded-xl cursor-grab text-xs font-bold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25 active:scale-95 active:cursor-grabbing transform perspective-1000 hover:rotate-1`}
                >
                  {block.icon} {block.label}
                </div>
              ))}
            </div>

            {/* AI Powers */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">🤖 AI Superpowers</div>
              {toolboxBlocks.filter(b => b.category === 'ai').map(block => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.type)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gradient-to-r ${getBlockColor(block.category)} text-white p-3 mb-2 rounded-xl cursor-grab text-xs font-bold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95 active:cursor-grabbing transform perspective-1000 hover:rotate-1`}
                >
                  {block.icon} {block.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-indigo-100/30 via-transparent to-pink-100/30 animate-pulse" style={{animationDuration: '6s'}}></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text mb-2 animate-pulse">
                🎨 Your Magical App Canvas
              </h1>
              <p className="text-gray-600">✨ Drag blocks here to build your legendary app! ✨</p>
            </div>

            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-4 border-dashed rounded-3xl min-h-96 p-6 transition-all duration-500 ${
                draggedBlock 
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-inner shadow-indigo-200' 
                  : 'border-gray-300 bg-gray-50/30'
              }`}
            >
              {droppedBlocks.length === 0 ? (
                <div className="text-center text-gray-400 py-24 animate-pulse">
                  <h3 className="text-2xl mb-4 text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text">
                    🚀 Ready to Create Magic?
                  </h3>
                  <p className="text-lg">Drag your first block from the enchanted toolbox!<br />✨ Watch epic animations as you build your masterpiece! ✨</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {droppedBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="relative group animate-fadeIn"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <div className="transform transition-all duration-300 hover:scale-105 hover:rotate-1">
                        {renderBlockUI(block)}
                      </div>

                      {/* Configuration Button */}
                      <button
                        className="absolute -top-3 -right-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full w-8 h-8 text-sm hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-110 shadow-lg animate-spin"
                        style={{animationDuration: '3s'}}
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfigModal(block);
                        }}
                      >
                        ⚙️
                      </button>

                      {/* Block Type Label */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-gray-600 font-medium shadow-sm">
                        {toolboxBlocks.find(b => b.type === block.type)?.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        <div className="fixed top-8 right-8 bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 text-white p-5 rounded-3xl shadow-2xl z-50 transform transition-all duration-700 animate-bounce border-2 border-white/30">
          <h4 className="font-bold text-lg drop-shadow-sm">{achievementData.title}</h4>
          <p className="text-sm opacity-90 drop-shadow-sm">{achievementData.description}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
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
    text: block.config?.text || '',
    color: block.config?.color || 'blue',
    action: block.config?.action || 'alert',
    message: block.config?.message || 'Hello from your button!',
    placeholder: block.config?.placeholder || '',
    type: block.config?.type || 'text',
    size: block.config?.size || 'h2',
    src: block.config?.src || 'https://via.placeholder.com/150x100/667eea/white?text=Your+Image',
    alt: block.config?.alt || 'Your Image',
    personality: block.config?.personality || 'friendly',
    duration: block.config?.duration || 5,
    condition: block.config?.condition || '',
    trigger: block.config?.trigger || '',
    recommendationType: block.config?.recommendationType || 'tips',
    context: block.config?.context || '',
    prompt: block.config?.prompt || ''
  });

  const handleSave = () => {
    onSave(config);
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
                value={config.text}
                onChange={(e) => setConfig(prev => ({ ...prev, text: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Click Me!"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Button Color:</label>
              <select
                value={config.color}
                onChange={(e) => setConfig(prev => ({ ...prev, color: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                value={config.action}
                onChange={(e) => setConfig(prev => ({ ...prev, action: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                value={config.message}
                onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                value={config.placeholder}
                onChange={(e) => setConfig(prev => ({ ...prev, placeholder: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Enter text here..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Input Type:</label>
              <select
                value={config.type}
                onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="password">Password</option>
                <option value="number">Number</option>
              </select>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Image URL:</label>
              <input
                type="text"
                value={config.src}
                onChange={(e) => setConfig(prev => ({ ...prev, src: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Alt Text:</label>
              <input
                type="text"
                value={config.alt}
                onChange={(e) => setConfig(prev => ({ ...prev, alt: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Your Image"
              />
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
                value={config.text}
                onChange={(e) => setConfig(prev => ({ ...prev, text: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Your Amazing Title"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Heading Size:</label>
              <select
                value={config.size}
                onChange={(e) => setConfig(prev => ({ ...prev, size: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="h1">Large (H1)</option>
                <option value="h2">Medium (H2)</option>
                <option value="h3">Small (H3)</option>
              </select>
            </div>
          </div>
        );

      case 'onclick':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Trigger Text:</label>
              <input
                type="text"
                value={config.trigger}
                onChange={(e) => setConfig(prev => ({ ...prev, trigger: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Click Action Ready"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Action Description:</label>
              <input
                type="text"
                value={config.action}
                onChange={(e) => setConfig(prev => ({ ...prev, action: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Show alert when clicked"
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Condition:</label>
              <input
                type="text"
                value={config.condition}
                onChange={(e) => setConfig(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="If user clicks then..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Action:</label>
              <input
                type="text"
                value={config.action}
                onChange={(e) => setConfig(prev => ({ ...prev, action: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Show success message"
              />
            </div>
          </div>
        );

      case 'timer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Duration (seconds):</label>
              <input
                type="number"
                value={config.duration}
                onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                min="1"
                max="60"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Timer Action:</label>
              <input
                type="text"
                value={config.action}
                onChange={(e) => setConfig(prev => ({ ...prev, action: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Show notification after timer"
              />
            </div>
          </div>
        );

      case 'chatbot':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">AI Personality:</label>
              <select
                value={config.personality}
                onChange={(e) => setConfig(prev => ({ ...prev, personality: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                value={config.message}
                onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="tips">Helpful Tips</option>
                <option value="products">Product Suggestions</option>
                <option value="learning">Learning Resources</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Context:</label>
              <input
                type="text"
                value={config.context}
                onChange={(e) => setConfig(prev => ({ ...prev, context: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Based on user preferences..."
              />
            </div>
          </div>
        );

      case 'generator':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Content Type:</label>
              <select
                value={config.type}
                onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="content">General Content</option>
                <option value="story">Story</option>
                <option value="poem">Poem</option>
                <option value="code">Code</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Prompt:</label>
              <textarea
                value={config.prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="AI-generated content will appear here"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Block Content:</label>
            <textarea
              value={config.text}
              onChange={(e) => setConfig(prev => ({ ...prev, text: e.target.value }))}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              rows={3}
              placeholder="Customize your block content..."
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border-2 border-white/20 transform animate-fadeIn">
        <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text mb-6 text-center">
          ⚙️ Configure {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block
        </h3>

        {renderConfigForm()}

        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
          >
            💾 Save Magic
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppBuilderActivity;