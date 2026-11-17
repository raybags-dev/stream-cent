import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Plan, Profile, User, WatchProgress } from '../../types';
import { authApi } from '../api/authClient';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: User | null;
  activeProfile: Profile | null;
  currentPath: string;
  navigate: (path: string) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    planId: Plan['id'],
    profileName: string,
    avatarUrl: string
  ) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => Promise<User | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  switchProfile: (profileId: string) => void;
  updateProfile: (profile: Profile) => void;
  addProfile: (name: string, avatarUrl: string, isKids: boolean) => void;
  deleteProfile: (profileId: string) => void;
  toggleMyList: (titleId: string) => void;
  isInMyList: (titleId: string) => boolean;
  toggleLike: (titleId: string) => void;
  isLiked: (titleId: string) => boolean;
  toggleDislike: (titleId: string) => void;
  isDisliked: (titleId: string) => boolean;
  updateWatchProgress: (titleId: string, progressPercent: number, seconds: number, totalSeconds: number, episodeId?: string) => void;
  changePlan: (newPlanId: Plan['id']) => void;
  cancelMembership: () => void;
  toasts: Array<{ id: string; title: string; description?: string; type?: 'default' | 'success' | 'info' | 'error' }>;
  addToast: (
    titleOrOptions: string | { title: string; description?: string; type?: 'default' | 'success' | 'info' | 'error' },
    description?: string,
    type?: 'default' | 'success' | 'info' | 'error'
  ) => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Client route management synced with URL hash / path
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash ? hash : window.location.pathname || '/';
    }
    return '/';
  });

  // Session state is derived from the httpOnly cookie session on load.
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((nextUser) => {
        if (active) setUser(nextUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<AuthContextValue['toasts']>([]);

  const addToast = (
    titleOrOptions: string | { title: string; description?: string; type?: 'default' | 'success' | 'info' | 'error' },
    desc?: string,
    toastType: 'default' | 'success' | 'info' | 'error' = 'default'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let title = '';
    let description: string | undefined = desc;
    let type: 'default' | 'success' | 'info' | 'error' = toastType;

    if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
      title = titleOrOptions.title;
      description = titleOrOptions.description;
      type = titleOrOptions.type || 'default';
    } else {
      title = titleOrOptions;
    }

    setToasts((prev) => [...prev.slice(-2), { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync route on popstate and hashchange
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      const path = hash || window.location.pathname || '/';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = path;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentPath(path);
  };

  const login = async (
    email: string,
    password: string,
    _rememberMe = true
  ): Promise<boolean> => {
    try {
      const session = await authApi.login(email, password);
      setUser(session.user);
      addToast('Welcome back', `Signed in as ${session.user.email}`, 'success');
      navigate('/browse');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      addToast('Sign in failed', message, 'error');
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    planId: Plan['id'],
    profileName: string,
    avatarUrl: string
  ): Promise<boolean> => {
    try {
      const session = await authApi.register(email, password, planId, profileName, avatarUrl);
      setUser(session.user);
      addToast('Account created', 'Your Stream Flix subscription is active.', 'success');
      navigate('/browse');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account.';
      addToast('Registration failed', message, 'error');
      throw error;
    }
  };

  const logout = () => {
    void authApi.logout();
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('streamflix_ephemeral_session');
    }
    addToast('Signed out', 'You have been signed out of Stream Flix.', 'info');
    navigate('/');
  };

  const refreshSession = async (): Promise<User | null> => {
    try {
      const nextUser = await authApi.me();
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await authApi.changePassword(currentPassword, newPassword);
    await refreshSession();
  };

  const switchProfile = (profileId: string) => {
    if (!user) return;
    const exists = user.profiles.find((p) => p.id === profileId);
    if (exists) {
      setUser({ ...user, currentProfileId: profileId });
      addToast('Profile Switched', `Now watching as ${exists.name}`, 'info');
      navigate('/browse');
    }
  };

  const updateProfile = (updatedProfile: Profile) => {
    if (!user) return;
    const updatedProfiles = user.profiles.map((p) =>
      p.id === updatedProfile.id ? updatedProfile : p
    );
    setUser({ ...user, profiles: updatedProfiles });
    addToast('Profile Updated', `${updatedProfile.name}'s settings saved`, 'success');
  };

  const addProfile = (name: string, avatarUrl: string, isKids: boolean) => {
    if (!user) return;
    const newId = `prof-${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      name,
      avatarUrl,
      isKids,
      language: 'English',
      maturityLimit: isKids ? 'PG' : 'TV-MA',
      autoplayNext: true,
      autoplayPreviews: true,
    };
    setUser({
      ...user,
      profiles: [...user.profiles, newProfile],
    });
    addToast('Profile Added', `Added profile for ${name}`, 'success');
  };

  const deleteProfile = (profileId: string) => {
    if (!user || user.profiles.length <= 1) {
      addToast('Cannot delete', 'You must have at least one active profile.', 'error');
      return;
    }
    const filtered = user.profiles.filter((p) => p.id !== profileId);
    const nextCurrent =
      user.currentProfileId === profileId ? filtered[0]!.id : user.currentProfileId;
    setUser({
      ...user,
      profiles: filtered,
      currentProfileId: nextCurrent,
    });
    addToast('Profile Deleted', 'Profile removed successfully.', 'info');
  };

  const toggleMyList = (titleId: string) => {
    if (!user) return;
    const exists = user.myList.includes(titleId);
    const updated = exists
      ? user.myList.filter((id) => id !== titleId)
      : [...user.myList, titleId];
    setUser({ ...user, myList: updated });
    addToast(
      exists ? 'Removed from My List' : 'Added to My List',
      undefined,
      exists ? 'info' : 'success'
    );
  };

  const isInMyList = (titleId: string) => {
    return user ? user.myList.includes(titleId) : false;
  };

  const toggleLike = (titleId: string) => {
    if (!user) return;
    const isCurrentlyLiked = user.likedTitles.includes(titleId);
    let updatedLikes = isCurrentlyLiked
      ? user.likedTitles.filter((id) => id !== titleId)
      : [...user.likedTitles, titleId];
    // remove from dislikes if liking
    let updatedDislikes = user.dislikedTitles.filter((id) => id !== titleId);

    setUser({ ...user, likedTitles: updatedLikes, dislikedTitles: updatedDislikes });
    addToast(
      isCurrentlyLiked ? 'Rating removed' : 'Rated: I like this!',
      undefined,
      'success'
    );
  };

  const isLiked = (titleId: string) => {
    return user ? user.likedTitles.includes(titleId) : false;
  };

  const toggleDislike = (titleId: string) => {
    if (!user) return;
    const isCurrentlyDisliked = user.dislikedTitles.includes(titleId);
    let updatedDislikes = isCurrentlyDisliked
      ? user.dislikedTitles.filter((id) => id !== titleId)
      : [...user.dislikedTitles, titleId];
    // remove from likes
    let updatedLikes = user.likedTitles.filter((id) => id !== titleId);

    setUser({ ...user, dislikedTitles: updatedDislikes, likedTitles: updatedLikes });
    addToast(
      isCurrentlyDisliked ? 'Rating removed' : 'Rated: Not for me',
      undefined,
      'info'
    );
  };

  const isDisliked = (titleId: string) => {
    return user ? user.dislikedTitles.includes(titleId) : false;
  };

  const updateWatchProgress = (
    titleId: string,
    progressPercent: number,
    seconds: number,
    totalSeconds: number,
    episodeId?: string
  ) => {
    if (!user) return;
    const existingIndex = user.watchHistory.findIndex((w) => w.titleId === titleId);
    const newEntry: WatchProgress = {
      titleId,
      progressPercent: Math.min(100, Math.max(1, Math.round(progressPercent))),
      lastWatchedSeconds: seconds,
      totalDurationSeconds: totalSeconds,
      episodeId,
      lastWatchedAt: new Date().toISOString(),
    };

    let updatedHistory = [...user.watchHistory];
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = newEntry;
    } else {
      updatedHistory.unshift(newEntry);
    }
    setUser({ ...user, watchHistory: updatedHistory });
  };

  const changePlan = (newPlanId: Plan['id']) => {
    if (!user) return;
    setUser({ ...user, planId: newPlanId });
    addToast('Plan Updated', `Switched to the ${newPlanId.toUpperCase()} plan.`, 'success');
  };

  const cancelMembership = () => {
    if (!user) return;
    addToast('Membership paused', 'Your subscription will end at the end of the current billing cycle.', 'info');
  };

  const activeProfile = useMemo(() => {
    if (!user) return null;
    return user.profiles.find((p) => p.id === user.currentProfileId) || user.profiles[0] || null;
  }, [user]);

  const value = {
    isAuthenticated: !!user,
    isAuthLoading,
    user,
    activeProfile,
    currentPath,
    navigate,
    login,
    signup,
    logout,
    refreshSession,
    changePassword,
    switchProfile,
    updateProfile,
    addProfile,
    deleteProfile,
    toggleMyList,
    isInMyList,
    toggleLike,
    isLiked,
    toggleDislike,
    isDisliked,
    updateWatchProgress,
    changePlan,
    cancelMembership,
    toasts,
    addToast,
    removeToast,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
