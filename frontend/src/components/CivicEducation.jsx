import React, { useState } from 'react';
import '../styles/civic-education.css';

const CivicEducation = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hello! I'm your IEBC Civic Education Assistant. Ask me anything about voting, elections, or your rights as a voter!"
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const topics = [
        { icon: "🗳️", title: "How to Vote", description: "Step by step guide to casting your vote" },
        { icon: "📜", title: "Voter Rights", description: "Know your rights as a Kenyan voter" },
        { icon: "⛓️", title: "Blockchain Voting", description: "How blockchain secures your vote" },
        { icon: "📋", title: "IEBC Guidelines", description: "Official election guidelines" },
        { icon: "⚖️", title: "Election Laws", description: "Legal framework of elections" },
        { icon: "🆔", title: "Voter Registration", description: "How to register and verify" }
    ];

    const botResponses = {
        'how to vote': "To vote, follow these steps:\n1. Locate your polling station\n2. Present your National ID\n3. Receive your ballot papers\n4. Mark your choices in private\n5. Cast your vote in the ballot box\n6. Receive your verification code",
        'voter rights': "As a Kenyan voter, you have the right to:\n• Vote in secret\n• Be assisted if you have a disability\n• Know how to use voting equipment\n• Report any irregularities\n• Receive a verification code",
        'registration': "To register to vote:\n1. Visit your nearest IEBC office\n2. Bring your National ID\n3. Provide your biometric data\n4. Receive your voter card\nOnline registration is coming soon!",
        'blockchain': "Blockchain voting ensures:\n• Your vote cannot be altered\n• Results are transparent\n• You can verify your vote\n• No double voting possible",
        'deadline': "Important deadlines:\n• Voter registration: July 9, 2027\n• Election day: August 9, 2027\n• Results announcement: Within 7 days",
        'help': "You can get help by:\n• Calling IEBC helpline: 0700-111-111\n• Visiting your local IEBC office\n• Sending SMS to 22222\n• Using this chatbot!"
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        // Add user message
        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: inputMessage
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const userInput = inputMessage.toLowerCase();
            let responseText = "I understand you're asking about voting. Please visit the IEBC website or call our helpline at 0700-111-111 for specific assistance.";
            
            for (const [keyword, response] of Object.entries(botResponses)) {
                if (userInput.includes(keyword)) {
                    responseText = response;
                    break;
                }
            }
            
            const botMessage = {
                id: messages.length + 2,
                type: 'bot',
                text: responseText
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 1000);
    };

    const handleTopicClick = (topic) => {
        setInputMessage(topic);
    };

    return (
        <div className="civic-education-container">
            <div className="civic-education-header">
                <h2>📚 Civic Education</h2>
                <p>Learn about your rights and the voting process</p>
            </div>

            <div className="civic-content-wrapper">
                {/* Topics Section */}
                <div className="topics-section">
                    <h3>Popular Topics</h3>
                    <div className="topics-grid">
                        {topics.map((topic, index) => (
                            <div 
                                key={index} 
                                className="topic-card"
                                onClick={() => handleTopicClick(topic.title)}
                            >
                                <div className="topic-icon">{topic.icon}</div>
                                <div className="topic-title">{topic.title}</div>
                                <div className="topic-description">{topic.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Chatbot Section */}
                <div className="chatbot-section">
                    <div className="chatbot-header">
                        <div className="chatbot-icon">🤖</div>
                        <div className="chatbot-title">
                            <h3>IEBC Virtual Assistant</h3>
                            <p>Ask me anything about voting</p>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((message) => (
                            <div key={message.id} className={`message ${message.type}`}>
                                <div className="message-avatar">
                                    {message.type === 'bot' ? '🤖' : '👤'}
                                </div>
                                <div className="message-bubble">
                                    <div className="message-text">{message.text}</div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message bot typing">
                                <div className="message-avatar">🤖</div>
                                <div className="message-bubble">
                                    <div className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask about voting, registration, deadlines..."
                            className="chat-input"
                        />
                        <button onClick={handleSendMessage} className="send-btn">
                            Send 📤
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CivicEducation;