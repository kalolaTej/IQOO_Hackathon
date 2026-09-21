import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation, translations } from '../utils/translations';

const AuthContext = createContext(null);

export const MOCK_USERS = {
  farmer: {
    id: 'USR-FARM-9942',
    name: 'Rajesh Dashrath Patil',
    role: 'farmer',
    roleLabel: 'Farmer Producer (FPO)',
    apmc: 'Pimpalgaon APMC, Nashik',
    phone: '+91 98231 44210',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  },
  apmc: {
    id: 'USR-APMC-014',
    name: 'Sanjay Deshmukh (Secretary)',
    role: 'apmc',
    roleLabel: 'APMC Mandi Yard Official',
    apmc: 'Pimpalgaon Baswant APMC',
    phone: '+91 94220 18400',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
  },
  buyer: {
    id: 'USR-BUYER-882',
    name: 'Vikram Mehta (Procurement Lead)',
    role: 'buyer',
    roleLabel: 'Institutional Buyer (Maharshi Agro)',
    apmc: 'APEDA Nashik / Mumbai',
    phone: '+91 98200 55100',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
  },
  driver: {
    id: 'USR-DRV-331',
    name: 'Dnyaneshwar Shinde',
    role: 'driver',
    roleLabel: 'Logistics Drayage Driver',
    apmc: 'Khanderao Transport Syndicate',
    phone: '+91 98233 11204',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
  },
  public: {
    id: 'USR-PUBLIC-000',
    name: 'Guest Visitor',
    role: 'public',
    roleLabel: 'Public Visitor',
    apmc: 'Public Portal',
    phone: '',
    avatar: '',
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedAuth = localStorage.getItem('agrisync_auth');
    if (savedAuth === 'false') {
      return MOCK_USERS.public;
    }
    const savedUser = localStorage.getItem('agrisync_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch(e) {}
    }
    const savedRole = localStorage.getItem('agrisync_role');
    return MOCK_USERS[savedRole] || MOCK_USERS.farmer;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('agrisync_auth') !== 'false';
  });

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('agrisync_lang') || 'EN';
  });

  const setLanguage = (newLang) => {
    const valid = ['EN', 'MR', 'HI'].includes(newLang) ? newLang : 'EN';
    setLanguageState(valid);
    localStorage.setItem('agrisync_lang', valid);
  };

  const t = (key, fallback) => {
    return getTranslation(language, key, fallback);
  };

  const registerUser = (userData) => {
    const rawMobile = (userData.mobile || '').trim();
    const cleanMobile = rawMobile.replace(/\D/g, '').slice(-10);
    const password = (userData.password || '').trim();

    if (cleanMobile.length !== 10) {
      throw new Error('Mobile number must be a valid 10-digit number.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Check for duplicate registered mobile number
    const savedUsers = JSON.parse(localStorage.getItem('agrisync_registered_users') || '[]');
    const isDuplicate = savedUsers.some(u => {
      const uCleanPhone = (u.phone || u.mobile || '').replace(/\D/g, '').slice(-10);
      return uCleanPhone && uCleanPhone === cleanMobile;
    });

    if (isDuplicate) {
      throw new Error('This mobile number is already registered! Please log in instead or use a different number.');
    }

    const roleLabels = {
      farmer: 'Farmer Producer (FPO)',
      apmc: 'APMC Mandi Official',
      buyer: 'Institutional Buyer',
      driver: 'Logistics Drayage Driver'
    };

    const newUser = {
      id: `USR-${(userData.role || 'farmer').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: userData.fullName || 'Registered User',
      role: userData.role || 'farmer',
      roleLabel: roleLabels[userData.role] || 'Farmer Producer (FPO)',
      apmc: userData.mandi || 'Pimpalgaon APMC, Nashik',
      phone: userData.mobile || '+91 98231 44210',
      mobile: userData.mobile || '+91 98231 44210',
      aadhaar: userData.aadhaar || '',
      bankAccount: userData.bankAccount || '',
      ifsc: userData.ifsc || '',
      password: password,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    };
    
    // Save to global users list
    savedUsers.push(newUser);
    localStorage.setItem('agrisync_registered_users', JSON.stringify(savedUsers));

    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('agrisync_user', JSON.stringify(newUser));
    localStorage.setItem('agrisync_role', newUser.role);
    localStorage.setItem('agrisync_auth', 'true');
    return newUser;
  };

  const loginUser = (credentials) => {
    const role = credentials?.role || 'farmer';
    const rawMobile = (credentials?.mobile || '').trim();
    const cleanMobile = rawMobile.replace(/\D/g, '').slice(-10);
    const password = (credentials?.password || '').trim();

    const generalError = 'Invalid login credentials. Please check your mobile number, password, and role.';

    if (!rawMobile || !password) {
      throw new Error(generalError);
    }

    // Check if there is a registered user matching in localStorage
    const savedUsers = JSON.parse(localStorage.getItem('agrisync_registered_users') || '[]');
    
    const registeredUserWithPhone = savedUsers.find(u => {
      const uCleanPhone = (u.phone || u.mobile || '').replace(/\D/g, '').slice(-10);
      return (cleanMobile && uCleanPhone === cleanMobile) || (u.phone || u.mobile || '').trim() === rawMobile;
    });

    let targetUser;

    if (registeredUserWithPhone) {
      if (registeredUserWithPhone.password !== password || registeredUserWithPhone.role !== role) {
        throw new Error(generalError);
      }
      targetUser = registeredUserWithPhone;
    } else {
      // Demo fallback login validation
      if (password !== 'password123' && password.length < 6) {
        throw new Error(generalError);
      }
      const mockUser = MOCK_USERS[role] || MOCK_USERS.farmer;
      const displayName = credentials?.fullName || (rawMobile.includes('@') ? rawMobile.split('@')[0] : mockUser.name);
      targetUser = {
        ...mockUser,
        phone: rawMobile || mockUser.phone,
        mobile: rawMobile || mockUser.phone,
        name: displayName
      };
    }
    
    setUser(targetUser);
    setIsAuthenticated(true);
    localStorage.setItem('agrisync_user', JSON.stringify(targetUser));
    localStorage.setItem('agrisync_role', targetUser.role);
    localStorage.setItem('agrisync_auth', 'true');
    return targetUser;
  };

  const logoutUser = () => {
    setUser(MOCK_USERS.public);
    setIsAuthenticated(false);
    localStorage.removeItem('agrisync_user');
    localStorage.removeItem('agrisync_role');
    localStorage.removeItem('agrisync_auth');
    localStorage.setItem('agrisync_auth', 'false');
  };

  // Provide translated role label helper
  const getRoleLabel = (roleKey) => {
    const role = roleKey || user?.role || 'farmer';
    return t(`role.${role}`, user?.roleLabel || 'Farmer Producer (FPO)');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      registerUser, 
      loginUser, 
      logoutUser, 
      language, 
      setLanguage, 
      t, 
      getRoleLabel 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

