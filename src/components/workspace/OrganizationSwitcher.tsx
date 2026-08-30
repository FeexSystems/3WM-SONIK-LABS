/**
 * 3WM SONIK — Organization & Studio Workspace Switcher (Pillar 5: SaaS Multi-Tenancy)
 * Seamlessly switches active tenant context, displays team members, RBAC roles, and real-time AI compute tokens.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Users,
  Sparkles,
  HardDrive,
  Shield,
  UserPlus,
  X,
} from 'lucide-react';
import {
  organizationService,
  StudioWorkspace,
  OrganizationRole,
} from '../../services/organizationService';

export const OrganizationSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<StudioWorkspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<StudioWorkspace>(
    organizationService.getActiveWorkspace()
  );

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('PRODUCER');

  // Create Workspace Form State
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspacePlan, setNewWorkspacePlan] = useState<StudioWorkspace['plan']>('PRO_STUDIO');

  useEffect(() => {
    const unsubscribe = organizationService.subscribe((ws) => {
      setActiveWorkspace(ws);
      setWorkspaces(organizationService.getWorkspaces());
    });
    return unsubscribe;
  }, []);

  const handleSelectWorkspace = (id: string) => {
    organizationService.setActiveWorkspace(id);
    setIsOpen(false);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    organizationService.addMember(
      activeWorkspace.id,
      inviteEmail,
      inviteName || inviteEmail.split('@')[0],
      inviteRole
    );
    setInviteEmail('');
    setInviteName('');
    setIsInviteModalOpen(false);
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    organizationService.createWorkspace(newWorkspaceName.trim(), newWorkspacePlan);
    setNewWorkspaceName('');
    setIsCreateModalOpen(false);
    setIsOpen(false);
  };

  const getPlanBadge = (plan: StudioWorkspace['plan']) => {
    if (plan === 'MASTER_LABEL') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#f5a800]/20 text-[#f5a800] border border-[#f5a800]/30">
          MASTER LABEL
        </span>
      );
    }
    if (plan === 'PRO_STUDIO') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2affa3]/20 text-[#2affa3] border border-[#2affa3]/30">
          PRO STUDIO
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/70 border border-white/20">
        FREE TIER
      </span>
    );
  };

  const creditPercentage = Math.min(
    100,
    Math.round((activeWorkspace.aiCreditsUsed / activeWorkspace.aiCreditsAllocated) * 100)
  );

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/10 bg-[#181410] hover:border-[#f5a800]/40 transition-colors text-left"
      >
        <div className="w-6 h-6 rounded-lg bg-[#f5a800]/15 border border-[#f5a800]/30 flex items-center justify-center text-[#f5a800]">
          <Building2 size={13} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white tracking-wide truncate max-w-[130px]">
            {activeWorkspace.name}
          </span>
          <span className="text-[10px] text-white/50 font-mono">
            {activeWorkspace.members.length} Member{activeWorkspace.members.length > 1 ? 's' : ''}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 w-72 z-50 rounded-2xl border border-white/15 bg-[#120F0C] p-3 shadow-2xl backdrop-blur-xl"
            >
              {/* Active Workspace Telemetry */}
              <div className="p-3 rounded-xl border border-white/10 bg-[#181410] mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{activeWorkspace.name}</span>
                  {getPlanBadge(activeWorkspace.plan)}
                </div>

                {/* AI Token Usage Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/60">
                    <span className="flex items-center gap-1 text-[#2affa3]">
                      <Sparkles size={10} /> AI Compute
                    </span>
                    <span>
                      {activeWorkspace.aiCreditsUsed.toLocaleString()} /{' '}
                      {activeWorkspace.aiCreditsAllocated.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2affa3] to-[#f5a800] rounded-full transition-all duration-300"
                      style={{ width: `${creditPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Storage Meter */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-white/50">
                  <span className="flex items-center gap-1">
                    <HardDrive size={10} /> Cloud Stems
                  </span>
                  <span>
                    {activeWorkspace.storageUsedGb} GB / {activeWorkspace.storageLimitGb} GB
                  </span>
                </div>
              </div>

              {/* Workspace Switcher List */}
              <div className="space-y-1 mb-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 px-2 py-1">
                  Switch Workspace
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                      ws.id === activeWorkspace.id
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs">
                        {ws.name.charAt(0)}
                      </div>
                      <span className="text-xs truncate max-w-[140px]">{ws.name}</span>
                    </div>
                    {ws.id === activeWorkspace.id && <Check size={13} className="text-[#2affa3]" />}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                <button
                  onClick={() => {
                    setIsInviteModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <UserPlus size={13} className="text-[#f5a800]" /> Invite Team Member
                </button>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Plus size={13} className="text-[#2affa3]" /> Create New Workspace
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#14100D] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#f5a800]/15 border border-[#f5a800]/30 flex items-center justify-center text-[#f5a800]">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Invite Collaborator</h3>
                    <p className="text-[11px] text-white/50">to {activeWorkspace.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="engineer@label.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder-white/30 focus:border-[#f5a800] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Mixing Engineer"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder-white/30 focus:border-[#f5a800] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">
                    Studio Role &amp; Permissions
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#181410] text-xs text-white focus:border-[#f5a800] focus:outline-none"
                  >
                    <option value="PRODUCER">PRODUCER — Full DAW &amp; Beat Lab access</option>
                    <option value="MIX_ENGINEER">
                      MIX_ENGINEER — Mixer, DSP &amp; Master access
                    </option>
                    <option value="VOCALIST">VOCALIST — Vocal Booth &amp; Take recording</option>
                    <option value="VIEWER">VIEWER — Read-only session monitoring</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#f5a800] text-black text-xs font-bold hover:scale-105 transition-transform"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#14100D] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2affa3]/15 border border-[#2affa3]/30 flex items-center justify-center text-[#2affa3]">
                    <Building2 size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Create New Studio Workspace</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateWorkspace} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Afro-Electro Lab"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder-white/30 focus:border-[#2affa3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">
                    Plan Tier
                  </label>
                  <select
                    value={newWorkspacePlan}
                    onChange={(e) => setNewWorkspacePlan(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#181410] text-xs text-white focus:border-[#2affa3] focus:outline-none"
                  >
                    <option value="PRO_STUDIO">PRO STUDIO (5,000 AI Credits, 50 GB Cloud)</option>
                    <option value="MASTER_LABEL">
                      MASTER LABEL (25,000 AI Credits, 500 GB Cloud)
                    </option>
                    <option value="FREE">FREE TIER (1,000 AI Credits, 5 GB Cloud)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#2affa3] text-black text-xs font-bold hover:scale-105 transition-transform"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
