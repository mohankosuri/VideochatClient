import React, { useRef, useEffect, useState } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null); // Streamer's video
  const viewerVideoRef = useRef(null); // Viewer video
  const [stream, setStream] = useState(null);
  const [ws, setWs] = useState(null);
  const [isStreamer, setIsStreamer] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    // Establish WebSocket connection
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => console.log("WebSocket connected");
    
    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        setMessages((prev) => [...prev, event.data]);
      } else if (viewerVideoRef.current && isViewer) {
        console.log("Received video data");
        const blob = new Blob([event.data], { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        viewerVideoRef.current.src = url;
        viewerVideoRef.current.play().catch((e) => console.error("Error playing video", e));
      }
    };

    ws.onclose = () => console.log("WebSocket closed");
    ws.onerror = (error) => console.error("WebSocket error:", error);

    setWs(ws);

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isViewer]);

  const startStreaming = () => {
    setIsStreamer(true);

    // Capture video stream from webcam
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Send video stream to WebSocket server
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws) {
            console.log("Sending video data to WebSocket");
            ws.send(event.data); // Send video blob data over WebSocket
          }
        };
        mediaRecorder.start(1000); // Send data every second
      })
      .catch((err) => console.error("Error accessing media devices", err));
  };

  const startViewing = () => {
    setIsViewer(true);
    console.log("Started viewing");
  };

  const stopStreaming = () => {
    setIsStreamer(false);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // Stop the camera stream
    }
    setStream(null); // Clear the stream state
  };

  const sendMessage = () => {
    if (ws && chatMessage.trim()) {
      ws.send(chatMessage);
      setChatMessage("");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 p-4">
      <div className="w-full max-w-4xl bg-white p-6 shadow-lg rounded-lg">
        <h1 className="text-3xl text-center mb-6 font-bold text-gray-800">Live Stream Platform</h1>

        <div className="flex justify-center mb-6 gap-4">
          {!isStreamer && !isViewer && (
            <>
              <button
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
                onClick={startStreaming}
              >
                Start Streaming
              </button>
              <button
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
                onClick={startViewing}
              >
                Start Viewing
              </button>
            </>
          )}

          {isStreamer && (
            <button
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
              onClick={stopStreaming}
            >
              End Stream
            </button>
          )}
        </div>

        {/* Streamer's video (only visible to the streamer) */}
        {isStreamer && (
          <div className="mb-6">
            <h2 className="text-xl text-gray-700 text-center mb-2">You are Streaming</h2>
            <video
              ref={videoRef}
              className="w-full h-96 bg-black rounded-lg"
              autoPlay
              playsInline
            ></video>

            <button
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
              onClick={stopStreaming}
            >
              End Stream
            </button>
          </div>
        )}

        {/* Viewer video (only visible to the viewer) */}
        {isViewer && (
          <div className="mb-6">
            <h2 className="text-xl text-gray-700 text-center mb-2">You are Viewing</h2>
            <video
              ref={viewerVideoRef}
              className="w-full h-96 bg-black rounded-lg"
              autoPlay
              playsInline
              controls
            ></video>
          </div>
        )}

        {/* Chat Section */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Chat</h2>
          <div className="overflow-y-auto h-40 bg-white border p-2 rounded-lg mb-2">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className="text-gray-700 mb-1">
                  {msg}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No messages yet.</div>
            )}
          </div>
          <div className="flex">
            <input
              type="text"
              className="w-full border rounded-l-lg px-4 py-2 focus:outline-none"
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-r-lg"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
