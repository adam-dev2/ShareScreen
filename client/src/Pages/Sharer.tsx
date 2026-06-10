import { useEffect, useRef } from 'react';
import { socket } from '../utils/socket.ts';
import { useParams } from 'react-router-dom'
const Sharer = () => {
  const { roomId } = useParams();
  const remoteDescriptionRef = useRef(false);
  const ICECandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const pcRef = useRef<RTCPeerConnection>(null)
  useEffect(() => {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;


    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      socket.emit('ice-candidate', {
        roomId,
        candidate: event.candidate
      })
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
      await pc.setRemoteDescription(data.candidate)
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
    const pc = pcRef.current;
    for (const track of stream.getTracks()) {
      pc?.addTrack(track, stream);
    }

  }
  return (
    <div>
      <button
        onClick={handleShareScreen} >ShareScreen</button>
    </div>
  )
}

export default Sharer
