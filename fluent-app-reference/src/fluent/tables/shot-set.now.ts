import '@servicenow/sdk/global'
import { Table, StringColumn, IntegerColumn, FloatColumn, Form, default_view } from '@servicenow/sdk/core'

export const x_snc_meccha_oct_1_shot_set = Table({
    name: 'x_snc_meccha_oct_1_shot_set',
    label: 'Shot Set',
    display: 'label',
    audit: true,
    allowWebServiceAccess: true,
    accessibleFrom: 'public',
    callerAccess: 'tracking',
    actions: { read: true, create: true, update: true, delete: true },
    schema: {
        label: StringColumn({ label: 'Label', maxLength: 80 }),
        x: IntegerColumn({ label: 'X' }),
        y: IntegerColumn({ label: 'Y' }),
        shots: IntegerColumn({ label: 'Shots' }),
        survival: FloatColumn({ label: 'Survival' }),
        backend: StringColumn({ label: 'Backend', maxLength: 80 }),
        qubits: StringColumn({ label: 'Qubits', maxLength: 20 }),
        bits: StringColumn({
            label: 'Bits',
            // One token per shot: two characters from the alphabet 'ab', tokens joined by spaces.
            maxLength: 65000,
        }),
    },
    index: [{ name: 'shot_set_xy', unique: false, element: ['x', 'y'] }],
})

Form({
    table: 'x_snc_meccha_oct_1_shot_set',
    view: default_view,
    sections: [
        {
            caption: 'Shot Set',
            content: [
                {
                    layout: 'two-column',
                    leftElements: [
                        { field: 'label', type: 'table_field' },
                        { field: 'x', type: 'table_field' },
                        { field: 'y', type: 'table_field' },
                        { field: 'shots', type: 'table_field' },
                    ],
                    rightElements: [
                        { field: 'survival', type: 'table_field' },
                        { field: 'backend', type: 'table_field' },
                        { field: 'qubits', type: 'table_field' },
                    ],
                },
                {
                    layout: 'one-column',
                    elements: [{ field: 'bits', type: 'table_field' }],
                },
            ],
        },
    ],
})
