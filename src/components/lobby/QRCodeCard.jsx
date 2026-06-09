import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeCard({ url }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 130,
      color: { dark: '#46178F', light: '#ffffff' }
    }).catch(() => {});
  }, [url]);

  return (
    <div id="qr-wrap" style={{ margin: '14px auto' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
