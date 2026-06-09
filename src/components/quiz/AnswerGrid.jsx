import React, { memo } from 'react';
import AnswerButton from './AnswerButton';

const AnswerGrid = memo(function AnswerGrid({ answers, selectedAnswer, onSelect, disabled, dimmedAnswers = [] }) {
  return (
    <div className="answers-area">
      <div className="answers-grid" id="player-answers-grid">
        {answers.map((text, i) => {
          const isPowerupDimmed = dimmedAnswers.includes(i);
          const isSelectedDimmed = selectedAnswer !== null && selectedAnswer !== i;
          return (
            <AnswerButton
              key={i}
              index={i}
              text={text}
              onClick={(e) => onSelect && onSelect(i, e)}
              disabled={disabled || selectedAnswer !== null || isPowerupDimmed}
              dimmed={isPowerupDimmed || isSelectedDimmed}
              selected={selectedAnswer === i}
            />
          );
        })}
      </div>
    </div>
  );
});

export default AnswerGrid;
