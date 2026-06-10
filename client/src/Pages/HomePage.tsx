import { useEffect } from 'react';
import { socket } from '../utils/socket.ts'
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    socket.connect();
    socket.on('roomId', (data) => {
      navigate(`/share/${data.roomId}`)
    })

    return () => { socket.disconnect() }
  }, [])
  const handleCreateRoom = () => {
    console.log('inside the create room function');

    socket.emit('create-room', {});
  }
  return (
    <div className='h-screen w-screen bg-neutral-400 text-center items-center'>
      <button
        onClick={() => { handleCreateRoom() }}
        className='bg-blue-200 text-md rounded-2xl'>
        Create Room
      </button>
    </div>
  )
}

export default HomePage; 
