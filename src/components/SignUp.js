// File: /finance/src/components/SignUp.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const SignUp = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });
            if (error) throw error;
            setUser(data.user);
            alert('Check your email for the confirmation link');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <form onSubmit={handleSignUp} className="space-y-4">
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
            />
            <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">Sign Up</button>
        </form>
    );
};

export default SignUp;
