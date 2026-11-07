import '@servicenow/sdk/global'
import { Acl, Role } from '@servicenow/sdk/core'

export const shotSetUser = Role({
    name: 'x_snc_meccha_oct_1.user',
    description: 'Meccha Octopus BA user. Grants full CRUD access to Shot Set records and the /pool endpoint.',
})

export const shotSetReadAcl = Acl({
    $id: Now.ID['shot_set_read_acl'],
    type: 'record',
    table: 'x_snc_meccha_oct_1_shot_set',
    operation: 'read',
    decisionType: 'allow',
    adminOverrides: true,
    roles: ['admin', shotSetUser],
    description: 'Read Shot Set records',
})

export const shotSetWriteAcl = Acl({
    $id: Now.ID['shot_set_write_acl'],
    type: 'record',
    table: 'x_snc_meccha_oct_1_shot_set',
    operation: 'write',
    decisionType: 'allow',
    adminOverrides: true,
    roles: ['admin', shotSetUser],
    description: 'Update Shot Set records',
})

export const shotSetCreateAcl = Acl({
    $id: Now.ID['shot_set_create_acl'],
    type: 'record',
    table: 'x_snc_meccha_oct_1_shot_set',
    operation: 'create',
    decisionType: 'allow',
    adminOverrides: true,
    roles: ['admin', shotSetUser],
    description: 'Create Shot Set records',
})

export const shotSetDeleteAcl = Acl({
    $id: Now.ID['shot_set_delete_acl'],
    type: 'record',
    table: 'x_snc_meccha_oct_1_shot_set',
    operation: 'delete',
    decisionType: 'allow',
    adminOverrides: true,
    roles: ['admin', shotSetUser],
    description: 'Delete Shot Set records',
})
