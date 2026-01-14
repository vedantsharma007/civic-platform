
export enum IssueCategory {
  ROADS = 'Broken Roads',
  WATER = 'Waterlogging',
  GARBAGE = 'Garbage Hotspot',
  SAFETY = 'Unsafe Zone',
  ELECTRIC = 'Electricity/Lighting',
  EMERGENCY = 'Emergency/Disaster'
}

export enum IssueStatus {
  REPORTED = 'Reported',
  ACKNOWLEDGED = 'Acknowledged',
  WIP = 'Work in Progress',
  RESOLVED = 'Resolved'
}

export interface IssueTimelineEntry {
  status: IssueStatus;
  timestamp: number;
  note: string;
  photoUrl?: string;
}

export interface CivicIssue {
  id: string;
  category: IssueCategory;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  reporter: {
    name: string;
    isAnonymous: boolean;
  };
  timestamp: number;
  priorityScore: number;
  status: IssueStatus;
  upvotes: number;
  imageUrl?: string;
  progress: number; // 0-100
  timeline: IssueTimelineEntry[];
}

export interface BudgetProject {
  id: string;
  title: string;
  allocated: number;
  spent: number;
  status: number; // percentage
  adoptedBy?: string; // NGO/Corporate name
  // Fix: Added index signature to satisfy Recharts type requirements for dynamic key access
  [key: string]: string | number | undefined;
}

export type View = 'dashboard' | 'map' | 'report' | 'budget' | 'chat' | 'emergency' | 'profile';
