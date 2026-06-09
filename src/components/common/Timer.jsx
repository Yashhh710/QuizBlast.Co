import React, { useEffect } from 'react';

const Timer = ({ 
  timeLeft, 
  setTimeLeft, 
  hasAnswered, 
  onTimeExpired, 
  isActive 
}) => {
  
  useEffect(() => {
    if (!isActive) return;

    // Standard high-accuracy countdown interval
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, setTimeLeft]);

  // Handle the absolute transition to 0 purely outside rendering loops
  useEffect(() => {
    if (timeLeft === 0 && !hasAnswered && isActive) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[QUIZBLAST DEBUG] 
        --- TIMER EXPIRED (0s) ---
        Timestamp: ${timestamp}
        Action: Passing control to fallback system.
        Trigger Source: useEffect Lifecycle Timer Monitoring
      `);
      
      // Explicitly mark as structural fallback, NOT a manual click
      onTimeExpired(); 
    }
  }, [timeLeft, hasAnswered, isActive, onTimeExpired]);

  return (
    <div className={`timer-container ${timeLeft <= 5 ? 'timer-warning' : ''}`}>
      <div className="timer-radial-bar">
        <span className="time-display">{timeLeft}s</span>
      </div>
    </div>
  );
};

export default Timer;
