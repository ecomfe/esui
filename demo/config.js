/** config
 * @file config.js
 * @author fe
 */
require.config({
    'baseUrl': '../src',
    'paths': {},
    'packages': [
        {
            'name': 'underscore',
            'location': '../dep/underscore/1.5.2/src',
            'main': 'underscore'
        },
        {
            'name': 'moment',
            'location': '../dep/moment/2.7.0/src',
            'main': 'moment'
        },
        {
            'name': 'etpl',
            'location': '../dep/etpl/3.2.0/src',
            'main': 'main'
        },
        {
            'name': 'esui',
            'location': '../src',
            'main': 'main'
        },
        {
            'name': 'eicons',
            'location': '../dep/eicons/1.0.0/src',
            'main': 'main.less'
        },
        {
            'name': 'esf',
            'location': '../dep/esf/1.0.0/src'
        },
        {
            'name': 'est',
            'location': '../dep/est/1.3.0/src'
        },
        {
            'name': 'eoo',
            'location': '../dep/eoo/0.1.4/src',
            'main': 'main'
        },
        {
            'name': 'jquery',
            'location': '../dep/jquery/1.11.1/src',
            'main': 'jquery'
        },
        {
            'name': 'mini-event',
            'location': '../dep/mini-event/1.0.2/src',
            'main': 'main'
        }
    ]
});
