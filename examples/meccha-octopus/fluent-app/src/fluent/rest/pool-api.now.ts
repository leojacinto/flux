import '@servicenow/sdk/global'
import { RestApi } from '@servicenow/sdk/core'

/**
 * Scripted REST API for Meccha Octopus BA.
 *
 * URI: /api/x_snc_meccha_oct_1/meccha_octopus_ba/pool
 * Authentication and authorization are required. The handler reads only local
 * shot_set rows -- no IBM calls and no outbound calls of any kind.
 */
const getPoolScript = `(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var sets = {};
    var backend = '';
    var qubits = '';
    var shots = 0;
    var survivalTotal = 0;
    var survivalCount = 0;

    var gr = new GlideRecordSecure('x_snc_meccha_oct_1_shot_set');
    gr.orderBy('x');
    gr.orderBy('y');
    gr.query();

    while (gr.next()) {
        var x = gr.getValue('x') || '0';
        var y = gr.getValue('y') || '0';
        sets[x + ',' + y] = gr.getValue('bits') || '';

        if (!backend) {
            backend = gr.getValue('backend') || '';
        }
        if (!qubits) {
            qubits = gr.getValue('qubits') || '';
        }

        var rowShots = parseInt(gr.getValue('shots') || '0', 10);
        if (!isNaN(rowShots) && rowShots > shots) {
            shots = rowShots;
        }

        var rowSurvival = parseFloat(gr.getValue('survival') || '');
        if (!isNaN(rowSurvival)) {
            survivalTotal += rowSurvival;
            survivalCount++;
        }
    }

    var inkSurvival = survivalCount > 0 ? survivalTotal / survivalCount : 0;

    response.setStatus(200);
    response.setBody({
        source: 'cached',
        backend: backend,
        qubits: qubits,
        shots: shots,
        inkSurvival: inkSurvival,
        sets: sets
    });
})(request, response);`

RestApi({
    $id: Now.ID['meccha_octopus_ba_api'],
    name: 'Meccha Octopus BA',
    serviceId: 'meccha_octopus_ba',
    active: true,
    consumes: 'application/json',
    produces: 'application/json',
    shortDescription: 'Cached shot pool for Meccha Octopus BA',
    routes: [
        {
            $id: Now.ID['meccha_octopus_ba_pool_get'],
            name: 'get pool',
            method: 'GET',
            path: '/pool',
            active: true,
            authentication: true,
            authorization: true,
            produces: 'application/json',
            shortDescription: 'Returns the cached shot pool read from shot_set rows',
            script: getPoolScript,
        },
    ],
})
