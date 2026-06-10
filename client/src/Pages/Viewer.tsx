import { useEffect } from "react"
import { socket } from "../utils/socket"
import { useParams } from "react-router-dom"


const Viewer = () => {
  const { roomId } = useParams();

  useEffect(() => {
    socket.emit('join-room', {
      roomId
    })

  }, [])


  return (
    <div></div>
  )
}

export default Viewer
