require.config({
    'baseUrl': '../../src',
    'paths': { 'css': '../demo/loader/css' },
    'packages': [
        {
            'name': 'esui',
            'location': '../src',
            'main': 'main'
        },
        {
            'name': 'mini-event',
            'location': '../dep/mini-event/1.0.0/src',
            'main': 'main'
        },
        {
            'name': 'underscore',
            'location': '../dep/underscore/1.5.2/src',
            'main': 'underscore'
        },
        {
            'name': 'moment',
            'location': '../dep/moment/2.0.1/src',
            'main': 'moment'
        },
        {
            'name': 'etpl',
            'location': '../dep/etpl/2.1.0/src',
            'main': 'main'
        }
    ]
});
document.createElement('header');
var prefix = 'esui-';
var elements = [
    'Calendar', 'Crumb', 'Dialog', 'Label', 'Month-View', 'Pager', 'Panel', 'Range-Calendar',
    'Region', 'Rich-Calendar', 'Schedule', 'Search-Box', 'Sidebar', 'Select', 'Tab', 'Table',
    'Text-Box', 'Text-Line', 'Tip', 'Tip-Layer', 'Tree', 'Wizard'
];

for (var i = elements.length - 1; i > -1; --i) {
    document.createElement(prefix + elements[i]);
}