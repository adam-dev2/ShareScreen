import { useEffect } from 'react';
import { socket } from '../utils/socket';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();

    const handleRoomId = (data: { roomId: string }) => {
      navigate(`/share/${data.roomId}`);
    };

    socket.on('roomId', handleRoomId);

    return () => {
      socket.off('roomId', handleRoomId);
      // Don't disconnect here — the Sharer page reuses the same socket
    };
  }, [navigate]);

  const handleCreateRoom = () => {
    socket.emit('create-room', {});
  };

  return (
    <div className="h-screen w-screen bg-neutral-900 flex flex-col items-center justify-center gap-4">
      <h1 className="text-white text-3xl font-semibold">Screen Share</h1>
      <p className="text-neutral-400 text-sm">No sign-up. No install. Just share.</p>
      <button
        onClick={handleCreateRoom}
        className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
      >
        Create Room
      </button>
    </div>
  );
};

export default HomePage;
