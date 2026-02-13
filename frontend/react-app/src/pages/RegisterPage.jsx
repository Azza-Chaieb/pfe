import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';

const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        user_type: '',
        registration_date: new Date().toISOString().split('T')[0],
        level: '',
        address: '',
        birth_date: '',
        specialty: '',
        trainer_phone: '',
        org_name: '',
        association_phone: '',
        company: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // Auto-sync username with email if they were the same or if username is new
            if (name === 'email' && (prev.username === prev.email || !prev.username)) {
                newData.username = value;
            }
            return newData;
        });
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.fullname || !formData.email || !formData.password || !formData.user_type || !formData.phone) {
                setError('Veuillez remplir tous les champs obligatoires, y compris le téléphone.');
                return;
            }
            setError('');
            setStep(2);
        }
    };

    const prevStep = () => setError('') || setStep(1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 🧹 Sanitize phone number (remove non-digits for biginteger)
            const cleanPhone = formData.phone.replace(/\D/g, '');
            if (!cleanPhone) {
                throw new Error("Le numéro de téléphone doit contenir des chiffres.");
            }

            // 1. Prepare User Data
            const userPayload = {
                username: formData.username || formData.email,
                email: formData.email,
                password: formData.password,
                fullname: formData.fullname,
                phone: cleanPhone, // Send as string to preserve precision
                user_type: formData.user_type,
            };

            console.log("Registering user...", userPayload);

            // 2. Register User
            const registerRes = await register(userPayload);
            const userId = registerRes.user.id;
            const jwt = registerRes.jwt;

            // 3. Create Role-Specific Profile
            let profileEndpoint = '';
            let profileData = { user: userId };

            if (formData.user_type === 'student') {
                profileEndpoint = '/etudiant-profils';
                profileData = { ...profileData, registration_date: formData.registration_date, level: formData.level, address: formData.address, birth_date: formData.birth_date };
            } else if (formData.user_type === 'trainer') {
                profileEndpoint = '/formateur-profils';
                profileData = { ...profileData, specialty: formData.specialty, phone: (formData.trainer_phone || formData.phone).replace(/\D/g, '') };
            } else if (formData.user_type === 'association') {
                profileEndpoint = '/association-profils';
                profileData = { ...profileData, name: formData.org_name, phone: (formData.association_phone || formData.phone).replace(/\D/g, '') };
            } else if (formData.user_type === 'professional') {
                profileEndpoint = '/professionnels';
                profileData = { ...profileData, company: formData.company };
            }

            if (profileEndpoint) {
                const axios = (await import('axios')).default;
                await axios.post(`http://localhost:1337/api${profileEndpoint}`, { data: profileData }, {
                    headers: { Authorization: `Bearer ${jwt}` }
                });
            }

            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            console.error('Registration full error:', err.response?.data || err);

            // 🔍 EXPOSE FULL ERROR FOR DEBUGGING
            const errorDetails = err.response?.data?.error;
            if (errorDetails) {
                setError(`DÉTAIL ERREUR : ${errorDetails.message} - ${JSON.stringify(errorDetails.details?.errors || errorDetails)}`);
            } else {
                setError(`ERREUR : ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/60 backdrop-blur-md">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">✓</div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Inscription Réussie !</h2>
                    <p className="text-slate-500 font-medium">Bienvenue chez SUNSPACE. Préparez-vous à apprendre.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col md:flex-row min-h-[600px]">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex bg-gradient-to-br from-blue-700 to-indigo-900 w-1/3 p-8 text-white flex-col justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter mb-2">SUNSPACE</h1>
                        <div className="h-1 w-12 bg-blue-400 rounded-full mb-6"></div>
                        <p className="text-blue-100 text-sm leading-relaxed">Créez votre compte en quelques secondes et rejoignez la révolution éducative.</p>
                    </div>
                    <div className="space-y-4">
                        <div className={`flex items-center gap-3 transition-all ${step === 1 ? 'opacity-100' : 'opacity-40'}`}>
                            <span className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold">1</span>
                            <span className="text-sm font-semibold">Vérification</span>
                        </div>
                        <div className={`flex items-center gap-3 transition-all ${step === 2 ? 'opacity-100' : 'opacity-40'}`}>
                            <span className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold">2</span>
                            <span className="text-sm font-semibold">Profil</span>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <div className="flex-1 p-8 md:p-12">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {step === 1 ? 'On commence !' : 'Dernière étape'}
                        </h2>
                        <p className="text-gray-500 text-sm">Remplissez les informations ci-dessous.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-start gap-3">
                            <span className="mt-0.5">⚠️</span>
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {step === 1 ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nom Complet</label>
                                    <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: Ahmed Ben Salem" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="votre@email.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Téléphone</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="216 -- --- ---" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mot de passe</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Je suis un(e)</label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {['student', 'trainer', 'association', 'professional'].map(role => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, user_type: role })}
                                                className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${formData.user_type === role ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'}`}
                                            >
                                                {role === 'student' ? 'Étudiant' : role === 'trainer' ? 'Formateur' : role === 'association' ? 'Association' : 'Pro'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button type="button" onClick={nextStep} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 group mt-4">
                                    Continuer
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                {formData.user_type === 'student' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Niveau d'études</label>
                                            <input type="text" name="level" value={formData.level} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" placeholder="Ex: Licence 2" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date de naissance</label>
                                            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Adresse</label>
                                            <textarea name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" rows="2" placeholder="Quartier, Ville..."></textarea>
                                        </div>
                                    </>
                                )}

                                {formData.user_type === 'trainer' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Spécialité</label>
                                        <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" placeholder="Ex: Intelligence Artificielle" />
                                    </div>
                                )}

                                {formData.user_type === 'professional' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Entreprise</label>
                                        <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" placeholder="Nom de votre société" />
                                    </div>
                                )}

                                {formData.user_type === 'association' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nom de l'Association</label>
                                        <input type="text" name="org_name" value={formData.org_name} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={prevStep} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">
                                        Retour
                                    </button>
                                    <button type="submit" disabled={loading} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
                                        {loading ? 'Création...' : 'Finaliser'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="mt-12 text-center text-sm">
                        <span className="text-gray-400">Déjà membre ? </span>
                        <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">Se connecter</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
