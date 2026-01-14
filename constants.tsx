
import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  AlertCircle, 
  Wallet, 
  MessageSquare, 
  User, 
  ShieldAlert 
} from 'lucide-react';
import { View, IssueCategory, IssueStatus, CivicIssue, BudgetProject } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard' as View, label: 'Home', icon: <LayoutDashboard size={20} /> },
  { id: 'map' as View, label: 'Maps', icon: <MapIcon size={20} /> },
  { id: 'report' as View, label: 'Report', icon: <AlertCircle size={20} /> },
  { id: 'chat' as View, label: 'Community', icon: <MessageSquare size={20} /> },
  { id: 'budget' as View, label: 'Budget', icon: <Wallet size={20} /> },
];

export const MOCK_ISSUES: CivicIssue[] = [
  {
    id: '1',
    category: IssueCategory.ROADS,
    description: 'Major pothole near Connaught Place metro gate 2.',
    location: { lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi' },
    reporter: { name: 'Amit Sharma', isAnonymous: false },
    timestamp: Date.now() - 3600000 * 24 * 2,
    priorityScore: 7.5,
    status: IssueStatus.WIP,
    upvotes: 124,
    imageUrl: 'https://images.unsplash.com/photo-1596434451669-02684813f380?auto=format&fit=crop&w=800&q=80',
    progress: 45,
    timeline: [
      { status: IssueStatus.REPORTED, timestamp: Date.now() - 3600000 * 24 * 2, note: 'Citizen reported via Mobile App.' },
      { status: IssueStatus.ACKNOWLEDGED, timestamp: Date.now() - 3600000 * 24 * 1.5, note: 'PWD Department has assigned a supervisor.' },
      { status: IssueStatus.WIP, timestamp: Date.now() - 3600000 * 12, note: 'Contractor has arrived on site. Material filling in progress.' }
    ]
  },
  {
    id: '2',
    category: IssueCategory.WATER,
    description: 'Severe waterlogging at Rohini Sector 7 intersection after light rain.',
    location: { lat: 28.715, lng: 77.115, address: 'Rohini, Delhi' },
    reporter: { name: 'Anonymous', isAnonymous: true },
    timestamp: Date.now() - 3600000 * 5,
    priorityScore: 8.9,
    status: IssueStatus.REPORTED,
    upvotes: 45,
    imageUrl: 'https://images.unsplash.com/photo-1514330138344-07258042467d?auto=format&fit=crop&w=800&q=80',
    progress: 0,
    timeline: [
      { status: IssueStatus.REPORTED, timestamp: Date.now() - 3600000 * 5, note: 'Reported with GPS coordinates.' }
    ]
  },
  {
    id: '3',
    category: IssueCategory.GARBAGE,
    description: 'Overflowing garbage bin near main market entrance.',
    location: { lat: 19.076, lng: 72.877, address: 'Bandra, Mumbai' },
    reporter: { name: 'Sriya Patel', isAnonymous: false },
    timestamp: Date.now() - 3600000 * 48,
    priorityScore: 5.2,
    status: IssueStatus.RESOLVED,
    upvotes: 89,
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    progress: 100,
    timeline: [
      { status: IssueStatus.REPORTED, timestamp: Date.now() - 3600000 * 48, note: 'Garbage hotspot identified.' },
      { status: IssueStatus.ACKNOWLEDGED, timestamp: Date.now() - 3600000 * 46, note: 'BMC Waste Management notified.' },
      { status: IssueStatus.RESOLVED, timestamp: Date.now() - 3600000 * 2, note: 'Cleanup completed. Post-work photo verified by AI.', photoUrl: 'https://images.unsplash.com/photo-1617113931034-7c3e37130664?auto=format&fit=crop&w=800&q=80' }
    ]
  }
];

export const MOCK_BUDGETS: BudgetProject[] = [
  { id: 'b1', title: 'Road Infrastructure', allocated: 150000000, spent: 98000000, status: 65, adoptedBy: 'L&T Civic Care' },
  { id: 'b2', title: 'Drainage & Sewage', allocated: 75000000, spent: 45000000, status: 60 },
  { id: 'b3', title: 'Smart Street Lighting', allocated: 25000000, spent: 22000000, status: 88, adoptedBy: 'Tata Power CSR' },
  { id: 'b4', title: 'Public Health/Cleanliness', allocated: 40000000, spent: 10000000, status: 25, adoptedBy: 'Goonj Foundation' },
];
