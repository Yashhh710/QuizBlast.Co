import React, { memo, useCallback, useRef } from 'react';
import { sendReaction as sendReactionService } from '../../services/playerService';
import { spawnFloating } from '../../utils/animations';

const REACTIONS = ['😂','🔥','😱','👏','😤'];

const ReactionBar = memo(function ReactionBar({ roomCode, myId }) {
  const lastTsRef = useRef(0);

  const handleReaction = useCallback(async (emoji) => {
    const now = Date.now();
    if (now - lastTsRef.current < 1500) return;
    lastTsRef.current = now;
    await sendReactionService(roomCode, myId, emoji);
    spawnFloating(emoji, window.innerWidth / 2, window.innerHeight * 0.7);
  }, [roomCode, myId]);

  return (
    <div className="reactions-bar">
      {REACTIONS.map(emoji => (
        <button key={emoji} className="reaction-btn" onClick={() => handleReaction(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  );
});

export default ReactionBar;
