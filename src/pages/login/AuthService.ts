import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import {auth, googleProvider} from "../../firebase/firebaseConfig";
import {FinanceIndexDB} from "../../api/FinanceIndexDB";

export const AuthService = {
    // Sign in with Google
    signInWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    },

    // Sign out
    signOut: async () => {
        try {
            await FinanceIndexDB.clearIndexedDBData();
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser: () => {
        return auth.currentUser;
    },

    // Listen to auth state changes
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    }
};

