import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import useAuthStore from '../store/useAuthStore';
import {
  User as UserIcon,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Calendar,
  FileText,
  Award,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuthStore();

  // Profile info state
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Active section tab
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security'

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (!name.trim()) {
      setProfileMessage({ type: 'error', text: 'Name cannot be blank.' });
      return;
    }

    setIsSavingProfile(true);
    const res = await updateProfile({ name: name.trim(), avatar: avatar.trim() });
    setIsSavingProfile(false);

    if (res.success) {
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } else {
      setProfileMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    const hasExistingPassword = user?.hasPassword !== false && user?.authProvider !== 'google';

    if (hasExistingPassword && !currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (hasExistingPassword && currentPassword === newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password cannot be identical to current password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword({ currentPassword, newPassword });
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordMessage({
        type: 'success',
        text: 'Password successfully updated! All other active sessions have been invalidated.'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 5000);
    } else {
      setPasswordMessage({ type: 'error', text: res.message || 'Failed to update password.' });
    }
  };

  const formattedJoinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Active Member';

  const createdCount = Array.isArray(user?.createdTests) ? user.createdTests.length : 0;
  const attemptedCount = Array.isArray(user?.attemptedTests) ? user.attemptedTests.length : 0;
  const isGoogleUserWithoutPassword = user?.authProvider === 'google' && !user?.hasPassword;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'User Profile', path: '/profile' }
          ]}
        />

        {/* User Identity Header Card */}
        <section className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Circle */}
            <div className="relative group shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600/20 dark:border-indigo-500/30 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-600/20">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8" />}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white dark:border-[#131926] rounded-full p-1" title="Account Active">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* User Meta Information */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {user?.name || 'Candidate'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  <Sparkles className="w-3 h-3" />
                  {user?.authProvider === 'google' ? 'Google Account' : 'Standard Member'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined {formattedJoinDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{createdCount}</strong> Tests Created
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{attemptedCount}</strong> Attempts
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 cursor-pointer ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Personal Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Security & Password
          </button>
        </div>

        {/* TAB 1: Personal Details */}
        {activeTab === 'general' && (
          <section className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="max-w-xl">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Personal Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Update your display name and public profile details.
              </p>

              {profileMessage.text && (
                <div
                  className={`p-3.5 mb-5 rounded-lg text-xs flex items-center gap-2.5 transition-all ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                      : 'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Email address is tied to your account identity and cannot be edited directly.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Paste a direct image URL or leave empty to use default initials.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* TAB 2: Security & Password */}
        {activeTab === 'security' && (
          <section className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="max-w-xl">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Password & Session Security
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Ensure your account is protected with a secure password.
              </p>

              {/* Security Advisory Callout */}
              <div className="p-3.5 mb-6 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950 dark:text-amber-200">
                    Automatic Session Invalidation
                  </p>
                  <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed text-[11px]">
                    Whenever you update your password, any existing JWT tokens or stored cookies across all other active devices will be automatically revoked. Your current session will be issued a renewed token seamlessly.
                  </p>
                </div>
              </div>

              {passwordMessage.text && (
                <div
                  className={`p-3.5 mb-5 rounded-lg text-xs flex items-center gap-2.5 transition-all ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                      : 'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                  }`}
                >
                  {passwordMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              {isGoogleUserWithoutPassword ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-800 space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Signed in with Google Single Sign-On</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You currently sign in via your Google account credentials. You can set a password below if you wish to enable standard email & password sign-in as an alternative option.
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {!isGoogleUserWithoutPassword && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3.5 py-2 pr-10 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {isGoogleUserWithoutPassword ? 'Set Account Password' : 'New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2 pr-10 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2 pr-10 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="pt-1 pb-2 space-y-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Minimum 6 characters long</span>
                  </div>
                  {newPassword && confirmPassword && (
                    <div className={`flex items-center gap-1.5 ${newPassword === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match yet'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
