import React, { useCallback } from 'react';
import { SHAPES, ANS_COLORS } from '../../utils/constants';

function ManualQEditor({ questions, onChange }) {
  const addQ = useCallback(() => {
    onChange(prev => [...prev, {
      id: Date.now(),
      question: '',
      answers: ['', '', '', ''],
      correct: 0,
      fun_fact: ''
    }]);
  }, [onChange]);

  const removeQ = useCallback((id) => {
    onChange(prev => prev.filter(q => q.id !== id));
  }, [onChange]);

  const updateQ = useCallback((id, field, value) => {
    onChange(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  }, [onChange]);

  const updateAnswer = useCallback((id, idx, value) => {
    onChange(prev => prev.map(q => {
      if (q.id !== id) return q;
      const answers = [...q.answers];
      answers[idx] = value;
      return { ...q, answers };
    }));
  }, [onChange]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Questions</span>
        <button className="btn btn-ghost btn-sm" onClick={addQ} style={{ fontSize: '.8rem', padding: '7px 14px' }}>+ Add Question</button>
      </div>
      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
        {questions.map((q, n) => (
          <div key={q.id} className="q-editor">
            <div className="q-editor-num">Question {n + 1}</div>
            <button className="q-del" onClick={() => removeQ(q.id)}>✕</button>
            <div className="field" style={{ marginBottom: '8px' }}>
              <textarea
                rows={2}
                placeholder="Type your question…"
                value={q.question}
                onChange={e => updateQ(q.id, 'question', e.target.value)}
                style={{ background: 'rgba(0,0,0,.2)', borderColor: 'rgba(255,255,255,.15)', color: '#fff' }}
              />
            </div>
            <div className="ans-inputs">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="ans-input-wrap">
                  <span className="ans-label-abs" style={{ color: ANS_COLORS[i] }}>{SHAPES[i]}</span>
                  <input
                    type="text"
                    placeholder={`Option ${['A','B','C','D'][i]}`}
                    value={q.answers[i]}
                    onChange={e => updateAnswer(q.id, i, e.target.value)}
                    style={{ background: 'rgba(0,0,0,.2)', borderColor: 'rgba(255,255,255,.15)' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase' }}>Correct:</span>
              {[0, 1, 2, 3].map(i => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`cr-${q.id}`}
                    value={i}
                    checked={q.correct === i}
                    onChange={() => updateQ(q.id, 'correct', i)}
                    style={{ width: 'auto', margin: 0, accentColor: '#FFC836' }}
                  />
                  <span style={{ color: ANS_COLORS[i], fontWeight: 800, fontSize: '.85rem' }}>{SHAPES[i]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default ManualQEditor;
