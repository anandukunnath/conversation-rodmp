import React, { useState, useEffect, useRef } from 'react';
import nlp from 'compromise';
import './App.css';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [topicTree, setTopicTree] = useState({ topic: 'Conversation', children: [] });
  const [currentConversation, setCurrentConversation] = useState([]);
  const [activeTab, setActiveTab] = useState('listener');

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const currentTopicRef = useRef(topicTree); // To keep track of the current topic branch

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

        transcriptRef.current = interimTranscript;
        setTranscript(interimTranscript);

        // Check if the sentence has ended based on punctuation
        if (/[.!?]\s*$/.test(interimTranscript)) {
          // Log the sentence with timestamp in currentConversation
          const currentTime = new Date().toLocaleTimeString();
          setCurrentConversation(prev => [...prev, { time: currentTime, text: interimTranscript }]);

          // Identify and log topics
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
  }, [isListening]);

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
      updateTopicTree(identifiedTopics[0], currentTime);
    }
  };

  const updateTopicTree = (newTopic, time) => {
    const updatedTree = { ...topicTree };
    let currentBranch = currentTopicRef.current;

    // If the new topic deviates, create a new branch
    if (currentBranch.topic !== newTopic) {
      const newBranch = { topic: newTopic, time, children: [] };
      currentBranch.children.push(newBranch);
      currentTopicRef.current = newBranch; // Set new branch as the current branch
    }

    setTopicTree(updatedTree); // Update state with new tree structure
  };

  const renderTopicTree = (node) => (
    <li key={node.topic}>
      <div className="roadmap-item-bubble">
        <strong>{node.time ? `${node.time}: ` : ''}</strong> {node.topic}
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map(child => renderTopicTree(child))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="App">
      {activeTab === 'listener' && (
        <div className="listener-section">
          <div className="transcript-section">
            <h2>Transcription</h2>
            <div className="transcript-display">
              {transcript || "Your conversation will appear here..."}
            </div>
          </div>
          <div className="roadmap-section">
            <h2>Topic Flow</h2>
            <div className="roadmap">
              <ul>
                {renderTopicTree(topicTree)}
              </ul>
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
