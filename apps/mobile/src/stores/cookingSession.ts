import { create } from 'zustand';

interface CookingSessionState {
  currentStepIndex: number;
  totalSteps: number;
  isActive: boolean;
  recipeId: string | null;
}

interface CookingSessionActions {
  startSession: (recipeId: string, totalSteps: number) => void;
  endSession: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

type CookingSessionStore = CookingSessionState & CookingSessionActions;

export const useCookingSession = create<CookingSessionStore>((set) => ({
  currentStepIndex: 0,
  totalSteps: 0,
  isActive: false,
  recipeId: null,

  startSession: (recipeId, totalSteps) =>
    set({ recipeId, totalSteps, currentStepIndex: 0, isActive: true }),

  endSession: () =>
    set({ isActive: false, currentStepIndex: 0, totalSteps: 0, recipeId: null }),

  nextStep: () =>
    set((s) => ({
      currentStepIndex: Math.min(s.currentStepIndex + 1, s.totalSteps - 1),
    })),

  prevStep: () =>
    set((s) => ({
      currentStepIndex: Math.max(s.currentStepIndex - 1, 0),
    })),
}));
