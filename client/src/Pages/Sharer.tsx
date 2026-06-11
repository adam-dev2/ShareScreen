import { useEffect, useRef, useState } from 'react';
import { socket } from '../utils/socket';
import { useParams } from 'react-router-dom';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const Sharer = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteDescriptionSetRef = useRef(false);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const viewerUrl = `${window.location.origin}/view/${roomId}`;
  useEffect(() => {
    if (sharing && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [sharing]);

  useEffect(() => {
    socket.connect();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit('ice-candidate', { roomId, candidate: event.candidate });
    };

    pc.onnegotiationneeded = async () => {
      if (!streamRef.current) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { roomId, offer });
    };

    const handleViewerJoined = async () => {
      if (!streamRef.current) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { roomId, offer });
    };

    const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      await pc.setRemoteDescription(data.answer);
      remoteDescriptionSetRef.current = true;
      for (const candidate of iceCandidateQueueRef.current) {
        await pc.addIceCandidate(candidate);
      }
      iceCandidateQueueRef.current = [];
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      if (remoteDescriptionSetRef.current) {
        await pc.addIceCandidate(data.candidate);
      } else {
        iceCandidateQueueRef.current.push(data.candidate);
      }
    };

    socket.on('viewer-joined', handleViewerJoined);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('viewer-joined', handleViewerJoined);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      pc.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId]);

  const handleShareScreen = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia();
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    const pc = pcRef.current!;
    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    setSharing(true);

    stream.getVideoTracks()[0].addEventListener('ended', () => {
      setSharing(false);
      streamRef.current = null;
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(viewerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Your Screen Share Room</h1>

      <div className="flex items-center gap-2 bg-neutral-800 rounded-xl px-4 py-3 w-full max-w-xl">
        <span className="text-neutral-400 text-sm truncate flex-1">{viewerUrl}</span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shrink-0"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {!sharing ? (
        <button
          onClick={handleShareScreen}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
        >
          Start Sharing
        </button>
      ) : (
        <div className="w-full max-w-3xl">
          <p className="text-green-400 text-sm mb-3 text-center">● Live — viewers can see your screen</p>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-black rounded-xl"
          />
        </div>
      )}
    </div>
  );
};

export default Sharer;
