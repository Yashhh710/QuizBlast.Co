import React from 'react';

const QuestionCard = ({ 
  question, 
  onAnswerSubmit, 
  hasAnswered, 
  selectedOption,
  playerName = "Player" 
}) => {
  if (!question) return <div className="loading">Loading question...</div>;

  return (
    <div className="quiz-card glassmorphism-ui">
      <h2 className="question-text">{question.text}</h2>
      
      <div className="options-grid">
        {question.options.map((option, index) => {
          const isCurrentSelection = selectedOption === option;
          
          return (
            <button
              key={index}
              // Rule: Block double clicks or choices after submission
              disabled={hasAnswered} 
              
              // FIX: Wrapped strictly in an arrow function to prevent instant execution on render
              onClick={(e) => {
                const timestamp = new Date().toLocaleTimeString();
                
                console.log(`[QUIZBLAST DEBUG] 
                  --- MANUAL CLICK DETECTED ---
                  Timestamp: ${timestamp}
                  Player: ${playerName}
                  Selected Option: "${option}" (Index: ${index})
                  Current hasAnswered State: ${hasAnswered}
                  Trigger Source: Direct User Click/Tap Event
                `);

                if (hasAnswered) {
                  console.warn(`[QUIZBLAST DEBUG] Click ignored. User has already answered this question.`);
                  return;
                }

                // Explicitly send true to validate intentional user interaction
                onAnswerSubmit(option, true);
              }}
              className={`option-btn ${isCurrentSelection ? 'selected' : ''} ${hasAnswered ? 'disabled' : ''}`}
            >
              <span className="option-index">{String.fromCharCode(65 + index)}.</span>
              <span className="option-value">{option}</span>
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <div className="status-badge locking-indicator">
          Answer locked. Waiting for other players...
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
