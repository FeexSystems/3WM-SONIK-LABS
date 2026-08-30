/**
 * 3WM SONIK — Multi-Tenant Organization & Workspace Service (Pillar 5: SaaS Multi-Tenancy)
 * Manages creator teams, studio workspaces, RBAC permissions, and compute credit allocation.
 */

export type OrganizationRole = 'OWNER' | 'PRODUCER' | 'MIX_ENGINEER' | 'VOCALIST' | 'VIEWER';

export interface OrganizationMember {
  userId: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  joinedAt: number;
}

export interface StudioWorkspace {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO_STUDIO' | 'MASTER_LABEL';
  ownerId: string;
  members: OrganizationMember[];
  aiCreditsAllocated: number;
  aiCreditsUsed: number;
  storageLimitGb: number;
  storageUsedGb: number;
  projectIds: string[];
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_WORKSPACES: StudioWorkspace[] = [
  {
    id: 'org-personal-001',
    name: 'Personal Studio',
    slug: 'personal-studio',
    plan: 'PRO_STUDIO',
    ownerId: 'current-user',
    members: [
      {
        userId: 'current-user',
        email: 'producer@3wmsonik.ai',
        displayName: 'Lead Producer',
        role: 'OWNER',
        joinedAt: Date.now() - 30 * 24 * 3600 * 1000,
      },
    ],
    aiCreditsAllocated: 5000,
    aiCreditsUsed: 1240,
    storageLimitGb: 50,
    storageUsedGb: 8.4,
    projectIds: ['proj-001', 'proj-002'],
    createdAt: Date.now() - 30 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'org-label-002',
    name: 'Lagos Hit Factory',
    slug: 'lagos-hit-factory',
    plan: 'MASTER_LABEL',
    ownerId: 'current-user',
    members: [
      {
        userId: 'current-user',
        email: 'producer@3wmsonik.ai',
        displayName: 'Lead Producer',
        role: 'OWNER',
        joinedAt: Date.now() - 15 * 24 * 3600 * 1000,
      },
      {
        userId: 'user-emar',
        email: 'emar@3wmsonik.ai',
        displayName: 'Kappachino Emar',
        role: 'MIX_ENGINEER',
        joinedAt: Date.now() - 14 * 24 * 3600 * 1000,
      },
      {
        userId: 'user-ricky',
        email: 'ricky@3wmsonik.ai',
        displayName: 'Kappachino Ricky',
        role: 'PRODUCER',
        joinedAt: Date.now() - 14 * 24 * 3600 * 1000,
      },
      {
        userId: 'user-kingpin',
        email: 'kingpin@3wmsonik.ai',
        displayName: 'Kingpin',
        role: 'VOCALIST',
        joinedAt: Date.now() - 14 * 24 * 3600 * 1000,
      },
    ],
    aiCreditsAllocated: 25000,
    aiCreditsUsed: 8400,
    storageLimitGb: 500,
    storageUsedGb: 42.1,
    projectIds: ['proj-afro-001', 'proj-amapiano-002'],
    createdAt: Date.now() - 15 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
];

class OrganizationService {
  private workspaces: Map<string, StudioWorkspace> = new Map();
  private activeWorkspaceId: string = 'org-personal-001';
  private listeners: Array<(activeWorkspace: StudioWorkspace) => void> = [];

  constructor() {
    // Initialize default workspaces
    DEFAULT_WORKSPACES.forEach((w) => this.workspaces.set(w.id, w));
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedId = localStorage.getItem('3wm_active_workspace_id');
        if (savedId && this.workspaces.has(savedId)) {
          this.activeWorkspaceId = savedId;
        }
        const savedWorkspaces = localStorage.getItem('3wm_workspaces');
        if (savedWorkspaces) {
          const parsed: StudioWorkspace[] = JSON.parse(savedWorkspaces);
          parsed.forEach((w) => this.workspaces.set(w.id, w));
        }
      }
    } catch {
      // Safe fallback
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('3wm_active_workspace_id', this.activeWorkspaceId);
        localStorage.setItem(
          '3wm_workspaces',
          JSON.stringify(Array.from(this.workspaces.values()))
        );
      }
    } catch {
      // Safe fallback
    }
  }

  public getWorkspaces(): StudioWorkspace[] {
    return Array.from(this.workspaces.values());
  }

  public getActiveWorkspace(): StudioWorkspace {
    return this.workspaces.get(this.activeWorkspaceId) || DEFAULT_WORKSPACES[0];
  }

  public setActiveWorkspace(workspaceId: string): boolean {
    if (this.workspaces.has(workspaceId)) {
      this.activeWorkspaceId = workspaceId;
      this.saveToStorage();
      const current = this.getActiveWorkspace();
      this.listeners.forEach((fn) => fn(current));
      return true;
    }
    return false;
  }

  public createWorkspace(
    name: string,
    plan: StudioWorkspace['plan'] = 'PRO_STUDIO'
  ): StudioWorkspace {
    const id = `org-${Date.now()}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newWorkspace: StudioWorkspace = {
      id,
      name,
      slug,
      plan,
      ownerId: 'current-user',
      members: [
        {
          userId: 'current-user',
          email: 'producer@3wmsonik.ai',
          displayName: 'Lead Producer',
          role: 'OWNER',
          joinedAt: Date.now(),
        },
      ],
      aiCreditsAllocated: plan === 'MASTER_LABEL' ? 25000 : plan === 'PRO_STUDIO' ? 5000 : 1000,
      aiCreditsUsed: 0,
      storageLimitGb: plan === 'MASTER_LABEL' ? 500 : plan === 'PRO_STUDIO' ? 50 : 5,
      storageUsedGb: 0,
      projectIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.workspaces.set(id, newWorkspace);
    this.setActiveWorkspace(id);
    this.saveToStorage();
    return newWorkspace;
  }

  public addMember(
    workspaceId: string,
    email: string,
    displayName: string,
    role: OrganizationRole
  ): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const existing = workspace.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      existing.role = role;
    } else {
      workspace.members.push({
        userId: `user-${Date.now()}`,
        email,
        displayName,
        role,
        joinedAt: Date.now(),
      });
    }

    workspace.updatedAt = Date.now();
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  public removeMember(workspaceId: string, userId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    workspace.members = workspace.members.filter((m) => m.userId !== userId);
    workspace.updatedAt = Date.now();
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  public deductAiCredits(amount: number): boolean {
    const workspace = this.getActiveWorkspace();
    if (workspace.aiCreditsUsed + amount > workspace.aiCreditsAllocated) {
      return false; // Insufficient credits
    }
    workspace.aiCreditsUsed += amount;
    workspace.updatedAt = Date.now();
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  public subscribe(callback: (activeWorkspace: StudioWorkspace) => void): () => void {
    this.listeners.push(callback);
    callback(this.getActiveWorkspace());
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  private notifyListeners() {
    const current = this.getActiveWorkspace();
    this.listeners.forEach((fn) => fn(current));
  }
}

export const organizationService = new OrganizationService();
