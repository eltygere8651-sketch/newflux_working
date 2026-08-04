const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

const oldHeader = `<div className="flex-1 overflow-y-auto min-h-0 flex flex-col p-4 sm:p-6 pb-32 space-y-8 relative">`;
const newHeader = `<div className="flex-1 flex flex-col min-h-0 relative">`;

if (code.includes(oldHeader)) {
    code = code.replace(oldHeader, newHeader);
}

const oldPlayer = `        {/* Active Player Module */}
        {currentVideo && (
          <div 
            ref={playerContainerRef}
            className="w-full max-w-5xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl relative group ring-1 ring-white/10"`;

const newPlayer = `        {/* Active Player Module */}
        {currentVideo && (
          <div className="shrink-0 w-full bg-black border-b border-white/10 z-30 shadow-2xl">
          <div 
            ref={playerContainerRef}
            className="w-full max-w-5xl mx-auto bg-black relative group"`;

if (code.includes(oldPlayer)) {
    code = code.replace(oldPlayer, newPlayer);
}

const oldVideoFeed = `            </div>
          </div>
        )}

        {/* Video Feed */}`;

const newVideoFeed = `            </div>
          </div>
          </div>
        )}

        {/* Video Feed (Scrollable) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 pb-32">`;

if (code.includes(oldVideoFeed)) {
    code = code.replace(oldVideoFeed, newVideoFeed);
}

const oldEnd = `        </div>
      </div>
    </div>
  );`;

const newEnd = `        </div>
        </div>
      </div>
    </div>
  );`;

if (code.includes(oldEnd)) {
    code = code.replace(oldEnd, newEnd);
}

fs.writeFileSync('src/components/VideoView.tsx', code);
console.log("Fixed layout");
