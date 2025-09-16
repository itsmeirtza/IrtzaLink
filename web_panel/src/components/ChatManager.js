import React, { useState, useEffect, useRef } from 'react';
import { getUserData, createChatRoom, sendMessage, getChatMessages } from '../services/firebase';
import { onSnapshot, collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import VerifiedBadge from './VerifiedBadge';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const ChatManager = ({ user, isOpen, onClose }) => {
  const [chatUsers, setChatUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchFriends();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time listener for messages
  useEffect(() => {
    if (activeChat) {
      const chatId = activeChat.chatId;
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messageList = [];
        snapshot.forEach((doc) => {
          messageList.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messageList);
      });

      return () => unsubscribe();
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const userResult = await getUserData(user.uid);
      if (userResult.success && userResult.data.friends) {
        const friendIds = userResult.data.friends;
        
        // Get details of friend users
        const friendDetails = await Promise.all(
          friendIds.map(async (friendId) => {
            const userDetails = await getUserData(friendId);
            if (userDetails.success) {
              return {
                id: friendId,
                ...userDetails.data
              };
            }
            return null;
          })
        );
        
        setChatUsers(friendDetails.filter(Boolean));
      } else {
        setChatUsers([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setChatUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (chatUser) => {
    try {
      // Create chat room ID
      const chatId = [user.uid, chatUser.id].sort().join('_');
      
      // Create or get existing chat room
      const result = await createChatRoom(user.uid, chatUser.id);
      if (result.success) {
        setActiveChat({
          chatId,
          user: chatUser
        });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      const result = await sendMessage(activeChat.chatId, user.uid, newMessage.trim());
      if (result.success) {
        setNewMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-96 flex overflow-hidden">
        {/* Chat Users List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>Chats</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : chatUsers.length > 0 ? (
              <div className="space-y-1 p-2">
                {chatUsers.map((chatUser) => (
                  <button
                    key={chatUser.id}
                    onClick={() => startChat(chatUser)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                      activeChat?.user.id === chatUser.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <img
                      src={chatUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.displayName || 'User')}&background=3b82f6&color=ffffff&size=32`}
                      alt={chatUser.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {chatUser.displayName}
                        </p>
                        <VerifiedBadge username={chatUser.username} className="w-3 h-3 ml-1" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{chatUser.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No friends to chat with
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Add friends to start chatting
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <img
                    src={activeChat.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.user.displayName || 'User')}&background=3b82f6&color=ffffff&size=32`}
                    alt={activeChat.user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activeChat.user.displayName}
                      </p>
                      <VerifiedBadge username={activeChat.user.username} className="w-4 h-4 ml-1" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{activeChat.user.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.senderId === user.uid
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user.uid
                          ? 'text-blue-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Select a user to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatManager;