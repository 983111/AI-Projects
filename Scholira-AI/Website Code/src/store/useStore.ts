import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  name: string;
  gpa: string;
  satScore: string;
  actScore: string;
  interests: string[];
  major: string;
  demographics: string; // e.g., "First-generation, Hispanic, Female"
  achievements: string;
}

export interface Scholarship {
  id: string;
  name: string;
  amount: string;
  deadline: string;
  requirements: string;
  url: string;
  matchScore: number; // 0-100
  status: 'saved' | 'applied' | 'ignored' | 'new';
}

export interface Application {
  id: string;
  collegeName: string;
  deadline: string;
  status: 'researching' | 'essay-drafting' | 'submitted' | 'accepted' | 'rejected';
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

interface AppState {
  userProfile: UserProfile;
  scholarships: Scholarship[];
  applications: Application[];
  chatHistory: ChatMessage[];
  
  updateProfile: (profile: Partial<UserProfile>) => void;
  addScholarship: (scholarship: Scholarship) => void;
  updateScholarshipStatus: (id: string, status: Scholarship['status']) => void;
  addApplication: (app: Application) => void;
  updateApplicationStatus: (id: string, status: Application['status']) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      userProfile: {
        name: '',
        gpa: '',
        satScore: '',
        actScore: '',
        interests: [],
        major: '',
        demographics: '',
        achievements: '',
      },
      scholarships: [],
      applications: [],
      chatHistory: [],

      updateProfile: (profile) =>
        set((state) => ({ userProfile: { ...state.userProfile, ...profile } })),
      
      addScholarship: (scholarship) =>
        set((state) => ({ scholarships: [...state.scholarships, scholarship] })),
      
      updateScholarshipStatus: (id, status) =>
        set((state) => ({
          scholarships: state.scholarships.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        })),

      addApplication: (app) =>
        set((state) => ({ applications: [...state.applications, app] })),

      updateApplicationStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        })),

      addChatMessage: (message) =>
        set((state) => ({ chatHistory: [...state.chatHistory, message] })),
      
      clearChat: () => set({ chatHistory: [] }),
    }),
    {
      name: 'scholarship-ai-storage',
    }
  )
);
