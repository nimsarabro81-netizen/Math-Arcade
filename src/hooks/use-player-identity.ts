
'use client';

import { useState, useEffect, useCallback } from 'react';

const PLAYER_IDENTITY_KEY = 'math_arcade_player_identity';

type PlayerIdentity = {
  username: string;
  avatar: string;
};

export function usePlayerIdentity() {
  const [identity, setIdentityState] = useState<PlayerIdentity | null>(null);
  const [isIdentityLoaded, setIsIdentityLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedIdentity = localStorage.getItem(PLAYER_IDENTITY_KEY);
      if (storedIdentity) {
        setIdentityState(JSON.parse(storedIdentity));
      }
    } catch (error) {
      console.error('Failed to load player identity from localStorage', error);
    } finally {
        setIsIdentityLoaded(true);
    }
  }, []);

  const setIdentity = useCallback((newIdentity: PlayerIdentity | null) => {
    try {
      if (newIdentity) {
        localStorage.setItem(PLAYER_IDENTITY_KEY, JSON.stringify(newIdentity));
      } else {
        localStorage.removeItem(PLAYER_IDENTITY_KEY);
      }
      setIdentityState(newIdentity);
    } catch (error) {
      console.error('Failed to save player identity to localStorage', error);
    }
  }, []);

  return { identity, setIdentity, isIdentityLoaded };
}
