
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  ShieldAlert, 
  ChevronRight, 
  ArrowUp, 
  LogOut,
  Camera,
  MapPin,
  Mic,
  Send,
  ThumbsUp,
  Share2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  Filter,
  Users,
  Building2,
  ArrowRight,
  MessageSquare,
  Image as ImageIcon,
  Paperclip,
  X
} from 'lucide-react';
import { View, IssueCategory, IssueStatus, CivicIssue } from './types';
import { NAV_ITEMS, MOCK_ISSUES, MOCK_BUDGETS } from './constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyzeCivicReport } from './services/geminiService';

// --- Shared Map Component ---
declare const L: any;

const LeafletMap: React.FC<{ center: [number, number], zoom: number, issues?: CivicIssue[], onLocationSelect?: (lat: number, lng: number) => void }> = ({ center, zoom, issues, onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      if (issues) {
        issues.forEach(issue => {
          L.marker([issue.location.lat, issue.location.lng])
            .addTo(mapRef.current)
            .bindPopup(`<b>${issue.category}</b><br>${issue.description}`);
        });
      }

      if (onLocationSelect) {
        mapRef.current.on('click', (e: any) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom, issues]);

  return <div ref={mapContainerRef} className="leaflet-container" />;
};

// --- Sub-components ---

const Header: React.FC<{ onViewChange: (v: View) => void, currentView: View, emergencyMode: boolean }> = ({ onViewChange, currentView, emergencyMode }) => (
  <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors duration-500 ${emergencyMode ? 'bg-red-900/95 border-red-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'}`}>
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewChange('dashboard')}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20 ${emergencyMode ? 'bg-white text-red-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'}`}>
          J
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">JanSeva</h1>
          <div className="flex gap-1">
            <span className="w-2 h-0.5 bg-orange-500"></span>
            <span className="w-2 h-0.5 bg-white md:bg-slate-200"></span>
            <span className="w-2 h-0.5 bg-green-500"></span>
          </div>
          <p className={`text-[9px] font-bold uppercase tracking-widest ${emergencyMode ? 'text-red-200' : 'text-slate-400'} mt-1`}>India Civic Pulse</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <div className={`relative flex items-center px-3 py-2 rounded-full border transition-all ${emergencyMode ? 'bg-red-800/50 border-red-700' : 'bg-slate-100 border-slate-200'}`}>
          <Search size={16} className={emergencyMode ? 'text-red-300' : 'text-slate-400'} />
          <input 
            type="text" 
            placeholder="Search issues, areas..." 
            className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-64 placeholder:text-slate-400" 
          />
        </div>
        <button className="relative">
          <Bell size={20} className={emergencyMode ? 'text-red-100' : 'text-slate-600'} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 border-2 border-white rounded-full text-[8px] text-white flex items-center justify-center font-bold">3</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden cursor-pointer" onClick={() => onViewChange('profile')}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Amit" alt="Profile" />
        </div>
      </div>
    </div>
  </header>
);

const MobileNav: React.FC<{ currentView: View, onViewChange: (v: View) => void, emergencyMode: boolean }> = ({ currentView, onViewChange, emergencyMode }) => (
  <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t md:hidden h-16 flex items-center justify-around px-2 ${emergencyMode ? 'bg-red-900 border-red-800 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
    {NAV_ITEMS.map((item) => (
      <button 
        key={item.id}
        onClick={() => onViewChange(item.id)}
        className={`flex flex-col items-center gap-1 transition-all ${currentView === item.id ? (emergencyMode ? 'text-white' : 'text-blue-600') : (emergencyMode ? 'text-red-300' : 'text-slate-400')}`}
      >
        {item.icon}
        <span className="text-[10px] font-medium">{item.label}</span>
      </button>
    ))}
    <button 
      onClick={() => onViewChange('emergency')}
      className={`relative -top-4 w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white emergency-glow ${emergencyMode ? 'bg-white text-red-600' : 'bg-red-600'}`}
    >
      <ShieldAlert size={24} />
    </button>
  </nav>
);

// --- Detail View Component ---

const IssueDetailView: React.FC<{ issue: CivicIssue, onBack: () => void, onUpvote: (id: string) => void, onJoinChat: () => void }> = ({ issue, onBack, onUpvote, onJoinChat }) => (
  <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 max-w-4xl mx-auto mb-12">
    <div className="relative h-64 md:h-80">
      <img src={issue.imageUrl} alt={issue.category} className="w-full h-full object-cover" />
      <button onClick={onBack} className="absolute top-6 left-6 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-800 shadow-lg hover:scale-110 transition-transform">
        <ChevronLeft size={20} />
      </button>
      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white drop-shadow-lg">
        <div>
          <span className="px-3 py-1 bg-blue-600/90 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest">{issue.category}</span>
          <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">{issue.location.address}</h2>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Priority Index</span>
          <span className="text-4xl font-black">{issue.priorityScore}</span>
        </div>
      </div>
    </div>

    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
      <div className="md:col-span-2 space-y-8">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Description</h3>
          <p className="text-slate-700 text-lg leading-relaxed">{issue.description}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Progress Timeline</h3>
          <div className="relative space-y-8 before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-100">
            {issue.timeline.map((entry, idx) => (
              <div key={idx} className="relative pl-10">
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${idx === 0 ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${idx === 0 ? 'text-blue-600' : 'text-slate-400'}`}>{entry.status}</span>
                  <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-600 font-medium">{entry.note}</p>
                {entry.photoUrl && (
                  <div className="mt-4 w-full h-48 rounded-2xl overflow-hidden border border-slate-100">
                    <img src={entry.photoUrl} alt="Progress verification" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Official Tracking</h4>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-slate-600">Upvotes</span>
                 <span className="font-bold text-blue-600">{issue.upvotes}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-slate-600">Verification</span>
                 <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-600 rounded-full">AI VERIFIED</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-slate-600">Status</span>
                 <span className="font-bold text-slate-800">{issue.status}</span>
              </div>
           </div>
           <div className="mt-6 pt-6 border-t border-slate-200">
              <button 
                onClick={() => onUpvote(issue.id)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <ThumbsUp size={16} /> Upvote Issue
              </button>
           </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl text-white">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Community Discussion</h4>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">42 local citizens are discussing this issue in the Area Chat.</p>
          <button 
            onClick={onJoinChat}
            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            Join Discussion
          </button>
        </div>
      </div>
    </div>
  </div>
);

// --- Main Pages ---

const DashboardPage: React.FC<{ issues: CivicIssue[], onViewChange: (v: View) => void, onSelectIssue: (i: CivicIssue) => void }> = ({ issues, onViewChange, onSelectIssue }) => {
  const stats = [
    { label: 'Reports', value: '4.5k', change: '+12%', color: 'text-blue-600' },
    { label: 'Resolved', value: '68%', change: '+5%', color: 'text-green-600' },
    { label: 'Civic CSR', value: '₹12 Cr', change: '8 Partners', color: 'text-indigo-600' },
    { label: 'Emergency', value: 'None', change: 'Stable', color: 'text-green-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <section className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-600/20">
        <div className="max-w-xl text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Welcome back, Amit.</h2>
          <p className="text-blue-100 text-sm md:text-base opacity-80 leading-relaxed">You have contributed to <span className="font-bold text-white underline underline-offset-4">5 resolved issues</span> in Rohini Sector 7. Your community ranking is in the top 5%.</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => onViewChange('report')} className="px-6 py-4 bg-white text-blue-700 rounded-2xl font-bold shadow-xl shadow-black/10 hover:scale-105 transition-transform">Report Issue</button>
           <button onClick={() => onViewChange('map')} className="px-6 py-4 bg-blue-500/30 backdrop-blur text-white border border-white/20 rounded-2xl font-bold hover:bg-white/10 transition-all">Browse Map</button>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <h3 className={`text-2xl font-black ${s.color}`}>{s.value}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{s.change}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              Priority Issues Near You
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            </h2>
            <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
               <Filter size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {issues.sort((a, b) => b.priorityScore - a.priorityScore).map((issue) => (
              <div 
                key={issue.id} 
                onClick={() => onSelectIssue(issue)}
                className="bg-white p-4 rounded-3xl border border-slate-100 flex gap-5 group hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                  <img src={issue.imageUrl} alt={issue.category} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{issue.category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter ${
                        issue.priorityScore > 8 ? 'bg-red-500 text-white' : 
                        issue.priorityScore > 5 ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        AI SCORE: {issue.priorityScore}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 line-clamp-1 leading-tight">{issue.description}</h4>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-1.5">
                      <MapPin size={12} className="text-slate-300" />
                      <span className="text-[11px] font-medium truncate">{issue.location.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                        <ThumbsUp size={14} />
                        <span className="text-[11px] font-bold">{issue.upvotes}</span>
                       </div>
                       <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                        <MessageSquare size={14} />
                        <span className="text-[11px] font-bold">12</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-black tracking-widest uppercase ${issue.status === IssueStatus.RESOLVED ? 'text-green-600' : 'text-blue-600'}`}>
                        {issue.status}
                       </span>
                       <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${issue.status === IssueStatus.RESOLVED ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${issue.progress}%` }}></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-black tracking-tight text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  NGO Activity
                </h3>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global</span>
             </div>
             <div className="space-y-4">
                {[
                  { name: 'Goonj Foundation', project: 'Bandra Waste Cleanup', icon: <Building2 /> },
                  { name: 'Smile Foundation', project: 'Rohini Water Safety', icon: <Users /> },
                  { name: 'HelpAge India', project: 'Old Delhi Lighting', icon: <Bell /> },
                ].map((ngo, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                      {ngo.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 leading-none mb-1">{ngo.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{ngo.project}</p>
                    </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all">
               PARTNER WITH US
             </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const BudgetPage: React.FC = () => {
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];
  
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Budget Transparency Dashboard</h2>
          <p className="text-slate-500 text-sm font-medium">Real-time auditing of national civic expenditure.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-[400px]">
          <h3 className="font-black text-slate-800 mb-8 uppercase tracking-widest text-xs opacity-50">Allocation vs Spent (₹ Crores)</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={MOCK_BUDGETS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: '700' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: '700' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
              />
              <Bar dataKey="allocated" fill="#f1f5f9" radius={[8, 8, 0, 0]} barSize={32} />
              <Bar dataKey="spent" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-[400px]">
          <h3 className="font-black text-slate-800 mb-8 uppercase tracking-widest text-xs opacity-50">Sector Utilization Index</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={MOCK_BUDGETS}
                innerRadius={70}
                outerRadius={110}
                paddingAngle={8}
                dataKey="status"
                nameKey="title"
                stroke="none"
              >
                {MOCK_BUDGETS.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const ReportPage: React.FC<{ onReport: (r: CivicIssue) => void }> = ({ onReport }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: IssueCategory.ROADS,
    description: '',
    address: 'Fetching current location...',
    isAnonymous: false,
    severity: 5,
    lat: 28.7041,
    lng: 77.1025,
    evidenceImage: null as string | null
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleSubmit = async () => {
    setIsAnalyzing(true);
    const result = await analyzeCivicReport(formData.description, formData.category);
    setAiResult(result);
    setIsAnalyzing(false);
    setStep(4);
  };

  const handleCamera = () => {
    // Simulating camera capture for the prototype
    setFormData(prev => ({ ...prev, evidenceImage: `https://images.unsplash.com/photo-1596434451669-02684813f380?auto=format&fit=crop&w=800&q=80` }));
  };

  const finalizeReport = () => {
    const newIssue: CivicIssue = {
      id: Math.random().toString(36).substr(2, 9),
      category: formData.category,
      description: formData.description,
      location: { lat: formData.lat, lng: formData.lng, address: formData.address },
      reporter: { name: formData.isAnonymous ? 'Anonymous' : 'Amit Sharma', isAnonymous: formData.isAnonymous },
      timestamp: Date.now(),
      priorityScore: aiResult.priorityScore,
      status: IssueStatus.REPORTED,
      upvotes: 1,
      imageUrl: formData.evidenceImage || 'https://images.unsplash.com/photo-1596434451669-02684813f380?auto=format&fit=crop&w=800&q=80',
      progress: 0,
      timeline: [{ status: IssueStatus.REPORTED, timestamp: Date.now(), note: 'Reported via JanSeva WebApp' }]
    };
    onReport(newIssue);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Voice Your Issue</h2>
        <p className="text-slate-500 font-medium italic">Empowering citizens through AI-verified civic intelligence.</p>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/50">
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-12 bg-blue-600' : 'w-6 bg-slate-100'}`}></div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
             <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">Select Category</label>
                <div className="grid grid-cols-2 gap-4">
                   {Object.values(IssueCategory).map((cat) => (
                     <button 
                       key={cat}
                       onClick={() => setFormData({...formData, category: cat})}
                       className={`px-5 py-4 rounded-2xl text-xs font-black text-left transition-all border-2 ${formData.category === cat ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
             </div>
             <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">Problem Details</label>
                <div className="relative group">
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the problem in detail..."
                    className="w-full h-40 bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 text-sm focus:bg-white focus:border-blue-200 transition-all outline-none resize-none placeholder:text-slate-300"
                  />
                </div>
             </div>
             <button 
               onClick={() => setStep(2)}
               disabled={!formData.description}
               className="w-full py-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
             >
               Next: Attach Evidence
             </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="text-center">
                <h3 className="text-2xl font-black text-slate-800 mb-2">Evidence Required</h3>
                <p className="text-slate-400 text-sm">Photos help AI verify the priority of your report.</p>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={handleCamera}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] bg-blue-50 border-2 border-blue-100 text-blue-600 hover:bg-blue-100 transition-all group"
                >
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Camera size={32} />
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest">Open Camera</span>
                </button>

                <button 
                  onClick={handleCamera}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] bg-indigo-50 border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all group"
                >
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <ImageIcon size={32} />
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest">Gallery</span>
                </button>
             </div>

             {formData.evidenceImage && (
                <div className="relative w-full h-48 rounded-[32px] overflow-hidden border-4 border-white shadow-xl animate-in zoom-in-95 duration-300">
                   <img src={formData.evidenceImage} className="w-full h-full object-cover" alt="Preview" />
                   <button 
                     onClick={() => setFormData(prev => ({ ...prev, evidenceImage: null }))}
                     className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur hover:bg-red-500 transition-colors"
                   >
                      <X size={20} />
                   </button>
                </div>
             )}

             <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black uppercase tracking-widest text-xs">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20">Next: Location</button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
              <MapPin size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">Pinpoint Location</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">{formData.address}</p>
            </div>
            
            <div className="w-full h-64 bg-slate-50 rounded-[40px] border-2 border-slate-200 overflow-hidden relative">
               <LeafletMap center={[formData.lat, formData.lng]} zoom={13} onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng, address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}` }))} />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black uppercase tracking-widest text-xs">Back</button>
              <button onClick={handleSubmit} className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20">Analyze & Submit</button>
            </div>
          </div>
        )}

        {step === 4 && (
           <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
             {isAnalyzing ? (
               <div className="py-16 space-y-6">
                  <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h3 className="text-2xl font-black text-slate-800">Gemini Intelligence Auditing...</h3>
               </div>
             ) : (
               <>
                 <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                    <CheckCircle2 size={48} />
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Analysis Complete</h3>
                 <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-left space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Index</span>
                       <span className="text-3xl font-black text-blue-600">{aiResult?.priorityScore}/10</span>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Impact Reason</span>
                       <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{aiResult?.reason}"</p>
                    </div>
                 </div>
                 <button onClick={finalizeReport} className="w-full py-5 bg-green-600 text-white rounded-[32px] font-black text-lg shadow-2xl shadow-green-500/20 hover:scale-[1.02] transition-transform">Publish Final Report</button>
               </>
             )}
           </div>
        )}
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState([
    { sender: 'Rahul K.', msg: 'The waterlogging near the metro station is getting worse. Anyone knows if the PWD started work?', time: '10:30 AM', votes: 12, isSelf: false, avatar: 'Rahul' },
    { sender: 'Anonymous', msg: 'They were there this morning, but left after 1 hour.', time: '10:35 AM', votes: 5, isSelf: false, avatar: 'Anon1' },
    { sender: 'Sriya Patel', msg: 'I suggest we start a community cleanup drive for the blocked drains this Saturday.', time: '10:45 AM', votes: 24, isSelf: false, avatar: 'Sriya' },
    { sender: 'You', msg: 'Great idea! I already reached out to Goonj Foundation.', time: '10:50 AM', votes: 0, isSelf: true, avatar: 'Amit' },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([...messages, {
      sender: 'You',
      msg: inputValue,
      time: timeStr,
      votes: 0,
      isSelf: true,
      avatar: 'Amit'
    }]);
    setInputValue('');
  };

  return (
    <div className="h-[calc(100vh-14rem)] bg-white rounded-[48px] border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[20px] flex items-center justify-center text-white font-black shadow-lg">
            DR
          </div>
          <h3 className="font-black text-slate-800 text-base">Delhi – Rohini Sector 7</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
        {messages.map((c, i) => (
          <div key={i} className={`flex flex-col ${c.isSelf ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-2">
              {!c.isSelf && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar}`} className="w-6 h-6 rounded-full border border-slate-100" alt="" />}
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.sender}</span>
              <span className="text-[10px] text-slate-300 font-bold">{c.time}</span>
            </div>
            <div className={`max-w-[75%] px-6 py-4 rounded-[32px] text-sm shadow-sm leading-relaxed ${c.isSelf ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
              {c.msg}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-slate-100 bg-white">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center gap-3"
        >
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..." 
            className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-[28px] px-8 py-4 text-sm focus:bg-white focus:border-blue-200 transition-all outline-none shadow-inner"
          />
          <button 
            type="submit"
            className="w-14 h-14 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

const EmergencyOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] bg-red-950/98 flex items-center justify-center p-6 animate-in zoom-in-95 duration-500 text-white text-center">
    <div className="max-w-lg w-full space-y-12">
      <div className="w-24 h-24 bg-red-600 emergency-glow rounded-full mx-auto flex items-center justify-center shadow-2xl">
        <ShieldAlert size={56} />
      </div>
      <h2 className="text-6xl font-black uppercase italic tracking-tighter">SOS ACTIVE</h2>
      <div className="grid grid-cols-1 gap-6">
        <button className="py-8 bg-red-600 rounded-[40px] text-2xl font-black shadow-2xl">REQUEST RESCUE</button>
        <button onClick={onClose} className="py-4 text-white/40 uppercase tracking-widest font-black text-[10px]">Exit SOS Mode</button>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [issues, setIssues] = useState<CivicIssue[]>(MOCK_ISSUES);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoggedIn(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleReport = (newIssue: CivicIssue) => {
    setIssues([newIssue, ...issues]);
    setCurrentView('dashboard');
  };

  const handleUpvote = (id: string) => {
    setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, upvotes: issue.upvotes + 1 } : issue));
    if (selectedIssue && selectedIssue.id === id) setSelectedIssue({ ...selectedIssue, upvotes: selectedIssue.upvotes + 1 });
  };

  const handleJoinChat = () => { setSelectedIssue(null); setCurrentView('chat'); };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center text-white">
      <div className="max-w-sm w-full bg-white/10 backdrop-blur-2xl p-12 rounded-[56px] border border-white/20">
        <div className="w-24 h-24 bg-white rounded-[32px] mx-auto mb-10 text-blue-700 text-5xl font-black flex items-center justify-center">J</div>
        <h1 className="text-5xl font-black tracking-tighter mb-4">JanSeva</h1>
        <button onClick={() => setIsLoggedIn(true)} className="w-full py-5 bg-white text-blue-900 rounded-[28px] font-black text-lg">Enter Platform</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-24 md:pb-0 transition-colors duration-500 ${emergencyMode ? 'bg-red-950' : 'bg-slate-50'}`}>
      <Header onViewChange={(v) => { setCurrentView(v); setEmergencyMode(false); setSelectedIssue(null); }} currentView={currentView} emergencyMode={emergencyMode} />
      <main className="max-w-7xl mx-auto px-4 pt-8 md:pt-12 pb-12">
        {selectedIssue ? (
          <IssueDetailView issue={selectedIssue} onBack={() => setSelectedIssue(null)} onUpvote={handleUpvote} onJoinChat={handleJoinChat} />
        ) : (
          <>
            {currentView === 'dashboard' && <DashboardPage issues={issues} onViewChange={setCurrentView} onSelectIssue={setSelectedIssue} />}
            {currentView === 'report' && <ReportPage onReport={handleReport} />}
            {currentView === 'budget' && <BudgetPage />}
            {currentView === 'chat' && <ChatPage />}
            {currentView === 'emergency' && <div className="flex items-center justify-center h-[60vh]"><EmergencyOverlay onClose={() => { setEmergencyMode(false); setCurrentView('dashboard'); }} /></div>}
            {currentView === 'map' && (
              <div className="animate-in fade-in zoom-in-95 duration-700 h-[75vh] w-full bg-white rounded-[48px] shadow-2xl overflow-hidden">
                <LeafletMap center={[28.6139, 77.2090]} zoom={11} issues={issues} />
              </div>
            )}
          </>
        )}
      </main>
      <MobileNav currentView={currentView} onViewChange={(v) => { if (v === 'emergency') { setEmergencyMode(true); setCurrentView('emergency'); } else { setCurrentView(v); setEmergencyMode(false); setSelectedIssue(null); } }} emergencyMode={emergencyMode} />
      <button onClick={() => { setEmergencyMode(true); setCurrentView('emergency'); setSelectedIssue(null); }} className={`hidden md:flex fixed bottom-10 right-10 w-20 h-20 rounded-[32px] items-center justify-center shadow-2xl z-[60] emergency-glow ${emergencyMode ? 'bg-white text-red-600' : 'bg-red-600 text-white'}`}><ShieldAlert size={36} /></button>
    </div>
  );
};

export default App;
