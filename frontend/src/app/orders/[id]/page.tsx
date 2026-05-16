'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function OrderWorkspace() {
  const { id } = useParams();
  const { user, accessToken } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch Order and Chat History
    const fetchOrder = async () => {
      try {
        const { data: orderData } = await api.get(`/api/orders/${id}`);
        setOrder(orderData);
        if (orderData.chatRoom) {
          const { data: chatHistory } = await api.get(`/api/chat/${orderData.chatRoom.id}`);
          setMessages(chatHistory);
        }
      } catch (e) {
        console.error('Failed to fetch order', e);
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    // 2. Connect to Socket.IO
    if (!order?.chatRoom?.id || !accessToken) return;

    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/chat', {
      auth: { token: accessToken }
    });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join_room', order.chatRoom.id);
    });

    socketRef.current.on('new_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [order?.chatRoom?.id, accessToken]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !order?.chatRoom?.id) return;

    socketRef.current.emit('send_message', {
      roomId: order.chatRoom.id,
      content: newMessage
    });
    setNewMessage('');
  };

  if (!order) return <div className="p-12 text-center text-slate-500">Loading workspace...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Order Workspace: {order.project?.title}</h1>
        <p className="text-sm text-slate-500">
          Status: <span className="font-semibold text-indigo-600">{order.status}</span> • 
          Amount: <span className="font-semibold text-green-600">${order.amount}</span>
        </p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-8">
              No messages yet. Send a message to start chatting!
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-xl p-3 ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-4 items-center">
          <input 
            type="text" 
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Type your message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
