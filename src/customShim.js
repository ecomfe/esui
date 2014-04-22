/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file ie8自定义元素 shim
 * @author exodia
 */
(function () {
    var prefix = 'esui-';
    var elements = [
        'Calendar', 'Crumb', 'Dialog', 'Label', 'Month-View', 'Pager', 'Panel', 'Range-Calendar',
        'Region', 'Rich-Calendar', 'Schedule', 'Search-Box', 'Sidebar', 'Tab', 'Table', 'Text-Box',
        'Text-Line', 'Tip', 'Tip-Layer', 'Tree', 'Wizard', 'Toast'
    ];

    for (var i = elements.length - 1; i > -1; --i) {
        document.createElement(prefix + elements[i]);
    }
}());
