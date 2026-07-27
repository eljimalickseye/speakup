import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import {
  FlameIcon,
  CoinIcon,
  PenToolIcon,
  BarChartIcon,
  LockIcon,
  TrashIcon,
  BookOpenIcon,
  SparklesIcon,
  VolumeIcon,
  HelpCircleIcon,
  CrownIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  GoogleIcon,
} from '../components/ui/Icons.jsx';
import PaymentModal from '../components/monetization/PaymentModal.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const {
    userProfile,
    isLoggedIn,
    savedVocab,
    removeVocabWord,
    addVocabMeaning,
    removeVocabMeaning,
    updateUserProfileInfo,
    addCoins,
    loginUser,
    loginWithGoogle,
    logoutUser,
    submitAccessRequest,
    appLanguage,
    changeAppLanguage,
    themeMode,
    toggleThemeMode,
  } = useApp();

  const isEn = appLanguage === 'en';

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(userProfile?.name || '');
  const [editEmail, setEditEmail] = useState(userProfile?.email || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');

  // Auth / Signup Form State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      setAuthError('');
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
      setAuthError(isEn ? 'Google Sign-In failed or was cancelled.' : 'Échec de la connexion Google ou fenêtre fermée.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Instant Signup State
  const [signupName, setSignupName] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  const handleSaveProfileEdit = (e) => {
    e.preventDefault();
    updateUserProfileInfo({
      name: editName.trim() || userProfile.name,
      email: editEmail.trim() || userProfile.email,
      phone: editPhone.trim() || userProfile.phone,
    });
    setIsEditingProfile(false);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const loginLower = loginUsername.trim().toLowerCase();
    
    if (loginLower.includes('785423833') || loginLower.includes('785423') || loginLower.includes('malick') || loginLower.includes('admin')) {
      localStorage.setItem('koko_admin_unlocked', 'true');
      loginUser({
        id: 'usr-admin',
        name: 'El Hadji Malick Seye (Admin)',
        email: 'malick@koko.sn',
        phone: '785423833',
        coins: 5000,
        streak: 30,
        isVip: true,
        role: 'admin',
        accessStatus: 'APPROVED',
      });
    } else if (loginLower.includes('fatoumata') || loginLower.includes('fatou')) {
      loginUser({
        id: 'usr-author',
        name: 'Fatoumata',
        email: 'fatoumata@koko.sn',
        phone: '778901234',
        coins: 100,
        streak: 15,
        isVip: true,
        role: 'author',
        accessStatus: 'APPROVED',
      });
    } else {
      loginUser({
        id: 'usr-reader',
        name: loginUsername.trim() || 'Lecteur Koko',
        email: `${loginUsername.trim().replace(/\s+/g, '').toLowerCase() || 'lecteur'}@koko.sn`,
        phone: '771234567',
        coins: 50,
        streak: 1,
        isVip: false,
        role: 'reader',
        accessStatus: 'APPROVED',
      });
    }
  };

  // Instant Self-Registration with Reader Rights
  const handleInstantSignup = (e) => {
    e.preventDefault();
    if (!signupName.trim()) return;

    const newReader = {
      id: 'usr-' + Date.now(),
      name: signupName.trim(),
      email: signupContact.trim() || `${signupName.toLowerCase().replace(/\s+/g, '')}@koko.sn`,
      phone: signupPhone.trim() || '770000000',
      coins: 10, // Welcome gift 10 Coins
      streak: 1,
      isVip: false,
      role: 'reader', // Instant Reader Access!
      accessStatus: 'APPROVED',
    };

    submitAccessRequest({
      name: newReader.name,
      email: newReader.email,
      phone: newReader.phone,
    });

    loginUser(newReader);
    setShowGuideModal(true);
  };

  const handlePaymentSuccess = (addedCoins, isSubscription) => {
    if (isSubscription) {
      updateUserProfileInfo({ isVip: true });
    } else if (addedCoins && typeof addedCoins === 'number') {
      addCoins(addedCoins);
    }
  };

  // Unauthenticated Login / Instant Signup Screen
  if (!isLoggedIn) {
    return (
      <div className="px-5 pt-4 pb-6 flex flex-col items-center text-center text-ink">
        <div className="w-14 h-14 rounded-full bg-gold/15 text-gold border border-gold/30 flex items-center justify-center mb-4 shadow-sm">
          <LockIcon className="w-6 h-6" />
        </div>

        <span className="text-[10.5px] font-bold uppercase tracking-widest text-taupe mb-1">
          {isEn ? 'Koko Secure Access' : 'Accès Sécurisé Koko'}
        </span>
        <h1 className="font-display font-bold text-[22px] mb-2">
          {isEn ? 'Private Reader Space' : 'Espace Lecteur Privé'}
        </h1>
        <p className="text-[12.5px] text-taupe max-w-xs mb-6">
          {isEn ? 'Sign in or register for free to start reading immediately.' : 'Connectez-vous ou inscrivez-vous gratuitement pour commencer à lire immédiatement.'}
        </p>

        {/* Tab Toggle: Login vs Instant Reader Signup */}
        <div className="flex border-b border-surface-line w-full max-w-xs mb-5">
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 text-[12.5px] font-semibold ${
              authMode === 'login' ? 'text-ink border-b-2 border-gold font-bold' : 'text-taupe'
            }`}
          >
            {isEn ? 'Sign In' : 'Se Connecter'}
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2 text-[12.5px] font-semibold ${
              authMode === 'signup' ? 'text-ink border-b-2 border-gold font-bold' : 'text-taupe'
            }`}
          >
            {isEn ? 'Sign Up (Instant)' : "S'inscrire (Direct)"}
          </button>
        </div>

        {authMode === 'login' ? (
          <div className="w-full max-w-xs space-y-4">
            {/* Prominent Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading}
              className="w-full bg-white border border-surface-line text-ink py-3 px-4 rounded-2xl font-bold text-[13px] shadow-sm hover:bg-paper flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              <GoogleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{googleLoading ? (isEn ? 'Connecting...' : 'Connexion Google...') : (isEn ? 'Continue with Google' : 'Se connecter avec Google')}</span>
            </button>

            <div className="flex items-center gap-3 text-[10.5px] text-taupe uppercase tracking-wider font-bold">
              <div className="h-px bg-surface-line flex-1" />
              <span>{isEn ? 'OR' : 'OU'}</span>
              <div className="h-px bg-surface-line flex-1" />
            </div>

            {/* Main Login Card */}
            <form onSubmit={handleLoginSubmit} className="w-full space-y-4 bg-white p-5 rounded-2xl border border-surface-line shadow-sm">
              <div className="text-left space-y-1">
                <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                  {isEn ? 'Username / Identifier' : 'Identifiant'}
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder={isEn ? 'Enter username...' : 'Entrez votre identifiant...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-line text-[13px] outline-none focus:border-gold"
                />

                {/* Smart Animated Micro-Widget below identifier box */}
                <div className="pt-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-gold/15 via-deep/10 to-gold/15 border border-gold/30 flex items-center justify-between text-[11px] font-bold text-deep relative overflow-hidden shadow-inner group">
                    <div className="flex items-center gap-2 z-10">
                      <div className="w-6 h-6 rounded-lg bg-gold text-deep-2 flex items-center justify-center animate-bounce shadow-sm">
                        <BookOpenIcon className="w-3.5 h-3.5 text-deep-2" />
                      </div>
                      <span className="bg-gradient-to-r from-gold-soft to-deep bg-clip-text text-transparent font-extrabold tracking-tight">
                        Koko Stories & Audio
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gold font-mono z-10">
                      <SparklesIcon className="w-3 h-3 text-gold animate-spin" />
                      <span>EN / FR</span>
                    </div>

                    {/* Subtle Background Glow Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent -translate-x-full animate-shimmer" />
                  </div>
                </div>
              </div>

              <div className="text-left">
                <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                  {isEn ? 'Password' : 'Mot de Passe'}
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-line text-[13px] outline-none focus:border-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-deep text-paper py-3 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-90 transition-all mt-2"
              >
                {isEn ? 'Sign In' : 'Se Connecter'}
              </button>
            </form>
          </div>
        ) : (
          /* Instant Signup Form */
          <div className="w-full max-w-xs space-y-4">
            {/* Prominent Google Sign-Up Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading}
              className="w-full bg-white border border-surface-line text-ink py-3 px-4 rounded-2xl font-bold text-[13px] shadow-sm hover:bg-paper flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              <GoogleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{googleLoading ? (isEn ? 'Connecting...' : 'Connexion Google...') : (isEn ? 'Sign Up with Google' : "S'inscrire avec Google")}</span>
            </button>

            <div className="flex items-center gap-3 text-[10.5px] text-taupe uppercase tracking-wider font-bold">
              <div className="h-px bg-surface-line flex-1" />
              <span>{isEn ? 'OR' : 'OU'}</span>
              <div className="h-px bg-surface-line flex-1" />
            </div>

            <form onSubmit={handleInstantSignup} className="w-full space-y-3 bg-white p-5 rounded-2xl border border-surface-line shadow-sm">
            <div className="text-left">
              <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                {isEn ? 'Full Name*' : 'Nom et Prénom*'}
              </label>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder={isEn ? 'Your full name...' : 'Votre nom complet...'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-line text-[13px] outline-none focus:border-gold"
              />
            </div>

            <div className="text-left">
              <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                {isEn ? 'Email or Username*' : 'Adresse Email ou Identifiant*'}
              </label>
              <input
                type="text"
                required
                value={signupContact}
                onChange={(e) => setSignupContact(e.target.value)}
                placeholder={isEn ? 'Your email or username...' : 'Votre email ou pseudo...'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-line text-[13px] outline-none focus:border-gold"
              />
            </div>

            <div className="text-left">
              <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                {isEn ? 'Phone (Wave / OM)*' : 'Téléphone (Wave / OM)*'}
              </label>
              <input
                type="tel"
                required
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                placeholder="77 123 45 67"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-line text-[13px] outline-none focus:border-gold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gold text-paper py-3 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-90 transition-all mt-2"
            >
              {isEn ? 'Sign Up & Access Books (Free)' : "S'inscrire & Accéder aux Livres (Gratuit)"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
  }

  // Dynamic Profile Analytics
  const isAdmin = userProfile.role === 'admin';
  const isAuthor = userProfile.role === 'author' || isAdmin;
  const userCoins = userProfile.coins || 0;
  const userStreak = userProfile.streak || 0;
  const isVipUser = userProfile.isVip || false;

  return (
    <div className="px-5 pt-1 pb-6 text-ink space-y-4 animate-fadeIn">
      {/* Clean Header Bar with Question Mark Icon & Logout Icon Only (EXACT USER REQUEST) */}
      <div className="flex items-center justify-between gap-2 text-left pb-1">
        <h1 className="font-display font-bold text-[22px] text-ink">
          {isEn ? 'Profile' : 'Profil'}
        </h1>
        
        <div className="flex items-center gap-2">
          {/* Theme Switcher Button (Sun / Moon) */}
          <button
            onClick={toggleThemeMode}
            title={themeMode === 'dark' ? (isEn ? 'Switch to Light Mode' : 'Passer en Mode Clair') : (isEn ? 'Switch to Dark Mode' : 'Passer en Mode Sombre')}
            className="w-9 h-9 rounded-full bg-gold/15 text-gold border border-gold/30 flex items-center justify-center hover:bg-gold/25 transition-colors shadow-sm active:scale-95"
          >
            {themeMode === 'dark' ? <SunIcon className="w-4.5 h-4.5 text-gold" /> : <MoonIcon className="w-4.5 h-4.5 text-gold" />}
          </button>

          {/* Question Mark Icon Button Only */}
          <button
            onClick={() => setShowGuideModal(true)}
            title={isEn ? 'App Guide' : 'Guide Application'}
            className="w-9 h-9 rounded-full bg-gold/15 text-gold border border-gold/30 flex items-center justify-center hover:bg-gold/25 transition-colors shadow-sm active:scale-95"
          >
            <HelpCircleIcon className="w-4.5 h-4.5 text-gold" />
          </button>

          {/* Logout Icon Button Only */}
          <button
            onClick={logoutUser}
            title={isEn ? 'Sign Out' : 'Déconnexion'}
            className="w-9 h-9 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm active:scale-95"
          >
            <LogOutIcon className="w-4.5 h-4.5 text-red-600" />
          </button>
        </div>
      </div>
      
      {/* MINIMALIST USER HEADER CARD */}
      <div className="bg-white border border-surface-line rounded-3xl p-5 space-y-3 shadow-sm text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold via-deep to-deep-2 text-paper font-bold text-[18px] flex items-center justify-center border-2 border-white shadow-md flex-shrink-0">
              {userProfile.name?.charAt(0)}
            </div>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h2 className="font-display font-bold text-[18px] text-ink truncate leading-tight">
                {userProfile.name}
              </h2>
              
              {/* VIP Crown Icon directly next to name */}
              {isVipUser && (
                <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 border border-gold/40 shadow-sm" title={isEn ? 'VIP Member' : 'Membre VIP'}>
                  <CrownIcon className="w-3.5 h-3.5 text-gold fill-gold" />
                </div>
              )}
            </div>
          </div>

          {/* Pencil Icon Only Button */}
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            title={isEn ? 'Edit Profile' : 'Modifier le profil'}
            className="p-2.5 rounded-2xl bg-paper border border-surface-line hover:border-gold text-deep transition-all flex-shrink-0 shadow-sm active:scale-95"
          >
            <PenToolIcon className="w-4 h-4 text-deep" />
          </button>
        </div>

        {/* Dynamic Inline Edit Profile Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfileEdit} className="pt-3 border-t border-surface-line space-y-2.5 text-left animate-fadeIn">
            <div>
              <label className="block text-[9.5px] font-bold text-taupe uppercase mb-0.5">
                {isEn ? 'Full Name' : 'Nom et Prénom'}
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-surface-line text-[12.5px] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] font-bold text-taupe uppercase mb-0.5">Email</label>
                <input
                  type="text"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-paper border border-surface-line text-[12.5px] outline-none"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-taupe uppercase mb-0.5">
                  {isEn ? 'Phone' : 'Téléphone'}
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-paper border border-surface-line text-[12.5px] outline-none font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gold text-deep-2 py-2.5 rounded-xl font-bold text-[12px] shadow-sm mt-1"
            >
              {isEn ? 'Save Changes' : 'Sauvegarder les Modifications'}
            </button>
          </form>
        )}
      </div>

      {/* FULLY FUNCTIONAL INTERFACE LANGUAGE SELECTOR (FR / EN) */}
      <div className="bg-white border border-surface-line rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
        <span className="text-[12px] font-bold text-ink">
          {isEn ? 'App Interface Language' : "Langue de l'Interface Application"}
        </span>
        <div className="flex gap-1 bg-surface p-1 rounded-xl border border-surface-line">
          <button
            onClick={() => changeAppLanguage('fr')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              !isEn ? 'bg-gold text-paper shadow-sm' : 'text-taupe'
            }`}
          >
            Français
          </button>
          <button
            onClick={() => changeAppLanguage('en')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              isEn ? 'bg-gold text-paper shadow-sm' : 'text-taupe'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* REFINED STATS CARDS: Streak & Coins */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-surface-line rounded-2xl p-4 flex items-center gap-3 shadow-sm text-left">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center flex-shrink-0">
            <FlameIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <span className="font-display font-bold text-[16px] text-ink block">
              {userStreak} {isEn ? (userStreak > 1 ? 'Days' : 'Day') : (userStreak > 1 ? 'Jours' : 'Jour')}
            </span>
          </div>
        </div>

        <div
          onClick={() => setShowPaymentModal(true)}
          className="bg-white border border-surface-line rounded-2xl p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:border-gold text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
            <CoinIcon className="w-5 h-5 text-gold" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-taupe uppercase tracking-wider block">Coins</span>
            <span className="font-display font-bold text-[15px] text-ink">
              {userCoins}
            </span>
          </div>
        </div>
      </div>

      {/* REFINED STORE CARD: "Coins & VIP" */}
      <div
        onClick={() => setShowPaymentModal(true)}
        className="bg-gradient-to-r from-deep via-deep-2 to-deep p-4.5 rounded-3xl border border-gold/40 text-paper shadow-md flex items-center justify-between cursor-pointer hover:border-gold transition-all text-left group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gold text-deep-2 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <CrownIcon className="w-5 h-5 text-deep-2" />
          </div>
          <div>
            <h4 className="font-display font-bold text-[15px] text-paper">Coins & VIP</h4>
            <p className="text-[11.5px] text-[#8CA6A2]">
              {isEn ? 'Buy Coins or subscribe for unlimited access' : "Acheter des Coins ou s'abonner pour un accès illimité"}
            </p>
          </div>
        </div>
      </div>

      {/* Role-Protected Navigation Shortcuts */}
      <div className="space-y-2.5">
        {/* Admin Dashboard (Malick Only) */}
        {isAdmin && (
          <div
            onClick={() => navigate('/admin')}
            className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-deep to-deep-2 text-paper border border-gold/30 text-[13px] font-semibold flex items-center justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <BarChartIcon className="w-4 h-4 text-gold" />
              <span>{isEn ? 'Admin & Management Portal' : 'Portail Admin & Management'}</span>
            </div>
            <span className="text-[11px] text-gold-soft font-bold">Dashboard</span>
          </div>
        )}

        {/* Sole Writer Studio (Fatoumata & Admin) */}
        {isAuthor && (
          <div
            onClick={() => navigate('/publish')}
            className="px-4 py-3.5 rounded-2xl bg-white border border-surface-line text-[13px] font-semibold flex items-center justify-between cursor-pointer hover:border-gold shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <PenToolIcon className="w-4 h-4 text-deep" />
              <span>{isEn ? 'Writer Studio (Fatoumata)' : 'Studio Écrivaine (Fatoumata)'}</span>
            </div>
            <span className="text-[11px] text-taupe font-bold">{isEn ? 'Publish' : 'Publier'}</span>
          </div>
        )}

        {/* Reader Shortcuts */}
        <div
          onClick={() => navigate('/discover')}
          className="px-4 py-3.5 rounded-2xl bg-white border border-surface-line text-[13px] font-semibold flex items-center justify-between cursor-pointer hover:border-gold shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <BookOpenIcon className="w-4 h-4 text-gold" />
            <span>{isEn ? 'Explore Bilingual Library' : 'Explorer la Bibliothèque Bilingue'}</span>
          </div>
          <span className="text-[11px] text-taupe font-bold">{isEn ? 'View All' : 'Voir Tout'}</span>
        </div>
      </div>

      {/* Dynamic Saved Vocabulary Notebook */}
      <div className="space-y-2.5">
        <div
          onClick={() => setShowVocabModal(true)}
          className="px-4 py-3.5 rounded-2xl bg-white border border-surface-line text-[13px] font-semibold flex items-center justify-between cursor-pointer hover:border-gold shadow-sm text-left"
        >
          <span>{isEn ? 'Saved Vocabulary Notebook' : 'Carnet de Vocabulaire Sauvegardé'}</span>
          <span className="text-[11px] text-gold font-bold bg-gold/10 px-2.5 py-0.5 rounded-full">
            {savedVocab.length} {isEn ? 'Words Saved' : 'Mots Enregistrés'}
          </span>
        </div>
      </div>

      {/* APP GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-paper border border-surface-line rounded-3xl p-6 w-full max-w-md text-left relative shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-surface-line pb-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-gold" />
                <h3 className="font-display font-bold text-[18px] text-ink">
                  {isEn ? 'Koko App Guide' : "Guide d'Utilisation Koko"}
                </h3>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="text-taupe text-lg font-bold">
                ×
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1 text-[12.5px] text-ink">
              <div className="bg-white p-3.5 rounded-2xl border border-surface-line space-y-1">
                <div className="flex items-center gap-2 text-deep font-bold text-[13px]">
                  <BookOpenIcon className="w-4 h-4 text-gold" />
                  <span>1. {isEn ? '3D Immersive Reader Mode' : 'Mode de Lecture 3D Immersive'}</span>
                </div>
                <p className="text-taupe text-[12px] leading-relaxed">
                  {isEn ? 'Click any novel to open the 3D reader. Turn pages like a real book and see French translation under each sentence.' : 'Cliquez sur n\'importe quel roman pour ouvrir le lecteur 3D immersif en plein écran. Vous pouvez faire tourner les pages comme un vrai livre papier et lire la traduction française en écho sous chaque phrase anglaise.'}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-surface-line space-y-1">
                <div className="flex items-center gap-2 text-deep font-bold text-[13px]">
                  <VolumeIcon className="w-4 h-4 text-gold" />
                  <span>2. {isEn ? 'Audio Narration & Speed' : 'Narration Audio & Vitesse'}</span>
                </div>
                <p className="text-taupe text-[12px] leading-relaxed">
                  {isEn ? 'Each chapter includes synchronized audio. Listen to natural English pronunciation and adjust speed (0.75x, 1.0x, 1.25x).' : 'Chaque chapitre contient un lecteur audio synchrone. Vous pouvez écouter la prononciation anglaise naturelle et ajuster la vitesse d\'écoute (0.75x, 1.0x, 1.25x).'}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-surface-line space-y-1">
                <div className="flex items-center gap-2 text-deep font-bold text-[13px]">
                  <CoinIcon className="w-4 h-4 text-gold" />
                  <span>3. {isEn ? 'Unlocking Chapters with Coins' : 'Déblocage de Chapitres avec des Coins'}</span>
                </div>
                <p className="text-taupe text-[12px] leading-relaxed">
                  {isEn ? 'Chapter 1 of every book is 100% free! Unlock early access chapters using Coins via Wave or Orange Money.' : 'Le chapitre 1 de chaque roman est 100% gratuit ! Pour accéder aux chapitres d\'accès anticipé, vous pouvez recharger votre solde de Coins en un clic via Wave ou Orange Money.'}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-surface-line space-y-1">
                <div className="flex items-center gap-2 text-deep font-bold text-[13px]">
                  <FlameIcon className="w-4 h-4 text-orange-500" />
                  <span>4. {isEn ? 'Vocabulary Notebook & Quizzes' : 'Carnet de Vocabulaire & Quiz'}</span>
                </div>
                <p className="text-taupe text-[12px] leading-relaxed">
                  {isEn ? 'Tap any word while reading to save it to your notebook. Take interactive quizzes at the end of chapters.' : 'Tapez sur n\'importe quel mot en cours de lecture pour l\'ajouter à votre carnet personnel. À la fin de chaque chapitre, un modal de Quiz interactif apparaît pour tester votre compréhension.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-gold text-paper font-bold py-3 rounded-2xl shadow-sm hover:opacity-90 transition-all text-[13px]"
            >
              {isEn ? 'Got it, Start Reading!' : 'J\'ai Compris, Commencer à Lire'}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Saved Vocabulary Notebook Modal */}
      {showVocabModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-paper border border-surface-line rounded-3xl p-6 w-full max-w-md text-left relative shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-surface-line pb-3">
              <div>
                <h3 className="font-display font-bold text-[16px] text-ink">
                  {isEn ? `Vocabulary Notebook (${savedVocab.length})` : `Carnet de Vocabulaire (${savedVocab.length})`}
                </h3>
                <p className="text-[11px] text-taupe font-medium mt-0.5">
                  {isEn ? 'Multi-meaning learning notebook' : 'Carnet d\'apprentissage & significations multiples'}
                </p>
              </div>
              <button onClick={() => setShowVocabModal(false)} className="w-7 h-7 rounded-full bg-surface-line/50 text-taupe text-lg font-bold flex items-center justify-center">
                ×
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {savedVocab.length === 0 ? (
                <p className="text-[12px] text-taupe text-center py-8">
                  {isEn ? 'No words saved yet.' : 'Aucun mot enregistré. Touchez un mot pendant la lecture pour l\'enregistrer ici !'}
                </p>
              ) : (
                savedVocab.map((w) => {
                  const meaningsList = Array.isArray(w.meanings) ? w.meanings : [w.fr || w.en];
                  return (
                    <div key={w.id} className="p-3.5 rounded-2xl bg-white border border-surface-line space-y-2 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-extrabold text-ink text-[15px] capitalize">{w.en}</span>
                            {w.timesSaved > 1 && (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                                Enregistré {w.timesSaved}×
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-taupe block font-medium mt-0.5">{w.date || 'À l\'instant'}</span>
                        </div>
                        <button
                          onClick={() => removeVocabWord(w.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Supprimer ce mot"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Meanings Badges */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-taupe block">Signification(s) :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {meaningsList.map((m, mIdx) => (
                            <span key={mIdx} className="text-[11.5px] font-bold px-2.5 py-1 rounded-xl bg-gold/10 border border-gold/25 text-ink flex items-center gap-1.5">
                              <span>• {m}</span>
                              {meaningsList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeVocabMeaning(w.id, mIdx)}
                                  className="text-red-500 hover:text-red-700 font-bold text-[10px] ml-0.5"
                                  title="Supprimer cette signification"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wave & Orange Money Payment Modal (Coin Store & Monthly Subscriptions) */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
