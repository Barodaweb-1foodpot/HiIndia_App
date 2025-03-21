import { createContext, useContext, useState } from "react";

export const AuthContext = createContext(); 
export const useAuthContext = () => useContext(AuthContext);

export const ContextProvider = ({ children }) => {  
    const [loginEmail, setLoginEmail] = useState("");
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgot_id , setForgot_Id] = useState('')
    const [user, setUser] = useState(null);
    return (
        <AuthContext.Provider value={{ loginEmail, setLoginEmail ,
            forgotEmail, setForgotEmail,
            forgot_id , setForgot_Id,
            user, setUser
        }}>
            {children}  
        </AuthContext.Provider>
    );
};

export default ContextProvider;