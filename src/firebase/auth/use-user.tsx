'use client';
    
import {
    useState,
    useEffect,
    createContext,
    useContext,
    ReactNode,
} from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(
            auth,
            (firebaseUser) => {
                setUser(firebaseUser);
                setIsLoading(false);
            },
            (error) => {
                console.error("useUser: onAuthStateChanged error:", error);
                setError(error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, isLoading, error }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider.');
    }
    return context;
};
