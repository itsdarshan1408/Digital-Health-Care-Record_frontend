import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { Send, Loader, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Coaching = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const { data } = await axiosInstance.get('/ai/history');
      
      const chatMessages = data.flatMap(msg => [
        { role: 'user', content: msg.message, timestamp: msg.timestamp },
        { role: 'assistant', content: msg.aiResponse, timestamp: msg.timestamp }
      ]);
      
      setMessages(chatMessages.reverse());
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    
    // Show typing indicator
    setIsTyping(true);
    setLoading(true);

    try {
      const { data } = await axiosInstance.post('/ai/coach', {
        message: userMessage,
      });

      // Hide typing indicator and add AI response
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply,
        timestamp: new Date()
      }]);
      
      // Show success feedback
      if (!data.error) {
        // Subtle success indication (optional)
      }
    } catch (error) {
      setIsTyping(false);
      console.error('AI Coach Error:', error);
      
      let errorMessage = 'I apologize, but I encountered a technical issue. Please try again in a moment.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to continue our conversation.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'The AI coach service is temporarily unavailable. Please try again later.';
      }
      
      toast.error('Connection issue with AI coach');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!window.confirm('Clear all chat history?')) return;

    try {
      await axiosInstance.delete('/ai/history');
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear chat history');
    }
  };

  const quickQuestions = [
    "What's a healthy breakfast for energy?",
    "How can I improve my sleep quality?",
    "I'm new to exercise, where should I start?",
    "How much water should I drink daily?",
    "I'm feeling stressed, what can help?",
    "What are some healthy snack options?",
    "How can I stay motivated to exercise?",
    "Tips for eating more vegetables?"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              AI Health Coach
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Get personalized wellness guidance powered by AI
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="btn-secondary flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 card flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 rounded-2xl mb-4">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to AI Health Coach!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                I'm here to provide general wellness guidance, fitness tips, nutrition advice,
                and support for your health journey. Ask me anything!
              </p>

              {/* Quick Questions */}
              <div className="w-full max-w-2xl">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(question)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full text-sm text-gray-700 dark:text-gray-300 transition"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg max-w-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Disclaimer:</strong> This AI provides general wellness advice,
                  not medical diagnoses. Always consult healthcare professionals for
                  serious concerns.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-br-sm'
                        : msg.isError
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-bl-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.timestamp && (
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about fitness, nutrition, sleep, stress..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="btn-primary px-6 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Coaching;
