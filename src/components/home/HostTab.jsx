import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { generateQuestions } from '../../services/groq';
import { createRoom } from '../../services/gameService';
import { genCode } from '../../utils/helpers';
import MethodSelector from './MethodSelector';
import ManualQEditor from './ManualQEditor';

export default function HostTab() {
  const navigate = useNavigate();
  const { setRoomCode, setIsHost, setQuestions, setTimePerQ, setGameMode } = useGame();

  const [method, setMethod] = useState('ai');
  const [topic, setTopic] = useState('');
  const [qcount, setQcount] = useState('10');
  const [difficulty, setDifficulty] = useState('medium');
  const [time, setTime] = useState('20');
  const [mode, setMode] = useState('classic');
  const [manualQs, setManualQs] = useState([]);
  const [manualTitle, setManualTitle] = useState('');
  const [error, setError] = useState('');
  const [manualError, setManualError] = useState('');

  const handleHost = useCallback(async () => {
    setError('');
    const tpq = parseInt(time);
    let qs = [];

    if (method === 'manual') {
      const valid = manualQs.filter(q => q.question.trim() && q.answers.every(a => a.trim()));
      if (valid.length < 2) {
        setManualError('Add at least 2 complete questions.');
        return;
      }
      qs = valid;
    } else {
      if (!topic.trim()) { setError('Please enter a topic!'); return; }
      navigate('/generating', { state: { topic } });
      try {
        qs = await generateQuestions(topic.trim(), qcount, difficulty);
      } catch (e) {
        navigate('/');
        setError('❌ ' + (e.message || 'Generation failed.'));
        return;
      }
    }

    const code = genCode();
    setRoomCode(code);
    setIsHost(true);
    setQuestions(qs);
    setTimePerQ(tpq);
    setGameMode(mode);
    await createRoom(code, qs, tpq, mode);
    navigate('/lobby');
  }, [method, topic, qcount, difficulty, time, mode, manualQs, navigate, setRoomCode, setIsHost, setQuestions, setTimePerQ, setGameMode]);

  return (
    <div id="tab-host">
      <MethodSelector method={method} onSelect={setMethod} />

      {method === 'ai' && (
        <div id="mode-ai">
          <div className="field">
            <label>Quiz Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Bollywood, Cricket, Science…"
            />
          </div>
          <div className="field">
            <label>Questions</label>
            <select value={qcount} onChange={e => setQcount(e.target.value)}>
              <option value="5">5 questions</option>
              <option value="8">8 questions</option>
              <option value="10">10 questions</option>
              <option value="15">15 questions</option>
            </select>
          </div>
          <div className="field">
            <label>Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">Easy 😊</option>
              <option value="medium">Medium 🔥</option>
              <option value="hard">Hard 💀</option>
            </select>
          </div>
        </div>
      )}

      {method === 'manual' && (
        <div id="mode-manual">
          <div className="field">
            <label>Quiz Title</label>
            <input
              type="text"
              value={manualTitle}
              onChange={e => setManualTitle(e.target.value)}
              placeholder="My Awesome Quiz"
            />
          </div>
          <ManualQEditor questions={manualQs} onChange={setManualQs} />
          {manualError && <div className="err">{manualError}</div>}
        </div>
      )}

      <div className="field" style={{ marginTop: '4px' }}>
        <label>Time per Question</label>
        <select value={time} onChange={e => setTime(e.target.value)}>
          <option value="10">10 seconds ⚡</option>
          <option value="15">15 seconds</option>
          <option value="20">20 seconds</option>
          <option value="30">30 seconds 🐢</option>
        </select>
      </div>
      <div className="field">
        <label>Game Mode</label>
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="classic">🎯 Classic</option>
          <option value="streak">🔥 Streak Bonus</option>
          <option value="powerup">⚡ Power-Up Mode</option>
        </select>
      </div>
      <button className="btn btn-yellow btn-lg" onClick={handleHost} style={{ marginTop: '4px' }}>
        {method === 'ai' ? '🚀 Generate & Host' : '🎮 Host Quiz'}
      </button>
      {error && <div className="err">{error}</div>}
    </div>
  );
}
