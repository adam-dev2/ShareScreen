import { useEffect, useRef } from "react"
import { socket } from "../utils/socket"
import { useParams } from "react-router-dom"

const Viewer = () => {
  const { roomId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection>(null);
  useEffect(() => {
    socket.connect();
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (!videoRef.current) return;
      videoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit('ice-candidate', { roomId, candidate: event.candidate });
    };

    socket.emit('join-room', { roomId });

    socket.on('offer', async (data) => {
      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, answer });
    });

    socket.on('ice-candidate', async (data) => {
      await pc.addIceCandidate(data);
    });
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-3xl aspect-video bg-black rounded-lg"
      />
    </div>
  );
}

export default Viewer;
