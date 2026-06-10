import { useEffect, useRef, useState } from 'react';
import { socket } from '../utils/socket.ts';
import { useParams } from 'react-router-dom'
const Sharer = () => {
  const { roomId } = useParams();
  const remoteDescriptionRef = useRef(false);
  const ICECandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const pcRef = useRef<RTCPeerConnection>(null)
  const [shareScreeen, setShareScreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream>(null);

  useEffect(() => {
    socket.connect();
    const pc = new RTCPeerConnection();
    pcRef.current = pc;


    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      socket.emit('ice-candidate', {
        roomId,
        candidate: event.candidate
      })
    };
    pc.ontrack = (event) => {
      if (!videoRef.current) return;
      videoRef.current.srcObject = event.streams[0];
    }

    socket.on('viewer-joined', async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', {
        roomId,
        offer
      });
    })

    socket.on('answer', async (data) => {
      await pc.setRemoteDescription(data.answer)
      remoteDescriptionRef.current = true;

      for (const candidate of ICECandidateQueueRef.current) {
        await pc.addIceCandidate(candidate);
      }
      ICECandidateQueueRef.current = [];
    })

    socket.on('ice-candidate', async (data) => {
      if (remoteDescriptionRef.current) {
        await pc.addIceCandidate(data.candidate)
      } else {
        ICECandidateQueueRef.current.push(data.candidate);
      }
    })


  }, [])
  const handleShareScreen = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia();
    streamRef.current = stream;
    setShareScreen(true);
    const pc = pcRef.current;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    for (const track of stream.getTracks()) {
      pc?.addTrack(track, stream);
    }
  }

  useEffect(() => {
    if (shareScreeen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [shareScreeen])

  return (
    <div>
      {!shareScreeen ? (
        <button onClick={handleShareScreen}>Share Screen</button>
      ) : (
        <video ref={videoRef} autoPlay playsInline />

      )}    </div>
  );
}

export default Sharer;
