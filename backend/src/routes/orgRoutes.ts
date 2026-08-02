import { Router } from 'express';
import {
  protect,
  withOrganization,
  requirePermission,
} from '../middleware/authMiddleware';
import {
  listOrganizations,
  createOrganization,
  getContext,
  updateOrganization,
  deleteOrganization,
} from '../controllers/org/organizationController';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/org/departmentController';
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/org/projectController';
import {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/org/teamController';
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/org/roleController';
import {
  listMembers,
  updateMembership,
  removeMembership,
  grantScopedRole,
  listInvitations,
  createInvitation,
  revokeInvitation,
  acceptInvitation,
} from '../controllers/org/memberController';
import { listAuditLogs } from '../controllers/org/auditController';

const router = Router();

// Public: redeeming an invitation happens before the user has a session.
router.post('/invitations/accept', acceptInvitation);

router.use(protect);

// Organization selection does not need an active org context.
router.get('/organizations', listOrganizations);
router.post('/organizations', createOrganization);

router.use(withOrganization);

router.get('/context', getContext);
router.patch('/organization', requirePermission('org:update'), updateOrganization);
router.delete('/organization', requirePermission('org:delete'), deleteOrganization);

router.get('/departments', requirePermission('department:view'), listDepartments);
router.post('/departments', requirePermission('department:create'), createDepartment);
router.patch(
  '/departments/:id',
  requirePermission('department:update', (req) => ({
    type: 'department',
    id: req.params.id,
  })),
  updateDepartment
);
router.delete(
  '/departments/:id',
  requirePermission('department:delete', (req) => ({
    type: 'department',
    id: req.params.id,
  })),
  deleteDepartment
);

router.get('/projects', requirePermission('project:view'), listProjects);
router.post('/projects', requirePermission('project:create'), createProject);
router.patch(
  '/projects/:id',
  requirePermission('project:update', (req) => ({ type: 'project', id: req.params.id })),
  updateProject
);
router.delete(
  '/projects/:id',
  requirePermission('project:delete', (req) => ({ type: 'project', id: req.params.id })),
  deleteProject
);

router.get('/teams', requirePermission('team:view'), listTeams);
router.post('/teams', requirePermission('team:create'), createTeam);
router.patch(
  '/teams/:id',
  requirePermission('team:update', (req) => ({ type: 'team', id: req.params.id })),
  updateTeam
);
router.delete(
  '/teams/:id',
  requirePermission('team:delete', (req) => ({ type: 'team', id: req.params.id })),
  deleteTeam
);

router.get('/roles', requirePermission('role:view'), listRoles);
router.post('/roles', requirePermission('role:create'), createRole);
router.patch('/roles/:id', requirePermission('role:update'), updateRole);
router.delete('/roles/:id', requirePermission('role:delete'), deleteRole);

router.get('/members', requirePermission('member:view'), listMembers);
router.patch('/members/:id', requirePermission('member:update'), updateMembership);
router.delete('/members/:id', requirePermission('member:remove'), removeMembership);
router.post(
  '/members/:userId/grants',
  requirePermission('member:assign_role'),
  grantScopedRole
);

router.get('/invitations', requirePermission('member:view'), listInvitations);
router.post('/invitations', requirePermission('member:invite'), createInvitation);
router.delete('/invitations/:id', requirePermission('member:invite'), revokeInvitation);

router.get('/audit-logs', requirePermission('audit:view'), listAuditLogs);

export default router;
