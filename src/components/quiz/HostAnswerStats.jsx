import React, { memo } from 'react';
import { SHAPES, ANS_COLORS } from '../../utils/constants';

const HostAnswerStats = memo(function HostAnswerStats({ answerDist, answers, revealedCorrect }) {
  const total = Object.values(answerDist || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="ans-bar-wrap">
      {[0, 1, 2, 3].map(i => {
        const pct = Math.round(((answerDist?.[i] || 0) / total) * 100);
        return (
          <div key={i} className="ans-bar-row">
            <div className="ans-bar-label" style={{ color: ANS_COLORS[i] }}>{SHAPES[i]}</div>
            <div className={`host-opt-text${revealedCorrect === i ? ' reveal-correct' : ''}`}>
              {answers?.[i] || ''}
            </div>
            <div className="ans-bar-track">
              <div
                className="ans-bar-fill"
                style={{ width: `${pct}%`, background: ANS_COLORS[i] }}
              >
                {pct > 8 ? `${pct}%` : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default HostAnswerStats;
