import { useEffect, useRef, useState } from 'react';
import { socket } from '../utils/socket';
import { useParams } from 'react-router-dom';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const Viewer = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteDescriptionSetRef = useRef(false);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Viewer] useEffect mounting, roomId:', roomId);
    socket.connect();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onconnectionstatechange = () => {
      console.log('[Viewer] connectionState:', pc.connectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log('[Viewer] signalingState:', pc.signalingState);
    };

    pc.onicegatheringstatechange = () => {
      console.log('[Viewer] iceGatheringState:', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[Viewer] iceConnectionState:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn('[Viewer] ICE failed — restarting ICE');
        pc.restartIce();
      }
    };

    pc.ontrack = (event) => {
      console.log('[Viewer] ontrack fired, streams:', event.streams.length);
      if (!videoRef.current) {
        console.warn('[Viewer] ontrack fired but videoRef is null');
        return;
      }
      videoRef.current.srcObject = event.streams[0];
      setConnected(true);
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      console.log('[Viewer] sending ICE candidate');
      socket.emit('ice-candidate', { roomId, candidate: event.candidate });
    };

    const handleOffer = async (data: { offer: RTCSessionDescriptionInit }) => {
      console.log('[Viewer] offer received, current signalingState:', pc.signalingState);
      if (pc.signalingState !== 'stable') {
        console.warn('[Viewer] offer arrived in non-stable state, ignoring. State:', pc.signalingState);
        return;
      }

      try {
        await pc.setRemoteDescription(data.offer);
        console.log('[Viewer] setRemoteDescription done');
        remoteDescriptionSetRef.current = true;

        console.log('[Viewer] draining ICE queue, length:', iceCandidateQueueRef.current.length);
        for (const candidate of iceCandidateQueueRef.current) {
          await pc.addIceCandidate(candidate);
        }
        iceCandidateQueueRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[Viewer] answer created and set, emitting to server');
        socket.emit('answer', { roomId, answer });
      } catch (err) {
        console.error('[Viewer] error in handleOffer:', err);
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      if (!data?.candidate) {
        console.warn('[Viewer] received ice-candidate event with no candidate');
        return;
      }
      if (remoteDescriptionSetRef.current) {
        try {
          await pc.addIceCandidate(data.candidate);
          console.log('[Viewer] ICE candidate added directly');
        } catch (err) {
          console.error('[Viewer] addIceCandidate error:', err);
        }
      } else {
        console.log('[Viewer] queueing ICE candidate (no remote desc yet)');
        iceCandidateQueueRef.current.push(data.candidate);
      }
    };

    const handleRoomError = (data: { message: string }) => {
      console.error('[Viewer] room-error:', data.message);
      setError(data.message);
    };

    const handleSharerDisconnected = () => {
      console.log('[Viewer] sharer disconnected');
      setConnected(false);
      setError('The sharer has ended the session.');
    };

    socket.on('offer', handleOffer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('room-error', handleRoomError);
    socket.on('sharer-disconnected', handleSharerDisconnected);

    console.log('[Viewer] emitting join-room, roomId:', roomId);
    socket.emit('join-room', { roomId });

    return () => {
      console.log('[Viewer] useEffect cleanup');
      socket.off('offer', handleOffer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('room-error', handleRoomError);
      socket.off('sharer-disconnected', handleSharerDisconnected);
      pc.close();
    };
  }, [roomId]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">
        {connected ? '● Watching live' : 'Waiting for sharer…'}
      </h1>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-3xl aspect-video bg-black rounded-xl"
      />
    </div>
  );
};

export default Viewer;
