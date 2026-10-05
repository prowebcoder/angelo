import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from './access'

/**
 * Who can sign in to the admin, and what they are allowed to do.
 *
 * Only a Super Admin sees this collection at all, so the role descriptions
 * here are written for the person handing out access — they say what each
 * role can reach, in the same words the rest of the admin uses.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Staff account', plural: 'Staff accounts' },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    defaultColumns: ['name', 'email', 'role'],
    listSearchableFields: ['name', 'email'],
    description:
      'Everyone who can sign in. Give each person their own account — never share one, or you cannot tell who changed what.',
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: isSuperAdmin,
    read: isSuperAdmin,
    update: isSuperAdmin,
    delete: isSuperAdmin,
  },
  defaultSort: 'name',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Full name',
      admin: { description: 'Shown when they sign in, and against anything they publish.' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      label: 'What they can do',
      admin: {
        position: 'sidebar',
        description: 'Give the smallest role that lets someone do their job. Only a Super Admin can change this.',
      },
      options: [
        {
          label: 'Super Admin — everything, including staff accounts and settings',
          value: 'super-admin',
        },
        { label: 'Editor — all website content, gowns and photographs', value: 'editor' },
        { label: 'Staff — enquiries only', value: 'staff' },
      ],
      access: {
        update: ({ req }) =>
          Boolean(req.user && typeof req.user === 'object' && 'role' in req.user && req.user.role === 'super-admin'),
      },
    },
  ],
}
