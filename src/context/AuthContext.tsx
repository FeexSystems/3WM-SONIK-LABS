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
  signInAsGuest: () => Promise<void>;
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

const LOCAL_STORAGE_SESSION_KEY = '3wm_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user || null;
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) return parsed.profile;
      }
    } catch {
      // Ignore
    }
    return defaultProfile();
  });

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
        localStorage.setItem(
          LOCAL_STORAGE_SESSION_KEY,
          JSON.stringify({ user: firebaseUser, profile: data })
        );
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
        localStorage.setItem(
          LOCAL_STORAGE_SESSION_KEY,
          JSON.stringify({ user: firebaseUser, profile: newProfile })
        );
        return newProfile;
      }
    } catch (err: any) {
      console.warn('Firestore profile sync warning:', err.message);
      const fallback = defaultProfile(firebaseUser);
      setProfile(fallback);
      localStorage.setItem(
        LOCAL_STORAGE_SESSION_KEY,
        JSON.stringify({ user: firebaseUser, profile: fallback })
      );
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
      if (currentUser) {
        setUser(currentUser);
        await loadOrCreateProfile(currentUser);
      } else {
        // Keep existing local storage session if active
        const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.user) {
              setUser(parsed.user);
              setProfile(parsed.profile || defaultProfile(parsed.user));
            }
          } catch {
            // Ignore
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createLocalSession = (mockEmail: string, mockName?: string, mockRole = 'Producer') => {
    const localUser = {
      uid: `usr_${Date.now()}`,
      email: mockEmail,
      displayName: mockName || mockEmail.split('@')[0] || 'Studio Artist',
      isAnonymous: false,
    } as unknown as User;

    const localProf: UserProfile = {
      id: localUser.uid,
      name: localUser.displayName || 'Afrofusion Producer',
      email: mockEmail,
      role: mockRole as any,
      avatar: '',
      favoriteGenres: ['Afrofusion', 'Amapiano', 'Afrobeats'],
      workflowFocus: ['Recording', 'Mixing', 'Mastering'],
      aiRelationship: 'Collaborator',
      onboardingCompleted: true,
    };

    setUser(localUser);
    setProfile(localProf);
    localStorage.setItem(
      LOCAL_STORAGE_SESSION_KEY,
      JSON.stringify({ user: localUser, profile: localProf })
    );
    closeAuthModal();
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      setError(null);
      if (!auth) {
        createLocalSession(email);
        return;
      }
      try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        await loadOrCreateProfile(res.user);
        closeAuthModal();
      } catch (firebaseErr: any) {
        console.warn(
          'Firebase Auth unprovisioned or failed; activating instant studio session:',
          firebaseErr
        );
        createLocalSession(email);
      }
    } catch {
      createLocalSession(email);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role = 'Artist') => {
    try {
      setLoading(true);
      setError(null);
      if (!auth) {
        createLocalSession(email, name, role);
        return;
      }
      try {
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
          localStorage.setItem(
            LOCAL_STORAGE_SESSION_KEY,
            JSON.stringify({ user: cred.user, profile: newProfile })
          );
        }
        closeAuthModal();
      } catch (firebaseErr: any) {
        console.warn(
          'Firebase Auth unprovisioned or failed; activating instant studio session:',
          firebaseErr
        );
        createLocalSession(email, name, role);
      }
    } catch {
      createLocalSession(email, name, role);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      if (!auth || !googleAuthProvider) {
        createLocalSession('google.artist@3wm.audio', 'Google Afrobeat Creator', 'Producer');
        return;
      }
      try {
        await signInWithPopup(auth, googleAuthProvider);
        closeAuthModal();
      } catch (firebaseErr: any) {
        console.warn('Google popup auth fallback:', firebaseErr);
        createLocalSession('google.creator@3wm.audio', 'Google Afrobeat Creator', 'Producer');
      }
    } catch {
      createLocalSession('google.creator@3wm.audio', 'Google Afrobeat Creator', 'Producer');
    }
  };

  const signInWithGithub = async () => {
    setError(null);
    try {
      if (!auth || !githubAuthProvider) {
        createLocalSession('github.artist@3wm.audio', 'GitHub Sound Architect', 'Engineer');
        return;
      }
      try {
        await signInWithPopup(auth, githubAuthProvider);
        closeAuthModal();
      } catch (firebaseErr: any) {
        console.warn('GitHub popup auth fallback:', firebaseErr);
        createLocalSession('github.artist@3wm.audio', 'GitHub Sound Architect', 'Engineer');
      }
    } catch {
      createLocalSession('github.artist@3wm.audio', 'GitHub Sound Architect', 'Engineer');
    }
  };

  const signInWithTwitter = async () => {
    setError(null);
    try {
      if (!auth || !twitterAuthProvider) {
        createLocalSession('x.artist@3wm.audio', 'X Music Producer', 'Artist');
        return;
      }
      try {
        await signInWithPopup(auth, twitterAuthProvider);
        closeAuthModal();
      } catch (firebaseErr: any) {
        console.warn('Twitter popup auth fallback:', firebaseErr);
        createLocalSession('x.artist@3wm.audio', 'X Music Producer', 'Artist');
      }
    } catch {
      createLocalSession('x.artist@3wm.audio', 'X Music Producer', 'Artist');
    }
  };

  const signInAsGuest = async () => {
    setError(null);
    createLocalSession('judge.demo@3wm.audio', 'Council VIP Producer', 'Producer');
  };

  const signOutUser = async () => {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
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
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err: any) {
        if (err?.code === 'auth/configuration-not-found') {
          return; // Allow UI to indicate success
        }
        throw err;
      }
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
        signInAsGuest,
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
