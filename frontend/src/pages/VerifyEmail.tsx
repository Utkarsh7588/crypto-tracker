import React, { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound } from 'lucide-react';

const VerifyEmail: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const { verifyEmail } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { emailVerificationId, email } = location.state || {};

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!emailVerificationId) {
            setError('Missing verification ID. Please sign up again.');
            return;
        }
        try {
            await verifyEmail(emailVerificationId, otp);
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Verify Email</h2>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Enter the OTP sent to {email}
                </p>
                {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded dark:bg-red-900/30">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            className="w-full px-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Verify
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyEmail;
