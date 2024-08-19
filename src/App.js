import React, { useState, useEffect, useRef } from 'react';
import nlp from 'compromise';
import './App.css';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loggedTopics, setLoggedTopics] = useState([]);
  const [currentConversation, setCurrentConversation] = useState([]);
  const [activeTab, setActiveTab] = useState('listener');
  const [lastTopic, setLastTopic] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;

      speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interimTranscript += event.results[i][0].transcript;
        }

        setTranscript(interimTranscript);

        if (/[.!?]\s*$/.test(interimTranscript)) {
          const currentTime = new Date().toLocaleTimeString();
          setCurrentConversation(prev => [...prev, { time: currentTime, text: interimTranscript }]);
          identifyMainTopics(interimTranscript);
        }
      };

      speechRecognition.onerror = (event) => {
        console.error("Speech Recognition Error: ", event.error);
      };

      recognitionRef.current = speechRecognition;
    } else {
      alert("Your browser does not support speech recognition.");
    }
  }, []);

  const handleStartListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const identifyMainTopics = (sentence) => {
    const doc = nlp(sentence);
    const topics = doc.topics().out('array');
    let identifiedTopics = topics.length > 0 ? topics : doc.nouns().out('array');

    identifiedTopics = identifiedTopics.filter(topic => topic !== 'Could not identify main topic.');

    if (identifiedTopics.length > 0) {
      const currentTime = new Date().toLocaleTimeString();
      const newTopic = identifiedTopics.join(', ');

      if (lastTopic && lastTopic !== newTopic) {
        setLoggedTopics(prev => [...prev, { time: currentTime, topics: [newTopic], switch: true }]);
      } else {
        setLoggedTopics(prev => [...prev, { time: currentTime, topics: [newTopic] }]);
      }

      setLastTopic(newTopic);
    }
  };

  return (
    <div className="App">
      {/* <div className="nav-bar"> */}
        {/* <h1>{activeTab === 'listener' ? 'Listener' : 'Current Conversation'}</h1> */}
      {/* </div> */}

      {activeTab === 'listener' && (
        <div className="listener-section">
          <div className="transcript-section">
            <h2>Transcription</h2>
            <div className="transcript-display">
              {transcript || "Your conversation will appear here..."}
            </div>
          </div>
          <div className="roadmap-section">
            <h2>Detected Topics</h2>
            <div className="roadmap">
              {loggedTopics.map((entry, index) => (
                <div className="roadmap-item" key={index}>
                  <div className="roadmap-bullet"></div>
                  <div className={`roadmap-content ${entry.switch ? 'topic-switch' : ''}`}>
                    <strong>{entry.time}:</strong> {entry.topics.join(', ')} {entry.switch ? '(Topic Switch)' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="record-container">
            <button
              className={`record-button ${isListening ? 'active' : ''}`}
              onClick={isListening ? handleStopListening : handleStartListening}
            >
              <div className="record-icon"></div>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'conversation' && (
        <div className="conversation-section">
          <ul className="transcription-list">
            {currentConversation.map((entry, index) => (
              <li key={index}>
                <strong>{entry.time}:</strong> {entry.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bottom-nav">
        <button
          className={`nav-button ${activeTab === 'listener' ? 'active' : ''}`}
          onClick={() => setActiveTab('listener')}
        >
          Listener
        </button>
        <button
          className={`nav-button ${activeTab === 'conversation' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          Current Conversation
        </button>
      </div>
    </div>
  );
}

export default App;
