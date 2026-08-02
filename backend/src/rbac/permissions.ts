/**
 * Central permission catalogue.
 *
 * This file is the single source of truth for what can be done in the platform.
 * A near-identical copy lives at `src/lib/permissions.ts` so the UI can hide
 * controls the user cannot use — but the server is always the authority.
 */

export const PERMISSIONS = [
  // Organization
  'org:view',
  'org:update',
  'org:delete',
  'org:billing',
  'org:security',

  // Departments
  'department:view',
  'department:create',
  'department:update',
  'department:delete',

  // Projects
  'project:view',
  'project:create',
  'project:update',
  'project:delete',
  'project:archive',

  // Teams
  'team:view',
  'team:create',
  'team:update',
  'team:delete',

  // Members & invitations
  'member:view',
  'member:invite',
  'member:update',
  'member:remove',
  'member:assign_role',

  // Roles
  'role:view',
  'role:create',
  'role:update',
  'role:delete',

  // Tasks
  'task:view',
  'task:create',
  'task:update',
  'task:delete',
  'task:assign',
  'task:comment',

  // Audit & compliance
  'audit:view',

  // Forward-looking modules (shells today, guarded from day one)
  'hr:view',
  'hr:manage',
  'devops:view',
  'devops:manage',
  'analytics:view',
  'analytics:manage',
  'automation:view',
  'automation:manage',
  'integration:view',
  'integration:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Wildcard held by Super Admin / Org Owner. */
export const ALL_PERMISSIONS = '*';

export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Organization: ['org:view', 'org:update', 'org:delete', 'org:billing', 'org:security'],
  Departments: [
    'department:view',
    'department:create',
    'department:update',
    'department:delete',
  ],
  Projects: [
    'project:view',
    'project:create',
    'project:update',
    'project:delete',
    'project:archive',
  ],
  Teams: ['team:view', 'team:create', 'team:update', 'team:delete'],
  Members: [
    'member:view',
    'member:invite',
    'member:update',
    'member:remove',
    'member:assign_role',
  ],
  Roles: ['role:view', 'role:create', 'role:update', 'role:delete'],
  Tasks: [
    'task:view',
    'task:create',
    'task:update',
    'task:delete',
    'task:assign',
    'task:comment',
  ],
  Governance: ['audit:view'],
  'People Ops': ['hr:view', 'hr:manage'],
  Engineering: ['devops:view', 'devops:manage'],
  Insights: ['analytics:view', 'analytics:manage'],
  Platform: [
    'automation:view',
    'automation:manage',
    'integration:view',
    'integration:manage',
  ],
};

export interface SystemRoleDefinition {
  key: string;
  name: string;
  description: string;
  /** Lower rank == more authority. Used for reporting hierarchy defaults. */
  rank: number;
  permissions: Permission[] | typeof ALL_PERMISSIONS;
}

const VIEW_ONLY: Permission[] = [
  'org:view',
  'department:view',
  'project:view',
  'team:view',
  'member:view',
  'task:view',
];

const CONTRIBUTOR: Permission[] = [
  ...VIEW_ONLY,
  'task:create',
  'task:update',
  'task:comment',
  'analytics:view',
];

export const SYSTEM_ROLES: SystemRoleDefinition[] = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Platform owner. Unrestricted access across every organization.',
    rank: 0,
    permissions: ALL_PERMISSIONS,
  },
  {
    key: 'org_admin',
    name: 'Organization Admin',
    description:
      'Runs the organization: structure, people, roles, security and analytics.',
    rank: 1,
    permissions: ALL_PERMISSIONS,
  },
  {
    key: 'hr_manager',
    name: 'HR Manager',
    description: 'People operations, onboarding, reviews and workforce records.',
    rank: 2,
    permissions: [
      ...VIEW_ONLY,
      'member:invite',
      'member:update',
      'member:remove',
      'hr:view',
      'hr:manage',
      'analytics:view',
      'audit:view',
    ],
  },
  {
    key: 'project_manager',
    name: 'Project Manager',
    description: 'Owns delivery for one or more projects end to end.',
    rank: 2,
    permissions: [
      ...CONTRIBUTOR,
      'project:create',
      'project:update',
      'project:archive',
      'team:create',
      'team:update',
      'member:invite',
      'member:assign_role',
      'task:delete',
      'task:assign',
      'audit:view',
      'automation:view',
      'automation:manage',
    ],
  },
  {
    key: 'team_leader',
    name: 'Team Leader',
    description: 'Leads a team or sub-team and distributes workload.',
    rank: 3,
    permissions: [
      ...CONTRIBUTOR,
      'team:create',
      'team:update',
      'member:invite',
      'member:assign_role',
      'task:delete',
      'task:assign',
      'automation:view',
    ],
  },
  {
    key: 'developer',
    name: 'Developer',
    description: 'Builds and ships product work.',
    rank: 4,
    permissions: [...CONTRIBUTOR, 'devops:view'],
  },
  {
    key: 'designer',
    name: 'Designer',
    description: 'Owns product and visual design work.',
    rank: 4,
    permissions: CONTRIBUTOR,
  },
  {
    key: 'qa_engineer',
    name: 'QA Engineer',
    description: 'Verifies quality, files and tracks defects.',
    rank: 4,
    permissions: [...CONTRIBUTOR, 'devops:view'],
  },
  {
    key: 'devops_engineer',
    name: 'DevOps Engineer',
    description: 'Owns pipelines, environments and infrastructure health.',
    rank: 4,
    permissions: [...CONTRIBUTOR, 'devops:view', 'devops:manage', 'integration:view'],
  },
  {
    key: 'researcher',
    name: 'Researcher',
    description: 'Runs discovery, research and analysis work.',
    rank: 4,
    permissions: CONTRIBUTOR,
  },
  {
    key: 'intern',
    name: 'Intern',
    description: 'Limited contributor under supervision.',
    rank: 5,
    permissions: [...VIEW_ONLY, 'task:update', 'task:comment'],
  },
  {
    key: 'client',
    name: 'Client',
    description: 'External stakeholder with read and approval access.',
    rank: 6,
    permissions: ['project:view', 'task:view', 'task:comment'],
  },
  {
    key: 'guest',
    name: 'Guest',
    description: 'Minimal read-only visibility.',
    rank: 7,
    permissions: ['project:view', 'task:view'],
  },
];

export const SYSTEM_ROLE_KEYS = SYSTEM_ROLES.map((role) => role.key);

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
