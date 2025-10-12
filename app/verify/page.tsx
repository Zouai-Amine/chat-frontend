'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

function VerifyResultPageContent() {
    const params = useSearchParams();
    const router = useRouter();
    const status = params.get('status');

    const messages: Record<string, { text: string; icon: string; color: string }> = {
        success: {
            text: 'Your email has been verified successfully!',
            icon: '✅',
            color: 'text-green-400'
        },
        already: {
            text: 'Your email is already verified.',
            icon: 'ℹ️',
            color: 'text-blue-400'
        },
        expired: {
            text: 'The verification link has expired.',
            icon: '⚠️',
            color: 'text-yellow-400'
        },
        invalid: {
            text: 'Invalid verification link.',
            icon: '❌',
            color: 'text-red-400'
        },
        notfound: {
            text: 'User not found.',
            icon: '❌',
            color: 'text-red-400'
        },
    };

    const message = messages[status || 'invalid'];

    return (
        <div className="flex flex-col md:flex-row h-screen text-slate-900 dark:text-white transition-all duration-500
        bg-gradient-to-br
        from-cyan-50 via-blue-50 to-pink-50
        dark:from-slate-900 dark:via-purple-900 dark:to-pink-900
        relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-20"></div>
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-30" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-10" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-600/50 flex flex-col items-center justify-center shadow-2xl ring-1 ring-white/10 dark:ring-slate-700/50 p-8 max-w-md w-full text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                        className="text-6xl mb-6"
                    >
                        {message.icon}
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
                    >
                        Email Verification
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={`text-lg font-medium mb-4 ${message.color}`}
                    >
                        {message.text}
                    </motion.p>
                    {status === 'success' && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-sm text-slate-500 dark:text-slate-400"
                        >
                            You can now close this page or log in.
                        </motion.p>
                    )}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/')}
                        className="mt-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 hover:from-cyan-600 hover:via-blue-600 hover:to-pink-600 px-6 py-3 rounded-2xl font-bold text-white shadow-2xl transition-all duration-300 ring-2 ring-white/20 hover:ring-cyan-400/50"
                    >
                        Go to Login
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}

export default function VerifyResultPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyResultPageContent />
        </Suspense>
    );
}
