import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AdminContextType {
  isAdminMode: boolean;
  pageContent: Record<string, string>;
  login: (password: string) => boolean;
  logout: () => void;
  updateField: (key: string, value: string) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | null>(null);

const SESSION_KEY = 'mp_admin_mode';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || '';

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });
  const [pageContent, setPageContent] = useState<Record<string, string>>({});

  // Fetch all page content from the backend on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/page-content`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.content) {
          setPageContent(data.content);
        }
      } catch (err) {
        console.warn('Could not fetch page content from API:', err);
      }
    };
    fetchContent();
  }, []);

  const login = useCallback((password: string): boolean => {
    if (password === adminPassword) {
      setIsAdminMode(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAdminMode(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const updateField = useCallback(async (key: string, value: string): Promise<boolean> => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/page-content/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminPassword,
        },
        body: JSON.stringify({ value }),
      });

      if (!res.ok) {
        console.error('Failed to save field:', key);
        return false;
      }

      // Optimistic update
      setPageContent(prev => ({ ...prev, [key]: value }));
      return true;
    } catch (err) {
      console.error('Error saving field:', err);
      return false;
    }
  }, []);

  return (
    <AdminContext.Provider value={{ isAdminMode, pageContent, login, logout, updateField }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
