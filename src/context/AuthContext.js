import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();  // ✅ Renamed to match "Auth"
export const useAuthContext = () => useContext(AuthContext);

export const ContextProvider = ({ children }) => {  
    const [loginEmail, setLoginEmail] = useState("");

    return (
        <AuthContext.Provider value={{ loginEmail, setLoginEmail }}>
            {children}  
        </AuthContext.Provider>
    );
};

export default ContextProvider; // ✅ Default export to match App.js
