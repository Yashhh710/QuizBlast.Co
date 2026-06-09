import React, { memo } from 'react';

const RoomCode = memo(function RoomCode({ code }) {
  return <div className="room-code">{code}</div>;
});

export default RoomCode;
