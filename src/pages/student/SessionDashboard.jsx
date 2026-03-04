import { useState, useEffect } from 'react';
import { 
  User, 
  Monitor, 
  MapPin, 
  Clock, 
  UserCircle,
  Megaphone,
  Ticket,
  CheckCircle,
  HelpCircle,
  FileText,
  ChevronRight,
  MessageCircle,
  X,
  Send,
  Search
} from 'lucide-react';
import { mockStudentSession, mockAnnouncements } from '../../data/mockStudentData';

function SessionDashboard() {
  // Get actual user data from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  
  const [sessionStartTime] = useState(() => {
    // Store session start time when component mounts
    const stored = sessionStorage.getItem('sessionStartTime');
    if (stored) return new Date(stored);
    const now = new Date();
    sessionStorage.setItem('sessionStartTime', now.toISOString());
    return now;
  });
  
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  const [showChat, setShowChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Timer - update elapsed time every second
  useEffect(() => {
    const formatElapsedTime = (startTime) => {
      const now = new Date();
      const diff = now - startTime;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCurrentDate(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      setElapsedTime(formatElapsedTime(sessionStartTime));
    }, 1000); // Update every second
    
    // Initial calculation
    setElapsedTime(formatElapsedTime(sessionStartTime));
    
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Mock chat data
  const mockChats = [
    {
      id: 1,
      name: 'Mr. Cruz',
      role: 'Instructor',
      avatar: 'MC',
      lastMessage: 'Please submit your lab assignment by tomorrow.',
      time: '10:30 AM',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Student 02',
      role: 'Classmate',
      avatar: 'S2',
      lastMessage: 'Hey, can you help me with the coding exercise?',
      time: '9:45 AM',
      unread: 1,
      online: true
    },
    {
      id: 3,
      name: 'Student 03',
      role: 'Classmate',
      avatar: 'S3',
      lastMessage: 'Thanks for the notes!',
      time: 'Yesterday',
      unread: 0,
      online: false
    },
    {
      id: 4,
      name: 'Lab Assistant',
      role: 'Support',
      avatar: 'LA',
      lastMessage: 'The lab will be closed for maintenance on Friday.',
      time: 'Yesterday',
      unread: 0,
      online: false
    }
  ];

  const mockMessages = [
    { id: 1, sender: 'Mr. Cruz', message: 'Good morning class!', time: '8:00 AM', isMe: false },
    { id: 2, sender: 'Me', message: 'Good morning sir!', time: '8:05 AM', isMe: true },
    { id: 3, sender: 'Mr. Cruz', message: 'Please submit your lab assignment by tomorrow.', time: '10:30 AM', isMe: false },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessageInput('');
    }
  };

  const filteredChats = mockChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Session Dashboard</h1>
        <p className="text-gray-500">View your current lab session and assigned seat information</p>
      </div>

      {/* Welcome Banner */}
      <div className="bg-blue-50 rounded-xl p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Welcome, {currentUser?.fullName || currentUser?.username || 'Student'}!</p>
            <p className="text-sm text-gray-500">Your session started at {sessionStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} on {currentDate}</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Laboratory Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Laboratory</span>
            <Monitor className="w-5 h-5 text-blue-500" />
          </div>
          <p className="font-semibold text-gray-900">{mockStudentSession.labName}</p>
          <p className="text-xs text-gray-400">Current location</p>
        </div>

        {/* Assigned Seat Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Assigned Seat</span>
            <MapPin className="w-5 h-5 text-green-500" />
          </div>
          <p className="font-semibold text-gray-900">Seat {mockStudentSession.seatNumber}</p>
          <p className="text-xs text-gray-400">{mockStudentSession.pcName}</p>
        </div>

        {/* Session Duration Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Session Duration</span>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="font-semibold text-gray-900">{elapsedTime}</p>
          <p className="text-xs text-gray-400">Elapsed time</p>
        </div>

        {/* Instructor Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Instructor</span>
            <UserCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="font-semibold text-gray-900">{mockStudentSession.instructor}</p>
          <p className="text-xs text-gray-400">Course facilitator</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Announcements */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6 text-blue-600" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">2</span>
            </div>
            <p className="font-medium text-gray-900">Announcements</p>
            <p className="text-xs text-gray-400">2 unread</p>
          </div>

          {/* Chats */}
          <div 
            onClick={() => setShowChat(true)}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow relative"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-purple-600" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </div>
            <p className="font-medium text-gray-900">Chats</p>
            <p className="text-xs text-gray-400">3 messages</p>
          </div>

          {/* Submit Ticket */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-6 h-6 text-orange-600" />
            </div>
            <p className="font-medium text-gray-900">Submit Ticket</p>
            <p className="text-xs text-gray-400">Report issues</p>
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-gray-900">Attendance</p>
            <p className="text-xs text-gray-400">Confirm presence</p>
          </div>

          {/* Help Request */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6 text-purple-600" />
            </div>
            <p className="font-medium text-gray-900">Help Request</p>
            <p className="text-xs text-gray-400">Ask instructor</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <span className="text-xs text-gray-400">4 items</span>
          </div>
          <div className="p-5">
            {mockAnnouncements.map((announcement) => (
              <div key={announcement.id} className="flex items-start mb-4 last:mb-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{announcement.title}</p>
                  <p className="text-sm text-gray-500">{announcement.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{announcement.time}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Session Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm font-medium text-gray-900">{currentDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subject</span>
              <span className="text-sm font-medium text-gray-900">{mockStudentSession.subject}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Section</span>
              <span className="text-sm font-medium text-gray-900">{mockStudentSession.section}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Duration</span>
              <span className="text-sm font-medium text-gray-900">{mockStudentSession.sessionDuration}</span>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">Session active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[600px] flex">
            {/* Chat List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                  <button onClick={() => setShowChat(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {chat.avatar}
                        </div>
                        {chat.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 text-sm">{chat.name}</p>
                          <span className="text-xs text-gray-500">{chat.time}</span>
                        </div>
                        <p className="text-xs text-gray-500">{chat.role}</p>
                        <p className="text-xs text-gray-600 truncate mt-1">{chat.lastMessage}</p>
                      </div>
                      {chat.unread > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b border-gray-200 flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {selectedChat.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedChat.name}</p>
                      <p className="text-xs text-gray-500">{selectedChat.role}</p>
                    </div>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    {mockMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`mb-4 ${message.isMe ? 'text-right' : 'text-left'}`}
                      >
                        <div
                          className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
                            message.isMe
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${message.isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Select a chat to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionDashboard;
