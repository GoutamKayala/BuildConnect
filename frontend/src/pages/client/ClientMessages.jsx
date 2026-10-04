import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/Avatar';
import {
  Send,
  User,
  MessageSquare,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldCheck,
  FileText,
  Check,
  Award,
  Sparkles,
  Plus,
  Trash2,
  CreditCard,
  Lock,
  Building2,
  QrCode,
  AlertCircle,
  Info,
  Settings,
  Smartphone,
  Landmark,
  ArrowLeft,
} from 'lucide-react';

export const ClientMessages = () => {
  const [searchParams] = useSearchParams();
  const conversationParam = searchParams.get('conversationId');
  const projectParam = searchParams.get('projectId');
  const recipientParam = searchParams.get('recipientId') || searchParams.get('workerId');

  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState(null);
  const [quoteForPayment, setQuoteForPayment] = useState(null);

  // In-App Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiClientVpa, setUpiClientVpa] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Worker Payout Settings State (Only Worker)
  const [workerPayoutInfo, setWorkerPayoutInfo] = useState(null);
  const [payoutForm, setPayoutForm] = useState({
    upiId: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'SAVINGS',
  });
  const [savingPayout, setSavingPayout] = useState(false);

  // Send Location Form State
  const [siteStreet, setSiteStreet] = useState('');
  const [siteLandmark, setSiteLandmark] = useState('');
  const [siteArea, setSiteArea] = useState('');
  const [siteCity, setSiteCity] = useState('');
  const [sitePincode, setSitePincode] = useState('');
  const [siteDate, setSiteDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [siteTime, setSiteTime] = useState('11:00 AM');
  const [siteNotes, setSiteNotes] = useState('');
  const [siteCoords, setSiteCoords] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);

  // Site Analysis Form State (Worker)
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [analysisWorkScope, setAnalysisWorkScope] = useState('');

  // Quotation Form State (Worker)
  const [quoteItems, setQuoteItems] = useState([
    { title: 'Material & Raw Supplies (Premium Asian Paints, Primer & Putty)', amount: 15000 },
    { title: 'Skilled Labour & Execution (Prep, 2 coats, trim detailing)', amount: 12000 },
  ]);
  const [quoteTimeline, setQuoteTimeline] = useState('7 - 10 Working Days');
  const [quoteNotes, setQuoteNotes] = useState('Itemized pricing based on completed physical site analysis.');

  const messagesEndRef = useRef(null);

  const currentUserId = user?._id || user?.id;
  const isWorkerRole = user?.role?.toUpperCase() === 'WORKER';

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      let convs = res.data.conversations || [];

      // If projectParam or recipientParam provided, find or create
      if (!conversationParam && (projectParam || recipientParam)) {
        let matched = convs.find(
          (c) =>
            (projectParam && (c.project?._id === projectParam || c.project === projectParam)) ||
            (recipientParam && c.participants?.some((p) => (p.user?._id || p.user)?.toString() === recipientParam.toString()))
        );

        if (!matched) {
          try {
            const createRes = await api.post('/conversations/find-or-create', {
              projectId: projectParam,
              recipientId: recipientParam,
            });
            if (createRes.data.conversation) {
              matched = createRes.data.conversation;
              convs = [matched, ...convs.filter(c => c._id !== matched._id)];
            }
          } catch (createErr) {
            console.error('Error finding or creating conversation:', createErr);
          }
        }

        if (matched) {
          setConversations(convs);
          setActiveConversation(matched);
          return;
        }
      }

      setConversations(convs);

      if (conversationParam) {
        const target = convs.find((c) => c._id === conversationParam);
        if (target) setActiveConversation(target);
        else if (convs.length > 0) setActiveConversation(convs[0]);
      } else if (convs.length > 0 && !activeConversation) {
        setActiveConversation(convs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [conversationParam, projectParam, recipientParam]);

  // Fetch messages for conversation
  const fetchMessages = async (convId) => {
    try {
      const res = await api.get(`/conversations/${convId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      if (socket) {
        socket.emit('join_conversation', activeConversation._id);
      }
    }
  }, [activeConversation, socket]);

  // Live Socket.IO Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      // 1. If it belongs to active conversation, append message
      if (activeConversation && msg.conversation?.toString() === activeConversation._id?.toString()) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // 2. Also update lastMessage in conversations list and reorder
      setConversations((prev) => {
        const convIndex = prev.findIndex((c) => c._id?.toString() === msg.conversation?.toString());
        if (convIndex !== -1) {
          const updated = [...prev];
          updated[convIndex] = {
            ...updated[convIndex],
            lastMessage: msg,
            updatedAt: new Date().toISOString(),
          };
          const [moved] = updated.splice(convIndex, 1);
          return [moved, ...updated];
        }
        return prev;
      });
    };

    const handleMessageUpdated = (msg) => {
      if (activeConversation && msg.conversation?.toString() === activeConversation._id?.toString()) {
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
      }
    };

    const handleConversationUpdated = (data) => {
      if (data?.conversationId) {
        setConversations((prev) => {
          const index = prev.findIndex((c) => c._id === data.conversationId);
          if (index !== -1) {
            const copy = [...prev];
            copy[index] = {
              ...copy[index],
              lastMessage: data.lastMessage || copy[index].lastMessage,
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
            const [item] = copy.splice(index, 1);
            return [item, ...copy];
          }
          return prev;
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('conversation_updated', handleConversationUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('conversation_updated', handleConversationUpdated);
    };
  }, [socket, activeConversation]);

  // Periodic background sync for accurate real-time messages even if socket drops
  useEffect(() => {
    if (!activeConversation) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/conversations/${activeConversation._id}/messages`);
        const serverMsgs = res.data.messages || [];
        setMessages((prev) => {
          if (
            serverMsgs.length !== prev.length ||
            (serverMsgs[serverMsgs.length - 1]?._id !== prev[prev.length - 1]?._id)
          ) {
            return serverMsgs;
          }
          return prev;
        });
      } catch (e) {
        // silent sync
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeConversation?._id]);

  // Fetch worker payout settings (only for workers)
  const fetchWorkerPayoutSettings = async () => {
    if (!isWorkerRole) return;
    try {
      const res = await api.get('/workers/payout-settings');
      if (res.data.payoutInfo) {
        setWorkerPayoutInfo(res.data.payoutInfo);
        setPayoutForm({
          upiId: res.data.payoutInfo.upiId || '',
          bankName: res.data.payoutInfo.bankName || '',
          accountHolderName: res.data.payoutInfo.accountHolderName || user.name || '',
          accountNumber: res.data.payoutInfo.accountNumber || '',
          ifscCode: res.data.payoutInfo.ifscCode || '',
          accountType: res.data.payoutInfo.accountType || 'SAVINGS',
        });
      }
    } catch (e) {
      console.error('Failed to load payout settings', e);
    }
  };

  useEffect(() => {
    if (isWorkerRole) {
      fetchWorkerPayoutSettings();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    const found = conv.participants.find((p) => {
      const pId = p.user?._id || p.user;
      return pId?.toString() !== currentUserId?.toString();
    });
    return found?.user || null;
  };

  // Accurate Google Maps URL Generator
  const getAccurateGoogleMapsUrl = (locationData) => {
    if (locationData?.coordinates?.lat && locationData?.coordinates?.lng) {
      return `https://www.google.com/maps?q=${locationData.coordinates.lat},${locationData.coordinates.lng}`;
    }
    const parts = [
      locationData?.address,
      locationData?.landmark,
      locationData?.area,
      locationData?.city,
      locationData?.pincode,
    ].filter(Boolean);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConversation) return;

    const other = getOtherParticipant(activeConversation);
    const contentToSend = inputContent.trim();
    setInputContent('');

    try {
      const res = await api.post('/conversations/messages', {
        conversationId: activeConversation._id,
        recipientId: other?._id || other,
        content: contentToSend,
      });

      if (res.data.message) {
        const newMsg = res.data.message;
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c._id === activeConversation._id);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = {
              ...copy[idx],
              lastMessage: newMsg,
              updatedAt: new Date().toISOString(),
            };
            const [item] = copy.splice(idx, 1);
            return [item, ...copy];
          }
          return prev;
        });
      }
    } catch (err) {
      alert('Failed to send message: ' + (err.response?.data?.message || err.message));
      setInputContent(contentToSend);
    }
  };

  // GPS Auto-detect with High Accuracy
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSiteCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setSiteCity(addr.city || addr.town || addr.state_district || '');
            setSiteArea(addr.suburb || addr.neighbourhood || addr.road || '');
            setSitePincode(addr.postcode || '');
            if (addr.road || addr.building) {
              setSiteStreet(`${addr.building || ''} ${addr.road || ''}`.trim());
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        console.error(err);
        alert('Could not retrieve GPS location: ' + err.message);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Send Site Location (Client Action)
  const handleSendSiteLocation = async (e) => {
    e.preventDefault();
    if (!siteStreet || !siteCity || !activeConversation) {
      alert('Please provide street address and city.');
      return;
    }

    const other = getOtherParticipant(activeConversation);
    setActionLoading(true);

    try {
      const res = await api.post('/conversations/messages', {
        conversationId: activeConversation._id,
        recipientId: other?._id || other,
        messageType: 'LOCATION_SHARE',
        content: `📍 I have shared my exact site location and requested an on-site inspection visit on ${siteDate} at ${siteTime}.`,
        locationData: {
          address: siteStreet,
          landmark: siteLandmark,
          area: siteArea,
          city: siteCity,
          pincode: sitePincode,
          coordinates: siteCoords,
          visitDate: siteDate,
          visitTime: siteTime,
          notes: siteNotes,
          status: 'PENDING',
        },
      });

      setMessages((prev) => [...prev, res.data.message]);
      setIsLocationModalOpen(false);
      // Reset fields
      setSiteStreet('');
      setSiteLandmark('');
      setSiteArea('');
      setSiteNotes('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send site location');
    } finally {
      setActionLoading(false);
    }
  };

  // Accept Site Visit (Worker Action)
  const handleAcceptSiteVisit = async (msg) => {
    setActionLoading(true);

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msg._id
          ? {
              ...m,
              locationData: {
                ...m.locationData,
                status: 'ACCEPTED',
              },
            }
          : m
      )
    );

    try {
      const res = await api.post('/conversations/messages/action', {
        messageId: msg._id,
        action: 'ACCEPT_SITE_VISIT',
      });

      if (res.data.updatedMessage) {
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? res.data.updatedMessage : m))
        );
      }
      if (res.data.reply) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.reply._id)) return prev;
          return [...prev, res.data.reply];
        });
      }
      alert('✅ Site visit accepted! Inspection is now confirmed for the scheduled date.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept site visit');
      // Rollback optimistic update
      fetchMessages(activeConversation._id);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Site Analysis (Worker Action)
  const handleSubmitSiteAnalysis = async (e) => {
    e.preventDefault();
    if (!selectedMessageForAction) return;

    setActionLoading(true);
    try {
      const res = await api.post('/conversations/messages/action', {
        messageId: selectedMessageForAction._id,
        action: 'COMPLETE_SITE_ANALYSIS',
        payload: {
          notes: analysisNotes,
          workScope: analysisWorkScope,
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m._id === selectedMessageForAction._id
            ? res.data.updatedMessage || {
                ...m,
                locationData: {
                  ...m.locationData,
                  status: 'VISITED',
                  siteAnalysis: { inspectedAt: new Date(), notes: analysisNotes, workScope: analysisWorkScope },
                },
              }
            : m
        )
      );
      if (res.data.reply) {
        setMessages((prev) => [...prev, res.data.reply]);
      }
      setIsAnalysisModalOpen(false);
      setAnalysisNotes('');
      setAnalysisWorkScope('');
      alert('✅ On-site inspection and measurements successfully recorded!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit site analysis');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Worker Payout Info (Only Worker)
  const handleSavePayoutSettings = async (e) => {
    e.preventDefault();
    setSavingPayout(true);
    try {
      const res = await api.post('/workers/payout-settings', payoutForm);
      setWorkerPayoutInfo(res.data.payoutInfo);
      setIsPayoutModalOpen(false);
      alert('✅ Payout account settings saved! Escrow releases will be disbursed to this verified destination.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save payout settings');
    } finally {
      setSavingPayout(false);
    }
  };

  // Submit Transparent Quotation (Worker Action)
  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    if (!activeConversation) return;

    const subtotal = quoteItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    if (subtotal <= 0) {
      alert('Please enter valid items and amounts.');
      return;
    }

    const platformFee = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + platformFee;

    setActionLoading(true);

    try {
      const res = await api.post('/conversations/messages/action', {
        messageId: selectedMessageForAction?._id || messages[messages.length - 1]?._id,
        action: 'SUBMIT_QUOTATION',
        payload: {
          items: quoteItems,
          grandTotal: subtotal,
          timeline: quoteTimeline,
          notes: quoteNotes,
        },
      });

      if (res.data.reply) {
        setMessages((prev) => [...prev, res.data.reply]);
      }
      setIsQuotationModalOpen(false);
      alert(`📋 Transparent quotation sent! Subtotal: ₹${subtotal.toLocaleString()} + Platform Fee (5%): ₹${platformFee.toLocaleString()} | Client Total: ₹${grandTotal.toLocaleString()}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit quotation');
    } finally {
      setActionLoading(false);
    }
  };

  // Open In-App Payment Modal (Client Action)
  const handleOpenPaymentModal = (quoteMsg) => {
    setQuoteForPayment(quoteMsg);
    setIsPaymentModalOpen(true);
  };

  // Execute In-App Payment & Finalize Deal (Client Action)
  const handleProcessInAppPayment = async (e) => {
    e.preventDefault();
    if (!quoteForPayment) return;

    setPaymentProcessing(true);
    try {
      const res = await api.post('/conversations/messages/action', {
        messageId: quoteForPayment._id,
        action: 'FINALIZE_DEAL',
        payload: {
          paymentMethod,
          clientUpi: paymentMethod === 'UPI' ? upiClientVpa : undefined,
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m._id === quoteForPayment._id
            ? {
                ...m,
                quotationData: {
                  ...m.quotationData,
                  status: 'ACCEPTED',
                  paymentStatus: 'ESCROW_LOCKED',
                  acceptedAt: new Date(),
                },
              }
            : m
        )
      );

      if (res.data.reply) {
        setMessages((prev) => [...prev, res.data.reply]);
      }

      setIsPaymentModalOpen(false);
      setQuoteForPayment(null);
      alert('🎉 In-App Payment Successful! Funds are locked in Platform Escrow and digital agreement is signed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const otherUser = getOtherParticipant(activeConversation);

  // Derived calculations for quotation modal
  const modalSubtotal = quoteItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const modalPlatformFee = Math.round(modalSubtotal * 0.05);
  const modalGrandTotal = modalSubtotal + modalPlatformFee;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden h-[calc(100vh-10rem)] md:h-[84vh] flex flex-col md:flex-row">
        {/* Left Conversations Sidebar */}
        <div className={`w-full md:w-80 border-r border-slate-200 bg-slate-50 flex-col ${activeConversation ? 'hidden md:flex' : 'flex flex-1 md:flex-none'}`}>
          <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Messages & Negotiations</span>
            </div>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active conversations yet. Visit Find Workers to start a conversation.
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = activeConversation?._id === conv._id;

                return (
                  <div
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-4 cursor-pointer hover:bg-slate-100 transition flex items-center gap-3 ${
                      isActive ? 'bg-white font-bold border-l-4 border-blue-600 shadow-sm' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar
                        src={other?.avatarUrl}
                        name={other?.name}
                        size="md"
                        className="border border-slate-200"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-900 truncate font-bold">{other?.name || 'Contact'}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {other?.role?.toLowerCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.project?.title || 'Direct Consultation & Deal'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Workspace */}
        <div className={`flex-1 flex-col bg-white ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Header with Actions */}
              <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveConversation(null)}
                    className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg md:hidden transition"
                    title="Back to Conversations"
                    aria-label="Back to Conversations"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <Avatar
                    src={otherUser?.avatarUrl}
                    name={otherUser?.name}
                    size="md"
                    className="border border-slate-300"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm truncate max-w-[120px] sm:max-w-none">{otherUser?.name || 'Participant'}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-100">
                        {otherUser?.role === 'WORKER' ? 'Pro' : 'Client'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-none">
                      {otherUser?.city ? `📍 ${otherUser.city}` : 'BuildConnect Secure Chat'}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  {user?.role === 'CLIENT' && (
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 transition"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Send Site Location</span>
                    </button>
                  )}

                  {isWorkerRole && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsPayoutModalOpen(true)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition"
                        title="Configure your verified Bank Account or UPI ID"
                      >
                        <Landmark className="w-3.5 h-3.5 text-blue-600" />
                        <span>Payout Setup (Bank/UPI)</span>
                        {workerPayoutInfo?.isConfigured && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMessageForAction(null);
                          setIsQuotationModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Submit Deal Quotation</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm space-y-2">
                    <p className="font-medium">No messages yet in this discussion.</p>
                    <p className="text-xs text-slate-500">
                      Discuss project requirements, budget, materials, and share site location for a physical inspection.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine =
                      (msg.sender?._id || msg.sender)?.toString() === currentUserId?.toString();

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* 1. LOCATION SHARE CARD */}
                        {msg.messageType === 'LOCATION_SHARE' && msg.locationData ? (
                          <div className="max-w-lg w-full bg-white rounded-3xl border-2 border-emerald-200 shadow-md p-5 space-y-4 text-slate-800">
                            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-sm text-slate-900">Site Location & Inspection</h4>
                                  <p className="text-[10px] text-slate-500">
                                    {isMine ? 'You shared site details' : 'Client shared site details'}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  msg.locationData.status === 'VISITED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : msg.locationData.status === 'ACCEPTED'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {msg.locationData.status === 'VISITED'
                                  ? 'Site Visited & Analyzed'
                                  : msg.locationData.status === 'ACCEPTED'
                                  ? 'Visit Confirmed'
                                  : 'Inspection Scheduled'}
                              </span>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                <div className="text-[10px] font-bold uppercase text-slate-500">Site Address</div>
                                <div className="font-bold text-slate-900 leading-snug">
                                  {msg.locationData.address}, {msg.locationData.area && `${msg.locationData.area}, `}
                                  {msg.locationData.city} {msg.locationData.pincode && `- ${msg.locationData.pincode}`}
                                </div>
                                {msg.locationData.landmark && (
                                  <div className="text-[11px] text-slate-500">
                                    Landmark: <strong>{msg.locationData.landmark}</strong>
                                  </div>
                                )}
                              </div>

                              {/* Interactive Pinpoint Map Preview */}
                              {msg.locationData.coordinates?.lat && msg.locationData.coordinates?.lng && (
                                <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-inner bg-slate-100 relative">
                                  <iframe
                                    title="Exact Site Location Pinpoint"
                                    width="100%"
                                    height="180"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight="0"
                                    marginWidth="0"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(msg.locationData.coordinates.lng) - 0.005}%2C${Number(msg.locationData.coordinates.lat) - 0.004}%2C${Number(msg.locationData.coordinates.lng) + 0.005}%2C${Number(msg.locationData.coordinates.lat) + 0.004}&layer=mapnik&marker=${msg.locationData.coordinates.lat}%2C${msg.locationData.coordinates.lng}`}
                                    className="w-full h-44 rounded-2xl"
                                  />
                                  <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    <span>Exact GPS Spot: {Number(msg.locationData.coordinates.lat).toFixed(5)}, {Number(msg.locationData.coordinates.lng).toFixed(5)}</span>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" /> Preferred Date
                                  </div>
                                  <div className="font-bold text-slate-800 mt-0.5">
                                    {msg.locationData.visitDate
                                      ? new Date(msg.locationData.visitDate).toLocaleDateString()
                                      : 'Flexible'}
                                  </div>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" /> Time Slot
                                  </div>
                                  <div className="font-bold text-slate-800 mt-0.5">
                                    {msg.locationData.visitTime || '11:00 AM'}
                                  </div>
                                </div>
                              </div>

                              {msg.locationData.notes && (
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                                  <strong className="text-slate-800">Inspection Notes:</strong> {msg.locationData.notes}
                                </div>
                              )}
                            </div>

                            {/* On-Site Analysis Findings Box */}
                            {msg.locationData.siteAnalysis && (
                              <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl space-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>On-Site Analysis & Measurements Recorded</span>
                                </div>
                                <p className="text-slate-700 text-xs">
                                  <strong>Inspection Summary:</strong> {msg.locationData.siteAnalysis.notes}
                                </p>
                                {msg.locationData.siteAnalysis.workScope && (
                                  <p className="text-slate-700 text-xs">
                                    <strong>Work Scope:</strong> {msg.locationData.siteAnalysis.workScope}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Card Actions */}
                            <div className="pt-2 flex flex-wrap gap-2">
                              {/* 100% Accurate Google Maps Pinpoint Link */}
                              <a
                                href={getAccurateGoogleMapsUrl(msg.locationData)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-200"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Open Exact Spot in Google Maps
                              </a>

                              {/* Worker Action Buttons */}
                              {(!isMine || isWorkerRole) && (
                                <>
                                  {msg.locationData.status === 'PENDING' && (
                                    <button
                                      type="button"
                                      disabled={actionLoading}
                                      onClick={() => handleAcceptSiteVisit(msg)}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-emerald-500/20 active:scale-95 cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Accept Site Visit & Confirm
                                    </button>
                                  )}

                                  {msg.locationData.status === 'ACCEPTED' && isWorkerRole && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMessageForAction(msg);
                                        setIsAnalysisModalOpen(true);
                                      }}
                                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-blue-500/20"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" /> Mark Visited & Record Work Analysis
                                    </button>
                                  )}

                                  {msg.locationData.status === 'VISITED' && isWorkerRole && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMessageForAction(msg);
                                        setIsQuotationModalOpen(true);
                                      }}
                                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-indigo-500/20"
                                    >
                                      <FileText className="w-3.5 h-3.5" /> Submit Transparent Quotation
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ) : msg.messageType === 'QUOTATION' && msg.quotationData ? (
                          /* 2. TRANSPARENT ITEMISED QUOTATION & DEAL PROPOSAL CARD */
                          <div className="max-w-lg w-full bg-white rounded-3xl border-2 border-blue-200 shadow-lg p-5 space-y-4 text-slate-800">
                            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-sm text-slate-900">
                                    Official Deal Quotation & Proposal
                                  </h4>
                                  <p className="text-[10px] text-slate-500">{msg.quotationData.quoteNumber || 'QT-CONTRACT'}</p>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  msg.quotationData.status === 'ACCEPTED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {msg.quotationData.status === 'ACCEPTED'
                                  ? 'Deal Finalized & Escrow Locked'
                                  : 'Awaiting Client Approval'}
                              </span>
                            </div>

                            {/* Transparent Price & Fee Breakdown */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                              {/* Itemized Line Items */}
                              {msg.quotationData.items && msg.quotationData.items.length > 0 && (
                                <div className="space-y-1.5 text-xs pb-3 border-b border-slate-200/80">
                                  <div className="text-[10px] font-bold uppercase text-slate-400">Itemized Work & Materials</div>
                                  {msg.quotationData.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between text-slate-700">
                                      <span>{it.title}</span>
                                      <span className="font-bold">₹{Number(it.amount || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Transparent Fee Summary */}
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-600">
                                  <span>Worker Quote Subtotal:</span>
                                  <span className="font-bold">
                                    ₹{(msg.quotationData.subtotal || msg.quotationData.totalAmount || 0).toLocaleString()}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center text-blue-800 bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                                  <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <div className="font-bold text-[11px]">Platform Secure Escrow & Maintenance Fee (5%)</div>
                                      <div className="text-[9px] text-blue-600 leading-tight">
                                        Escrow protection, milestone verification & dispute resolution guarantee
                                      </div>
                                    </div>
                                  </div>
                                  <span className="font-black text-xs text-blue-700">
                                    +₹{(msg.quotationData.platformFee || Math.round((msg.quotationData.totalAmount || 0) * 0.05)).toLocaleString()}
                                  </span>
                                </div>

                                <div className="pt-2 border-t border-slate-200 flex justify-between items-end">
                                  <div>
                                    <div className="text-[10px] font-bold uppercase text-slate-400">Total Payable by Client</div>
                                    <div className="text-2xl font-black text-slate-900">
                                      ₹{((msg.quotationData.subtotal || msg.quotationData.totalAmount || 0) + (msg.quotationData.platformFee || Math.round((msg.quotationData.totalAmount || 0) * 0.05))).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase text-slate-400">Execution Timeline</div>
                                    <div className="text-xs font-bold text-slate-700">
                                      {msg.quotationData.timeline || '7 - 10 Working Days'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Worker Payout Destination Transparency */}
                              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                                <Landmark className="w-3.5 h-3.5 text-slate-500" />
                                <span>
                                  Worker Payout Account:{' '}
                                  <strong className="text-slate-800">
                                    {msg.quotationData.workerPayoutInfo?.upiId
                                      ? `UPI: ${msg.quotationData.workerPayoutInfo.upiId}`
                                      : msg.quotationData.workerPayoutInfo?.bankName
                                      ? `${msg.quotationData.workerPayoutInfo.bankName} ${msg.quotationData.workerPayoutInfo.accountMasked || ''}`
                                      : 'Verified Professional Account'}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Client Finalize & In-App Payment Action */}
                            {user?.role === 'CLIENT' && msg.quotationData.status !== 'ACCEPTED' && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleOpenPaymentModal(msg)}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Lock className="w-4 h-4" />
                                <span>
                                  Accept Quotation & Pay via In-App Escrow (₹
                                  {((msg.quotationData.subtotal || msg.quotationData.totalAmount || 0) + (msg.quotationData.platformFee || Math.round((msg.quotationData.totalAmount || 0) * 0.05))).toLocaleString()}
                                  )
                                </span>
                              </button>
                            )}

                            {msg.quotationData.status === 'ACCEPTED' && (
                              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Deal Finalized. Payment securely held in Escrow for milestone release.</span>
                              </div>
                            )}
                          </div>
                        ) : msg.messageType === 'DEAL_FINALIZED' ? (
                          /* 3. DEAL FINALIZED CELEBRATION CARD */
                          <div className="max-w-lg w-full bg-gradient-to-tr from-emerald-700 to-teal-800 text-white rounded-3xl shadow-xl p-6 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                <Sparkles className="w-6 h-6 text-amber-300" />
                              </div>
                              <div>
                                <h3 className="font-black text-lg">DEAL FINALIZED & ESCROW FUNDED!</h3>
                                <p className="text-emerald-100 text-xs">Contract signed & in-app payment locked in Escrow</p>
                              </div>
                            </div>
                            <p className="text-xs text-emerald-50 leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div className="pt-2 flex items-center justify-between border-t border-white/20 text-xs font-bold text-emerald-100">
                              <span>🛡️ Milestone Escrow Active</span>
                              {msg.project && (
                                <Link
                                  to={isWorkerRole ? `/worker/projects/${msg.project}` : `/client/projects/${msg.project}`}
                                  className="underline hover:text-white"
                                >
                                  View Project Milestones &rarr;
                                </Link>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* 4. STANDARD TEXT BUBBLE */
                          <div
                            className={`max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20'
                                : 'bg-white text-slate-900 rounded-bl-none border border-slate-200 shadow-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <div
                              className={`text-[10px] mt-1 text-right ${
                                isMine ? 'text-blue-200' : 'text-slate-400'
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex items-center gap-3 bg-white">
                <input
                  type="text"
                  placeholder="Type a message or discuss work pricing..."
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm p-6 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <p className="font-semibold text-slate-600">Select a conversation or worker to start messaging</p>
              <p className="text-xs max-w-sm">
                Discuss pricing, share site locations, schedule inspections, and finalize project agreements with verified professionals.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: SEND SITE LOCATION & BOOK INSPECTION (Client) */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="📍 Send Site Location & Schedule On-Site Inspection"
      >
        <form onSubmit={handleSendSiteLocation} className="space-y-4">
          <p className="text-xs text-slate-500">
            Share your site address so <strong>{otherUser?.name || 'the professional'}</strong> can visit, take measurements, analyze the work, and prepare an itemized deal quotation.
          </p>

          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detectingGps}
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-2 transition"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            {detectingGps ? 'Detecting High-Accuracy GPS...' : 'Auto-Detect My Current GPS Location'}
          </button>

          {siteCoords && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <span className="font-bold">
                📍 Pinpoint GPS: {Number(siteCoords.lat).toFixed(6)}, {Number(siteCoords.lng).toFixed(6)}
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                Accurate to ~3m
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Site Address (Flat / House No., Building, Street) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Flat 304, Green Heights, Road 36"
                value={siteStreet}
                onChange={(e) => setSiteStreet(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Landmark</label>
              <input
                type="text"
                placeholder="e.g. Near Metro Pillar 124"
                value={siteLandmark}
                onChange={(e) => setSiteLandmark(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Area / Locality</label>
              <input
                type="text"
                placeholder="e.g. Jubilee Hills"
                value={siteArea}
                onChange={(e) => setSiteArea(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="City"
                value={siteCity}
                onChange={(e) => setSiteCity(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pincode</label>
              <input
                type="text"
                placeholder="e.g. 500033"
                value={sitePincode}
                onChange={(e) => setSitePincode(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Visit Date *</label>
              <input
                type="date"
                required
                value={siteDate}
                onChange={(e) => setSiteDate(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Time *</label>
              <select
                value={siteTime}
                onChange={(e) => setSiteTime(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="10:00 AM">Morning (10:00 AM)</option>
                <option value="11:30 AM">Late Morning (11:30 AM)</option>
                <option value="02:30 PM">Afternoon (02:30 PM)</option>
                <option value="04:30 PM">Evening (04:30 PM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inspection Notes / Scope</label>
            <textarea
              rows={2}
              placeholder="e.g. Please bring measuring tape for modular kitchen space and check dampness on bedroom wall."
              value={siteNotes}
              onChange={(e) => setSiteNotes(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {actionLoading ? 'Sending Location...' : 'Send Location to Worker in Chat'}
          </button>
        </form>
      </Modal>

      {/* MODAL 2: RECORD SITE INSPECTION WORK ANALYSIS (Worker) */}
      <Modal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        title="🔍 Record On-Site Inspection & Work Analysis"
      >
        <form onSubmit={handleSubmitSiteAnalysis} className="space-y-4">
          <p className="text-xs text-slate-500">
            Document your on-site inspection findings, room dimensions, surface conditions, and required labor/materials for the client.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Site Inspection Summary & Observations *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Visited the 1200 sq.ft 3BHK flat. Walls require scraping, 2 coats of Birla White putty, 1 coat primer, and Asian Paints Royale Luxury. Living room false ceiling requires minor gypsum board repair."
              value={analysisNotes}
              onChange={(e) => setAnalysisNotes(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Scope of Work & Technical Assessment *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Total surface area: ~3,400 sq.ft. Recommended paint: Royale Shyne Emulsion. Estimated team: 3 painters for 6 working days."
              value={analysisWorkScope}
              onChange={(e) => setAnalysisWorkScope(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {actionLoading ? 'Saving Analysis...' : 'Mark Site Visited & Post Analysis in Chat'}
          </button>
        </form>
      </Modal>

      {/* MODAL 3: SUBMIT TRANSPARENT ITEMIZED QUOTATION (Worker) */}
      <Modal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        title="📋 Generate Transparent Deal Quotation & Agreement"
      >
        <form onSubmit={handleSubmitQuotation} className="space-y-4">
          <p className="text-xs text-slate-500">
            Provide transparent itemized pricing for materials and skilled labor analyzed during your site inspection.
          </p>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase">
              <span>Itemized Cost Items</span>
              <button
                type="button"
                onClick={() => setQuoteItems([...quoteItems, { title: '', amount: 0 }])}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {quoteItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Paint materials (Asian Paints 50L)"
                  value={item.title}
                  onChange={(e) => {
                    const newItems = [...quoteItems];
                    newItems[idx].title = e.target.value;
                    setQuoteItems(newItems);
                  }}
                  className="flex-1 p-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
                <div className="w-32 relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => {
                      const newItems = [...quoteItems];
                      newItems[idx].amount = Number(e.target.value) || 0;
                      setQuoteItems(newItems);
                    }}
                    className="w-full pl-6 pr-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                {quoteItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                    className="p-2 text-slate-400 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Transparent Calculation Breakdown */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>Your Base Quote Subtotal:</span>
              <span className="font-bold">₹{modalSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-blue-700 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Platform Secure Maintenance Charge (5%):
              </span>
              <span className="font-bold">+₹{modalPlatformFee.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>Total Client Will Pay in App:</span>
              <span className="text-base text-blue-700">₹{modalGrandTotal.toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              💡 You will receive <strong>100% of your subtotal (₹{modalSubtotal.toLocaleString()})</strong> directly to your registered payout account upon milestone completion.
            </div>
          </div>

          {/* Worker Payout Info Check */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900">
              <Landmark className="w-4 h-4 text-amber-700" />
              <div>
                <span className="font-bold">Your Registered Payout Destination:</span>
                <div className="text-[11px] text-amber-800">
                  {workerPayoutInfo?.upiId
                    ? `UPI: ${workerPayoutInfo.upiId}`
                    : workerPayoutInfo?.bankName
                    ? `${workerPayoutInfo.bankName} (•••• ${workerPayoutInfo.accountNumber?.slice(-4)})`
                    : 'No Bank/UPI added yet.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPayoutModalOpen(true)}
              className="text-blue-700 font-bold underline hover:text-blue-900 text-xs"
            >
              Update Payout
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Execution Timeline</label>
              <input
                type="text"
                required
                placeholder="e.g. 7 - 10 Working Days"
                value={quoteTimeline}
                onChange={(e) => setQuoteTimeline(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Milestones / Terms</label>
              <input
                type="text"
                placeholder="e.g. 30% Site Setup, 40% Execution, 30% Finishing"
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            {actionLoading ? 'Submitting Quotation...' : 'Send Transparent Quotation to Client'}
          </button>
        </form>
      </Modal>

      {/* MODAL 4: IN-APP PAYMENT ONLY & ESCROW CHECKOUT (Client) */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="🔒 Secure In-App Payment & Escrow Activation"
      >
        <form onSubmit={handleProcessInAppPayment} className="space-y-4">
          <p className="text-xs text-slate-500">
            All payments must be made strictly through the BuildConnect application. Funds are protected in milestone escrow and only disbursed when you approve completed work.
          </p>

          {quoteForPayment && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Contracted Labor & Materials:</span>
                <span className="font-bold">
                  ₹{(quoteForPayment.quotationData?.subtotal || quoteForPayment.quotationData?.totalAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-blue-800 bg-blue-50/80 p-2.5 rounded-xl border border-blue-100">
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Platform Secure Maintenance & Escrow Charge (5%)
                  </div>
                  <div className="text-[10px] text-blue-600">
                    Milestone protection, verified worker payout guarantee & dispute coverage
                  </div>
                </div>
                <span className="font-bold">
                  +₹{(quoteForPayment.quotationData?.platformFee || Math.round((quoteForPayment.quotationData?.totalAmount || 0) * 0.05)).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount to Authorize:</span>
                <span className="text-xl text-emerald-600 font-black">
                  ₹{((quoteForPayment.quotationData?.subtotal || quoteForPayment.quotationData?.totalAmount || 0) + (quoteForPayment.quotationData?.platformFee || Math.round((quoteForPayment.quotationData?.totalAmount || 0) * 0.05))).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Escrow Guarantee Banner */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">100% Escrow Milestone Protection Active</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Your payment is held safely in platform escrow. The worker is paid in 3 milestone disbursements only after you physically inspect and approve each stage.
              </p>
            </div>
          </div>

          {/* Payment Method Selector (In-App Only) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Select In-App Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'UPI'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">UPI (Instant)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Card Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'NETBANKING'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Landmark className="w-5 h-5 text-purple-600" />
                <span className="text-xs">Net Banking</span>
              </button>
            </div>
          </div>

          {/* Conditional Payment Method Input */}
          {paymentMethod === 'UPI' && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Enter Client UPI ID (Google Pay / PhonePe / Paytm / BHIM)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank"
                  value={upiClientVpa}
                  onChange={(e) => setUpiClientVpa(e.target.value)}
                  className="flex-1 p-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setUpiClientVpa('client@upi')}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded-xl font-bold hover:bg-slate-300"
                >
                  Use Demo UPI
                </button>
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="text"
                placeholder="Card Number (Visa / MasterCard / RuPay)"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  className="p-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
                <input
                  type="password"
                  maxLength={3}
                  placeholder="CVV"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                  className="p-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'NETBANKING' && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase">Select Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="HDFC">HDFC Bank</option>
                <option value="SBI">State Bank of India (SBI)</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="AXIS">Axis Bank</option>
                <option value="KOTAK">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={paymentProcessing}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            {paymentProcessing
              ? 'Processing Secure In-App Payment...'
              : `Authorize & Lock in Escrow (₹${((quoteForPayment?.quotationData?.subtotal || quoteForPayment?.quotationData?.totalAmount || 0) + (quoteForPayment?.quotationData?.platformFee || Math.round((quoteForPayment?.quotationData?.totalAmount || 0) * 0.05))).toLocaleString()})`}
          </button>
        </form>
      </Modal>

      {/* MODAL 5: WORKER PAYOUT SETUP (Only Worker Can Access) */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title="💳 Worker Payout Setup (Bank Account & UPI ID)"
      >
        <form onSubmit={handleSavePayoutSettings} className="space-y-4">
          <p className="text-xs text-slate-500">
            Configure where BuildConnect will disburse your milestone payouts once approved by the client. Only you have control over this payout destination.
          </p>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>
              Secure Disbursement: The platform charges a 5% secure maintenance fee to the client, guaranteeing 100% of your quote subtotal is paid directly to your Bank or UPI.
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                UPI ID (Google Pay, PhonePe, Paytm, BHIM)
              </label>
              <input
                type="text"
                placeholder="e.g. yourname@upi or 9876543210@paytm"
                value={payoutForm.upiId}
                onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="text-center font-bold text-slate-400 text-xs uppercase">— OR DIRECT BANK TRANSFER —</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={payoutForm.bankName}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Name as per Passbook"
                  value={payoutForm.accountHolderName}
                  onChange={(e) => setPayoutForm({ ...payoutForm, accountHolderName: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Number</label>
                <input
                  type="password"
                  placeholder="e.g. 5010023456789"
                  value={payoutForm.accountNumber}
                  onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={payoutForm.ifscCode}
                  onChange={(e) => setPayoutForm({ ...payoutForm, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Type</label>
              <select
                value={payoutForm.accountType}
                onChange={(e) => setPayoutForm({ ...payoutForm, accountType: e.target.value })}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="SAVINGS">Savings Account</option>
                <option value="CURRENT">Current / Business Account</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPayout}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {savingPayout ? 'Saving Payout Settings...' : 'Save Payout Details'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
