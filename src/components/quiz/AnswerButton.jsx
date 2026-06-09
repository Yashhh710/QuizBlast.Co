import React, { memo } from 'react';
import { SHAPES } from '../../utils/constants';

const AnswerButton = memo(function AnswerButton({ index, text, onClick, disabled, dimmed, selected }) {
  const cls = [
    'ans-btn',
    dimmed ? 'dimmed' : '',
    selected ? 'selected-ans' : ''
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} onClick={(e) => onClick && onClick(e)} disabled={disabled}>
      <div className="ans-shape">{SHAPES[index]}</div>
      <span className="ans-text">{text}</span>
    </button>
  );
});

export default AnswerButton;
