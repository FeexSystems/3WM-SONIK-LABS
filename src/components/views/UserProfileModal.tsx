import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  X,
  Camera,
  Music,
  Radio,
  Link2,
  Headphones,
  Mic2,
  Activity,
  Globe,
  CheckCircle2,
  Plus,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
  const { signOutUser } = useAuth();
  const [collabStatus, setCollabStatus] = useState(true);
  const [bio, setBio] = useState(
    'Award-winning Afrofusion producer and sound designer based in Lagos. Specializing in blending traditional rhythms with modern electronic synthesis.'
  );
  const [equipment, setEquipment] = useState(
    'Apollo Twin X\nNeumann U87\nProphet Rev2\nAbleton Push 2\nFocal Shape 65'
  );
  const [genres, setGenres] = useState('Afrobeat, Amapiano, Alté, R&B');
  const [credentials, setCredentials] = useState('Produced for Wizkid, Tems, Burna Boy');
  const [spotify, setSpotify] = useState('https://spotify.com/artist/...');
  const [soundcloud, setSoundcloud] = useState('https://soundcloud.com/...');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-800 bg-gradient-to-b from-neutral-800/40 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-neutral-950 flex items-center justify-center border border-neutral-800 text-amber-500 shadow-inner">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-neutral-100 tracking-wider">
                ARTIST DOSSIER
              </h2>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                Public Identity & Studio Configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Identity & Avatar */}
            <div className="lg:col-span-4 space-y-8">
              {/* Profile Avatar Placeholder */}
              <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer">
                  <div className="w-40 h-40 rounded-full bg-neutral-950 border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center text-neutral-500 group-hover:border-amber-500/50 group-hover:bg-neutral-900 transition-all">
                    <Camera className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 group-hover:text-amber-500 transition-colors" />
                    <span className="text-xs font-mono">UPLOAD PHOTO</span>
                  </div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black border-4 border-neutral-900">
                    <Plus className="w-4 h-4 font-bold" />
                  </div>
                </div>
                <h3 className="mt-4 font-bold text-xl text-neutral-100">{user.name}</h3>
                <p className="text-xs text-neutral-400 font-mono">{user.role}</p>
              </div>

              {/* Collaboration Status Toggle */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-300 uppercase">
                    Collaboration Status
                  </span>
                  <div
                    onClick={() => setCollabStatus(!collabStatus)}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${collabStatus ? 'bg-emar' : 'bg-neutral-800'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${collabStatus ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${collabStatus ? 'bg-emar animate-pulse' : 'bg-neutral-600'}`}
                  />
                  <span
                    className={`text-[10px] font-mono uppercase ${collabStatus ? 'text-emar' : 'text-neutral-500'}`}
                  >
                    {collabStatus ? 'Accepting Projects' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Bio, Credentials, Equipment */}
            <div className="lg:col-span-8 space-y-6">
              {/* Bio */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  <Mic2 className="w-3.5 h-3.5 text-amber-500" />
                  Artist Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-28 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-amber-500/50 resize-none font-sans"
                  placeholder="Tell your story..."
                />
              </div>

              {/* Grid for Genres & Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    <Music className="w-3.5 h-3.5 text-amber-500" />
                    Genre Specialties
                  </label>
                  <input
                    type="text"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500/50 font-sans"
                    placeholder="e.g. Afrobeat, Trap..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    Production Credentials
                  </label>
                  <input
                    type="text"
                    value={credentials}
                    onChange={(e) => setCredentials(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500/50 font-sans"
                    placeholder="Produced for..."
                  />
                </div>
              </div>

              {/* Equipment List */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  <Headphones className="w-3.5 h-3.5 text-amber-500" />
                  Studio Equipment List
                </label>
                <textarea
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 focus:outline-none focus:border-amber-500/50 resize-none font-mono leading-relaxed"
                  placeholder="List your gear..."
                />
              </div>

              {/* Streaming Links */}
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-amber-500" />
                  Streaming Platforms
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <input
                      type="text"
                      value={spotify}
                      onChange={(e) => setSpotify(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-neutral-800 rounded-xl leading-5 bg-neutral-950 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 sm:text-sm transition-colors"
                      placeholder="Spotify URL"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link2 className="h-4 w-4 text-orange-500" />
                    </div>
                    <input
                      type="text"
                      value={soundcloud}
                      onChange={(e) => setSoundcloud(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-neutral-800 rounded-xl leading-5 bg-neutral-950 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500/50 sm:text-sm transition-colors"
                      placeholder="SoundCloud URL"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-850 bg-neutral-950 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              signOutUser();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-red-400 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              SAVE PROFILE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
