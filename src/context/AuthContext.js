import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();  // ✅ Renamed to match "Auth"
export const useAuthContext = () => useContext(AuthContext);

export const ContextProvider = ({ children }) => {  
    const [loginEmail, setLoginEmail] = useState("");
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgot_id , setForgot_Id] = useState('')
    return (
        <AuthContext.Provider value={{ loginEmail, setLoginEmail ,
            forgotEmail, setForgotEmail,
            forgot_id , setForgot_Id
        }}>
            {children}  
        </AuthContext.Provider>
    );
};

export default ContextProvider;