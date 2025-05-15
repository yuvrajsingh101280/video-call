import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer/simplepeer.min.js";
const socket = io("https://video-call-fx6d.onrender.com/");
const App = () => {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected", socket.id);
    });
  }, []);

  const myVideoRef = useRef();
  const peerVideoRef = useRef();
  const connectionRef = useRef();

  const [stream, setStream] = useState(null);
  const [userId, setUserId] = useState("");
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  const [incomingCallInfo, setIncomingCallInfo] = useState({});

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((MediaStream) => {
        setStream(MediaStream);
        myVideoRef.current.srcObject = MediaStream;
      })
      .catch((error) => console.log("Error accessing media devices", error));

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callEnded", destroyConnection);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callEnded", destroyConnection);
    };
  }, []);

  const handleIncomingCall = ({ from, signalData }) => {
    setIncomingCallInfo({ isSomeoneCalling: true, from, signalData });
  };
  // function to intiate the call
  const initiateCall = () => {
    if (userId) {
      // creating a peer connection
      const peer = new SimplePeer({
        initiator: true, //you are the caller(initiator)
        trickle: false, // Disable trickle ICE (simplifies signaling)
        stream, //this is my video stream
      });
      // this event is for sending the signal data to the receiver
      peer.on("signal", (signalData) => {
        socket.emit("initiateCall", { userId, signalData, myId: socket?.id });
      });

      // when the reciveer will accept the call this event will atach reciever's stream to vide elemet

      peer.on("stream", (remoteStream) => {
        peerVideoRef.current.srcObject = remoteStream;
      });
      /***✅ When the receiver accepts the call:

They send their own signaling data (like SDP, ICE candidates).

You receive that via 'callAccepted' socket event.

You pass that data into peer.signal(...) to finish the handshake (connection is now established!). */
      socket.on("callAccepted", (signal) => {
        setIsCallAccepted(true);
        peer.signal(signal);
      });
      connectionRef.current = peer;
    } else {
      alert("Enter user id call intiate a calls");
    }
  };
  const answerCall = () => {
    try {
      setIsCallAccepted(true);
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (data) => {
        socket.emit("answerCall", { signal: data, to: incomingCallInfo.from });
      });
      peer.on("stream", (currentStream) => {
        peerVideoRef.current.srcObject = currentStream;
      });
      peer.signal(incomingCallInfo.signalData);
      connectionRef.current = peer;
    } catch (error) {
      console.log("Error in answering the call", error);
    }
  };

  const endCall = () => {
    socket.emit("endCall", { to: incomingCallInfo.from });
    destroyConnection();
  };
  const destroyConnection = () => {
    connectionRef.current.destroy();
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-center">Video Calling MERN APP</h2>

      <div className="flex flex-col w-300 gap-4">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          className="input"
        />
        <button onClick={initiateCall} className="input bg-blue-600">
          Call user
        </button>
      </div>
      <section>
        My ID:{" "}
        <u>
          <i>{socket?.id}</i>
        </u>
      </section>

      <div className="flex flex-row gap-4 m-4 mb-8">
        <div>
          <h3 className="text-center">My Video</h3>
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            muted
            className="video_player"
          ></video>
        </div>
        {isCallAccepted && (
          <div>
            <h3 className="text-center">Peer Video</h3>
            <video
              ref={peerVideoRef}
              autoPlay
              playsInline
              className="video_player"
            ></video>
          </div>
        )}
      </div>
      {isCallAccepted ? (
        <button className="input bg-red" onClick={endCall}>
          End Call
        </button>
      ) : (
        incomingCallInfo?.isSomeoneCalling && (
          <div className="flex flex-col mb-8">
            <section className="m-4">
              <u>{incomingCallInfo.from}</u>is calling
            </section>
            <button onClick={answerCall} className="input bg-green">
              Answer Call
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default App;
