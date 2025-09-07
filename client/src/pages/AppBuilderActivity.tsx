import React, { useState, useRef } from 'react';

interface Zone {
  id: string;
  name: string;
  filled: boolean;
}

interface Block {
  id: string;
  type: string;
  name: string;
  emoji: string;
  color: string;
}

const AppBuilderActivity: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([
    { id: 'header', name: 'Header Zone', filled: false },
    { id: 'video', name: 'Video Player Zone', filled: false },
    { id: 'sidebar', name: 'Sidebar Zone', filled: false },
    { id: 'comments', name: 'Comments Zone', filled: false },
    { id: 'footer', name: 'Footer Zone', filled: false }
  ]);

  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shakingZone, setShakingZone] = useState<string | null>(null);

  const blocks: Block[] = [
    { id: 'header-block', type: 'header', name: 'Header', emoji: '🎬', color: 'bg-red-500' },
    { id: 'video-block', type: 'video', name: 'Video Player', emoji: '▶️', color: 'bg-blue-500' },
    { id: 'sidebar-block', type: 'sidebar', name: 'Sidebar', emoji: '📋', color: 'bg-purple-500' },
    { id: 'comments-block', type: 'comments', name: 'Comments', emoji: '💬', color: 'bg-green-500' },
    { id: 'footer-block', type: 'footer', name: 'Footer', emoji: '🔗', color: 'bg-gray-500' }
  ];

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    setDraggedBlock(blockType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    
    if (!draggedBlock) return;

    const isCorrectZone = draggedBlock === zoneId;
    
    if (isCorrectZone) {
      // Correct placement - highlight green and mark as filled
      setZones(prevZones => 
        prevZones.map(zone => 
          zone.id === zoneId ? { ...zone, filled: true } : zone
        )
      );
      
      // Check if all zones are filled
      const updatedZones = zones.map(zone => 
        zone.id === zoneId ? { ...zone, filled: true } : zone
      );
      
      if (updatedZones.every(zone => zone.filled)) {
        setTimeout(() => {
          setShowSuccess(true);
          showConfetti();
        }, 500);
      }
    } else {
      // Wrong placement - shake animation
      setShakingZone(zoneId);
      setTimeout(() => setShakingZone(null), 600);
    }
    
    setDraggedBlock(null);
  };

  const handleReset = () => {
    setZones(zones.map(zone => ({ ...zone, filled: false })));
    setShowSuccess(false);
  };

  const showConfetti = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
    
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 8px;
          height: 8px;
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
          { transform: 'translateY(100vh) rotate(720deg)', opacity: 0 }
        ], {
          duration: 3000 + Math.random() * 1000,
          easing: 'ease-out'
        }).onfinish = () => {
          confetti.remove();
        };
      }, i * 30);
    }
  };

  const getZoneContent = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    const block = blocks.find(b => b.type === zoneId);
    
    if (zone?.filled && block) {
      return (
        <div className="h-full flex items-center justify-center bg-green-100 border-2 border-green-500 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">{block.emoji}</div>
            <div className="font-bold text-green-800">{block.name} ✓</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`h-full flex items-center justify-center border-3 border-dashed border-gray-400 rounded-lg bg-gray-50 ${
        shakingZone === zoneId ? 'animate-shake' : ''
      }`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📦</div>
          <div className="font-medium">Drop {zone?.name.replace(' Zone', '')} Here</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 Build a YouTube Page!</h1>
          <p className="text-white text-lg">Drag the blocks to the correct zones to build a webpage layout</p>
        </div>

        <div className="flex gap-6">
          {/* Draggable Blocks Palette */}
          <div className="w-64 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">🧱 Building Blocks</h2>
            <div className="space-y-4">
              {blocks.map(block => {
                const zone = zones.find(z => z.id === block.type);
                const isUsed = zone?.filled || false;
                
                return (
                  <div
                    key={block.id}
                    draggable={!isUsed}
                    onDragStart={(e) => handleDragStart(e, block.type)}
                    onDragEnd={handleDragEnd}
                    className={`${block.color} text-white p-4 rounded-xl cursor-move text-center font-bold transition-all hover:scale-105 hover:shadow-lg ${
                      isUsed ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                    }`}
                  >
                    <div className="text-2xl mb-1">{block.emoji}</div>
                    <div>{block.name}</div>
                    {isUsed && <div className="text-xs mt-1">✓ Placed</div>}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-bold transition-all"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* YouTube Page Layout */}
          <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
            <div className="h-full space-y-4">
              {/* Header Zone */}
              <div
                className="h-16"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'header')}
              >
                {getZoneContent('header')}
              </div>

              <div className="flex gap-4 flex-1">
                {/* Main Content Area */}
                <div className="flex-1 space-y-4">
                  {/* Video Player Zone */}
                  <div
                    className="h-64"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'video')}
                  >
                    {getZoneContent('video')}
                  </div>

                  {/* Comments Zone */}
                  <div
                    className="flex-1 min-h-32"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'comments')}
                  >
                    {getZoneContent('comments')}
                  </div>
                </div>

                {/* Sidebar Zone */}
                <div
                  className="w-72"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'sidebar')}
                >
                  {getZoneContent('sidebar')}
                </div>
              </div>

              {/* Footer Zone */}
              <div
                className="h-16"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'footer')}
              >
                {getZoneContent('footer')}
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl transform animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Amazing!</h2>
              <p className="text-lg text-gray-600 mb-6">
                You successfully built a webapp page layout! You now understand how websites are structured with different zones.
              </p>
              <div className="space-y-3 mb-6">
                <div className="text-sm text-gray-500 text-left">
                  ✅ Header: Logo and navigation<br/>
                  ✅ Video Player: Main content area<br/>
                  ✅ Sidebar: Related content<br/>
                  ✅ Comments: User interaction<br/>
                  ✅ Footer: Links and info
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition-all"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold transition-all"
                >
                  🎯 Great Job!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AppBuilderActivity;