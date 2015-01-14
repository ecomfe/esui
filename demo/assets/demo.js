require.config({
    'baseUrl': '../../src',
    'paths': {},
    'packages': [
        {
            'name': 'mini-event',
            'location': '../dep/mini-event/1.0.2/src',
            'main': 'main'
        },
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
            'location': '../dep/etpl/3.0.0/src',
            'main': 'main'
        },
        {
            'name': 'esui',
            'location': '../src',
            'main': 'main'
        }
    ]
});

$(function () {
    function hideSource(e) {
        $('.source-visible').removeClass('source-visible');
    }

    function viewSource(e) {
        var target = $(e.target);
        var section = target.closest('.view');
        hideSource();
        if (target.hasClass('view-markup')) {
            section.find('.source-markup').addClass('source-visible');
        }
        else if (target.hasClass('view-script')) {
            section.find('.source-script').addClass('source-visible');
        }
    }

    $('.view').on('click', '.viewer li', viewSource);
    $('.source, .viewer li').on('mousedown', false);
    //$('html').on('mousedown', hideSource);
    
    var navItems = 
        '<li><a href="Panel.html">Panel</a></li>' +
        '<li><a href="Label.html">Label</a></li>' +
        '<li><a href="Link.html">Link</a></li>' +
        '<li><a href="Button.html">Button</a></li>' +
        '<li><a href="Tip.html">Tip</a></li>' +
        '<li><a href="TextBox.html">TextBox</a></li>' +
        '<li><a href="BoxControl.html">BoxControl</a></li>' +
        '<li><a href="Select.html">Select</a></li>' +
        '<li><a href="MonthView.html">MonthView</a></li>' +
        '<li><a href="Calendar.html">Calendar</a></li>' +
        '<li><a href="RangeCalendar.html">RangeCalendar</a></li>' +
        '<li><a href="Region.html">Region</a></li>' +
        '<li><a href="Schedule.html">Schedule</a></li>' +
        '<li><a href="Crumb.html">Crumb</a></li>' +
        '<li><a href="CommandMenu.html">CommandMenu</a></li>' +
        '<li><a href="Wizard.html">Wizard</a></li>' +
        '<li><a href="Tab.html">Tab</a></li>' +
        '<li><a href="Pager.html">Pager</a></li>' +
        '<li><a href="Sidebar.html">Sidebar</a></li>' +
        '<li><a href="Dialog.html">Dialog</a></li>' +
        '<li><a href="Tree.html">Tree</a></li>' +
        '<li><a href="Table.html">Table</a></li>';

    $('#navigator').html(navItems);

    $('.example').each(function (index, item) {
        var $sample = $('<pre class="source source-markup"><code class="language-markup"></code></pre>');
        var $code = $sample.find('.language-markup');
        var $item = $(item);
        $sample.insertAfter($item);

        var sampleCode = $item.html();
        var indexOfFirstElement = sampleCode.indexOf('<');
        var arr = sampleCode.split('\n');
        var targetArr = [];
        var reg = new RegExp('^\\s{' + (indexOfFirstElement - 1) + '}')
        for (var i = 0; i < arr.length; i++) {
            targetArr.push(arr[i].replace(reg, ''));
        }
        $code.text(targetArr.join('\n'));
    });
    Prism.highlightAll();
});
var ready = (function () {
    var list = [];
    return function (callback) {
        if (callback) {
            list.push(callback);
        }
        else {
            for (var i = 0; i < list.length; i++) {
                list[i]();
            }
            ready = function (callback) {
                callback();
            };
        }
    }
}());