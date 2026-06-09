import React, { memo } from 'react';

const AnswerResultOverlay = memo(function AnswerResultOverlay({
  isCorrect, isTimeout, isSkipped, pts, streak, question, myStreak
}) {
  const cls = isCorrect
    ? 'ans-result-overlay ans-result-correct'
    : isTimeout
    ? 'ans-result-overlay ans-result-timeout'
    : 'ans-result-overlay ans-result-wrong';

  const icon = isCorrect ? '✅' : isTimeout ? '⏰' : '❌';
  const title = isCorrect ? 'Correct!' : isTimeout ? "Time's Up!" : isSkipped ? 'Skipped!' : 'Wrong!';

  return (
    <div className={cls}>
      <div className="result-icon">{icon}</div>
      <div className="result-title">{title}</div>

      {isCorrect && pts > 0 && (
        <div className="result-pts">+{pts} pts{myStreak > 1 ? ` 🔥×${myStreak}` : ''}</div>
      )}

      {!isCorrect && !isTimeout && !isSkipped && question && (
        <>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: '.9rem', margin: '.3rem 0' }}>
            The correct answer was:
          </div>
          <div className="correct-reveal">{question.answers[question.correct]}</div>
        </>
      )}

      {isTimeout && question && (
        <div className="correct-reveal">✓ {question.answers[question.correct]}</div>
      )}

      {question?.fun_fact && isCorrect && (
        <div className="fun-fact-strip">💡 {question.fun_fact}</div>
      )}

      {myStreak >= 3 && (
        <div className="streak-badge">🔥 {myStreak} answer streak!</div>
      )}

      <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.82rem', marginTop: '18px' }}>
        Waiting for next question…
      </p>
    </div>
  );
});

export default AnswerResultOverlay;
