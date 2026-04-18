import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, GraduationCap, Lock, Mail, ShieldCheck, UserPlus, Wrench } from 'lucide-react';

export const LoginPage = () => {
    const { signin, signup } = useAuth();
    const [mode, setMode] = useState('signin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isSignup = mode === 'signup';
    const roleOptions = useMemo(() => ([
        { value: 'USER', label: 'User', icon: UserPlus, description: 'Book facilities and raise tickets' },
        { value: 'TECHNICIAN', label: 'Technician', icon: Wrench, description: 'Manage maintenance tickets' }
    ]), []);

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/google";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (isSignup) {
                await signup({ name, email, password, role });
            } else {
                await signin(email, password);
            }
            window.location.href = '/';
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#d9f2ff_0,#eff7ff_35%,#f8fafc_100%)] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                <section className="bg-slate-900 text-slate-100 p-8 md:p-10 flex flex-col justify-between">
                    <div>
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-400/20 rounded-2xl mb-6 border border-cyan-300/30">
                            <GraduationCap className="w-8 h-8 text-cyan-300" />
                        </div>
                        <h1 className="text-3xl font-extrabold leading-tight">SmartCampus Access</h1>
                        <p className="text-slate-300 mt-4">
                            Secure authentication with email/password and Google OAuth. 
                            Admin access is restricted to approved institutional emails.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                            <ShieldCheck className="w-5 h-5 text-cyan-300" />
                            <span className="text-sm">Admin role is auto-assigned only for whitelisted emails.</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                            <Lock className="w-5 h-5 text-cyan-300" />
                            <span className="text-sm">Passwords are stored with BCrypt hashing.</span>
                        </div>
                    </div>
                </section>

                <section className="p-8 md:p-10">
                    <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => setMode('signin')}
                            className={`flex-1 py-2.5 rounded-lg font-semibold transition ${!isSignup ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                        >
                            Sign in
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`flex-1 py-2.5 rounded-lg font-semibold transition ${isSignup ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                        >
                            Sign up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignup && (
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Full name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Email address</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="you@campus.edu"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {isSignup && (
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">Join as</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {roleOptions.map((option) => {
                                        const Icon = option.icon;
                                        const selected = role === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setRole(option.value)}
                                                className={`text-left border rounded-xl p-3 transition ${selected ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-slate-300'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-4 h-4 ${selected ? 'text-cyan-700' : 'text-slate-500'}`} />
                                                    <span className="font-semibold text-slate-800">{option.label}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
                        >
                            {isSignup ? 'Create account' : 'Sign in'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="my-5 flex items-center gap-3 text-slate-400">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-xs uppercase tracking-wide">or</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl transition"
                    >
                        <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <p className="text-xs text-slate-500 mt-4">
                        If your email is in the admin allow-list, your account gets ADMIN privileges automatically.
                    </p>
                </section>
            </div>
        </div>
    );
};
