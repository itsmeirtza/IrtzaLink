import React, { useState, useEffect, useRef } from 'react';
import { getChatMessages, sendMessage, createChatRoom } from '../services/firebase';
import VerifiedBadge from './VerifiedBadge';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  MinusIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const ChatBox = ({ currentUser, chatUser, onClose, isMinimized, onToggleMinimize }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (currentUser && chatUser && currentUser.uid && chatUser.uid) {
      // Reset messages when chat users change
      setMessages([]);
      setLoading(false);
      setChatId(null);
      
      initializeChat();
    } else {
      // Clear chat data when users are not available
      setMessages([]);
      setChatId(null);
    }
  }, [currentUser?.uid, chatUser?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    const generatedChatId = [currentUser.uid, chatUser.uid].sort().join('_');
    setChatId(generatedChatId);
    
    // Create chat room if it doesn't exist
    await createChatRoom(currentUser.uid, chatUser.uid);
    
    // Load existing messages
    loadMessages(generatedChatId);
  };

  const loadMessages = async (chatId) => {
    setLoading(true);
    try {
      const result = await getChatMessages(chatId, 50);
      if (result.success) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !chatId) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Add message optimistically to UI
      const tempMessage = {
        id: 'temp_' + Date.now(),
        senderId: currentUser.uid,
        message: messageText,
        timestamp: new Date(),
        temp: true
      };
      setMessages(prev => [...prev, tempMessage]);

      // Send to Firebase
      const result = await sendMessage(chatId, currentUser.uid, messageText);
      
      if (result.success) {
        // Remove temp message and reload
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        loadMessages(chatId);
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentUser || !chatUser) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 ${
      isMinimized ? 'h-12' : 'h-96'
    } transition-all duration-300`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <img
            src={chatUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.displayName || 'User')}&background=3b82f6&color=ffffff`}
            alt={chatUser.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {chatUser.displayName || 'User'}
              </h3>
              <VerifiedBadge username={chatUser.username} className="w-3 h-3 ml-1" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              @{chatUser.username}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleMinimize}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            {isMinimized ? (
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <MinusIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Chat Content - Hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 h-64 bg-gray-50 dark:bg-gray-900">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwn = message.senderId === currentUser.uid;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          isOwn
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                        } ${message.temp ? 'opacity-70' : ''}`}
                      >
                        <p className="break-words">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Start your conversation with {chatUser.displayName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  maxLength={500}
                />
              </div>
              
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                onClick={() => {
                  // Add emoji picker functionality here if needed
                  toast.info('Emoji picker coming soon!');
                }}
              >
                <FaceSmileIcon className="w-5 h-5" />
              </button>
              
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;