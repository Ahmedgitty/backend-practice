import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

// Decode JWT payload (it's just base64) to recover user info on refresh
function getUserFromToken(jwt) {
    if (!jwt) return null;
    try {
        const payload = JSON.parse(atob(jwt.split(".")[1]));
        return payload;
    } catch {
        return null;
    }
}

export function AuthProvider({ children}){
    const storedToken = localStorage.getItem("token");
    const [user, setUser] = useState(getUserFromToken(storedToken));
    const [token, setToken] = useState(storedToken);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem("token", jwtToken);
    };
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}