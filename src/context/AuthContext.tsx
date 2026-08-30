import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  githubAuthProvider,
  twitterAuthProvider,
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'reset';
  openAuthModal: (mode?: 'signin' | 'signup' | 'reset') => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateArtistProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const defaultProfile = (u?: User | null): UserProfile => ({
  id: u?.uid || 'usr-3wm-default',
  name: u?.displayName || 'Kappachino Artist',
  email: u?.email || 'producer@3wm.audio',
  role: 'Artist',
  avatar: u?.photoURL || '',
  favoriteGenres: ['Afrofusion', 'Amapiano', 'Afrobeats'],
  workflowFocus: ['Recording', 'Mixing', 'Mastering'],
  aiRelationship: 'Collaborator',
  onboardingCompleted: true,
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => defaultProfile());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup' | 'reset' = 'signin') => {
    setAuthModalMode(mode);
    setError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setError(null);
  };

  const clearError = () => setError(null);

  // Sync / Load User Profile from Firestore
  const loadOrCreateProfile = async (firebaseUser: User) => {
    if (!db) {
      const fallback = defaultProfile(firebaseUser);
      setProfile(fallback);
      return fallback;
    }

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        return data;
      } else {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Afrofusion Artist',
          email: firebaseUser.email || '',
          role: 'Artist',
          avatar: firebaseUser.photoURL || '',
          favoriteGenres: ['Afrofusion', 'Amapiano'],
          workflowFocus: ['Recording', 'Mixing', 'Mastering'],
          aiRelationship: 'Collaborator',
          onboardingCompleted: true,
        };
        await setDoc(userRef, newProfile, { merge: true });
        setProfile(newProfile);
        return newProfile;
      }
    } catch (err: any) {
      console.warn('Firestore profile sync warning:', err.message);
      const fallback = defaultProfile(firebaseUser);
      setProfile(fallback);
      return fallback;
    }
  };

  // Auth State Listener
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadOrCreateProfile(currentUser);
      } else {
        setProfile(defaultProfile(null));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      if (!auth) {
        // Fallback for missing Firebase config
        const mockUser = {
          uid: 'mock-user-123',
          email,
          displayName: email.split('@')[0],
          isAnonymous: false,
        } as User;
        setUser(mockUser);
        await loadOrCreateProfile(mockUser);
        closeAuthModal();
        return;
      }
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await loadOrCreateProfile(res.user);
      closeAuthModal();
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role = 'Artist') => {
    try {
      setLoading(true);
      if (!auth) {
        // Fallback for missing Firebase config
        const mockUser = {
          uid: `mock-${Date.now()}`,
          email,
          displayName: name,
          isAnonymous: false,
        } as User;
        setUser(mockUser);
        const newProfile: UserProfile = {
          id: mockUser.uid,
          name,
          email,
          role: role as any,
          avatar: '',
          favoriteGenres: ['Afrofusion'],
          workflowFocus: ['Recording'],
          aiRelationship: 'Collaborator',
          onboardingCompleted: true,
        };
        setProfile(newProfile);
        closeAuthModal();
        return;
      }
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      if (db) {
        const newProfile: UserProfile = {
          id: cred.user.uid,
          name: name || 'Afrofusion Producer',
          email,
          role: role as any,
          avatar: '',
          favoriteGenres: ['Afrofusion', 'Amapiano'],
          workflowFocus: ['Recording', 'Mixing', 'Mastering'],
          aiRelationship: 'Collaborator',
          onboardingCompleted: true,
        };
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
        setProfile(newProfile);
      }
      closeAuthModal();
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleAuthProvider) throw new Error('Google Auth provider not ready');
    setError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      closeAuthModal();
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    }
  };

  const signInWithGithub = async () => {
    if (!auth || !githubAuthProvider) throw new Error('GitHub Auth provider not ready');
    setError(null);
    try {
      await signInWithPopup(auth, githubAuthProvider);
      closeAuthModal();
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    }
  };

  const signInWithTwitter = async () => {
    if (!auth || !twitterAuthProvider) throw new Error('Twitter Auth provider not ready');
    setError(null);
    try {
      await signInWithPopup(auth, twitterAuthProvider);
      closeAuthModal();
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    }
  };

  const signOutUser = async () => {
    if (!auth) {
      setUser(null);
      setProfile(defaultProfile(null));
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      setProfile(defaultProfile(null));
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      if (!auth) {
        return; // Silent success if mock
      }
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateArtistProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...profile, ...data } as UserProfile;
    setProfile(updated);
    if (db) {
      try {
        await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      } catch (err) {
        console.warn('Failed to update profile in Firestore:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithGithub,
        signInWithTwitter,
        signOutUser,
        sendPasswordReset,
        updateArtistProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function formatAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Sign in popup was closed before completing.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently not enabled in Firebase Console.';
    default:
      return error?.message || 'An unexpected authentication error occurred.';
  }
}
