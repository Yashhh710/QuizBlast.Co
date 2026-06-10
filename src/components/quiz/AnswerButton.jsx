import React, { memo } from 'react';

const AnswerButton = memo(function AnswerButton({ index, text, onClick, disabled, dimmed, selected }) {
  const cls = [
    'ans-btn',
    dimmed ? 'dimmed' : '',
    selected ? 'selected-ans' : ''
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} onClick={(e) => onClick && onClick(e)} disabled={disabled}>
      <span className="ans-text">{text}</span>
    </button>
  );
});

export default AnswerButton;
