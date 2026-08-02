/**
 * One-off migration: gives every existing user an Organization, an Org Admin
 * membership and a default project, then attaches their tasks to it.
 *
 * Run with: npm run migrate:rbac
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import User from '../models/userModel';
import Task from '../models/taskModel';
import Organization from '../models/org/organizationModel';
import Project from '../models/org/projectModel';
import Membership from '../models/org/membershipModel';
import { ensureSystemRoles } from '../services/permissionService';

const slugify = (value: string, fallback: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || fallback;

async function migrate() {
  await connectDB();
  const roles = await ensureSystemRoles();
  const orgAdmin = roles.get('org_admin');
  const memberRole = roles.get('developer');
  if (!orgAdmin || !memberRole) throw new Error('System roles missing');

  // Admins (or users with no creator) each get their own organization.
  const owners = await User.find({ $or: [{ createdBy: null }, { role: 'admin' }] });

  for (const owner of owners) {
    const existing = await Membership.findOne({ user: owner._id });
    if (existing) continue;

    let slug = slugify(owner.organization || owner.name, String(owner._id).slice(-6));
    let attempt = 1;
    while (await Organization.exists({ slug })) slug = `${slug}-${attempt++}`;

    const organization = await Organization.create({
      name: owner.organization || `${owner.name}'s Organization`,
      slug,
      owner: owner._id,
    });

    await Membership.create({
      organization: organization._id,
      user: owner._id,
      role: orgAdmin._id,
      scopeType: 'organization',
    });

    const project = await Project.create({
      organization: organization._id,
      name: 'General',
      key: 'GEN',
      description: 'Default project created during the RBAC migration.',
      lead: owner._id,
    });

    await Task.updateMany(
      { owner: owner._id },
      { organization: organization._id, project: project._id }
    );

    // Members created by this owner join the same organization.
    const members = await User.find({ createdBy: owner._id });
    for (const member of members) {
      await Membership.findOneAndUpdate(
        {
          organization: organization._id,
          user: member._id,
          scopeType: 'organization',
          scopeId: null,
        },
        {
          organization: organization._id,
          user: member._id,
          role: memberRole._id,
          scopeType: 'organization',
          reportsTo: owner._id,
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      await Task.updateMany(
        { owner: member._id },
        { organization: organization._id, project: project._id }
      );
    }

    console.log(`Migrated ${owner.email} -> ${organization.name}`);
  }

  await mongoose.connection.close();
  console.log('RBAC migration complete.');
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
