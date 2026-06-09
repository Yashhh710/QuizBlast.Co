import React from 'react';
import { useLocation } from 'react-router-dom';

export default function GeneratingPage() {
  const location = useLocation();
  const topic = location.state?.topic || 'your topic';

  return (
    <div className="screen screen-generating" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'floatBounce .8s infinite alternate' }}>🤖</div>
        <h2 className="title" style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '8px' }}>Crafting your quiz…</h2>
        <p style={{ color: 'rgba(255,255,255,.65)', marginBottom: '28px' }}>
          AI generating questions about <strong style={{ color: '#FFC836' }}>{topic}</strong>
        </p>
        <div className="loading-dots">
          <span>•</span><span>•</span><span>•</span>
        </div>
        <div style={{ marginTop: '28px', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="shimmer" style={{ width: '80%' }}></div>
          <div className="shimmer" style={{ width: '62%' }}></div>
          <div className="shimmer" style={{ width: '74%' }}></div>
        </div>
      </div>
    </div>
  );
}
