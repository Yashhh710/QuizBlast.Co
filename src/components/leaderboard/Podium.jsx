import React, { memo } from 'react';
import { MEDALS, PODIUM_COLORS } from '../../utils/constants';

const Podium = memo(function Podium({ players }) {
  const top = players.slice(0, 3);
  const order = top.length >= 3 ? [top[1], top[0], top[2]] : (top.length === 2 ? [top[1], top[0]] : top);
  const heights = [80, 112, 60];
  const delays = [1.5, 2.5, 0.5];

  return (
    <div className="podium-wrap">
      {order.map((p, i) => {
        const realRank = players.indexOf(p);
        const h = top.length >= 3 ? heights[i] : 112;
        const delay = top.length >= 3 ? delays[i] : (i === 0 ? 1.5 : 2.5);
        return (
          <div key={p.id || i} className="podium-col" style={{ animationDelay: `${delay}s` }}>
            <div style={{ fontSize: '.9rem' }}>{MEDALS[realRank] || ''}</div>
            <div style={{ fontSize: '2rem' }}>{p.avatar || '🎮'}</div>
            <div className="podium-name">{p.name}</div>
            <div className="podium-pts">{p.score}pts</div>
            <div className="podium-block" style={{ height: `${h}px`, background: PODIUM_COLORS[i] || '#888' }}>
              #{realRank + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default Podium;
