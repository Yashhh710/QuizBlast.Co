import React, { memo } from 'react';

const QuestionCard = memo(function QuestionCard({ question, isHost }) {
  return (
    <div className="question-area">
      <div className="question-card">
        {isHost && (
          <p style={{ fontSize: '.68rem', color: '#9B59B6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px' }}>
            🖥 HOST VIEW
          </p>
        )}
        <div className="question-text">{question}</div>
      </div>
    </div>
  );
});

export default QuestionCard;
