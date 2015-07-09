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
            'location': '../dep/etpl/3.0.1/src',
            'main': 'main'
        },
        {
            'name': 'esui',
            'location': '../src',
            'main': 'main'
        },
        {
            'name': 'eicons',
            'location': '../dep/eicons/1.0.0-beta.1/src',
            'main': 'main.less'
        },
        {
            'name': 'esf',
            'location': '../dep/esf/1.0.0-beta.2/src'
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
            'location': '../dep/jquery/1.9.1/src',
            'main': 'jquery.min'
        }
    ]
});

define('demo',
    function (localRequire) {
        var $ = localRequire('jquery');
        function genNavigator() {
            var navItems =
                '<li><a href="BoxGroup.html">BoxGroup</a></li>' +
                '<li><a href="Button.html">Button</a></li>' +
                '<li><a href="Calendar.html">Calendar</a></li>' +
                '<li><a href="Checkbox.html">Checkbox</a></li>' +
                '<li><a href="commandMenu.html">Command Menu</a></li>' +
                '<li><a href="Crumb.html">Crumb</a></li>' +
                '<li><a href="Dialog.html">Dialog</a></li>' +
                '<li><a href="Form.html">Form</a></li>' +
                '<li><a href="Label.html">Label</a></li>' +
                '<li><a href="Link.html">Link</a></li>' +
                '<li><a href="MonthView.html">Month View</a></li>' +
                '<li><a href="Pager.html">Pager</a></li>' +
                '<li><a href="Panel.html">Panel</a></li>' +
                '<li><a href="RangeCalendar.html">Range Calendar</a></li>' +
                '<li><a href="RichCalendar.html">Rich Calendar</a></li>' +
                '<li><a href="Region.html">Region</a></li>' +
                '<li><a href="Schedule.html">Schedule</a></li>' +
                '<li><a href="Select.html">Select</a></li>' +
                //'<li><a href="Sidebar.html">Sidebar</a></li>' +
                '<li><a href="SearchBox.html">SearchBox</a></li>' +
                '<li><a href="Tab.html">Tab</a></li>' +
                '<li><a href="Table.html">Table</a></li>' +
                '<li><a href="TextBox.html">TextBox</a></li>' +
                '<li><a href="TextLine.html">TextLine</a></li>' +
                '<li><a href="Tip.html">Tip</a></li>' +
                '<li><a href="TipLayer.html">TipLayer</a></li>' +
                '<li><a href="Tree.html">Tree</a></li>' +
                '<li><a href="Toast.html">Toast</a></li>' +
                '<li><a href="ValidityLabel.html">Validity</a></li>' +
                '<li><a href="Wizard.html">Wizard</a></li>';
            $('#navigator').html(navItems);
            var url = window.location.pathname;
            var filename = url.substring(url.lastIndexOf('/')+1);
            $('#navigator'+ ' a[href="' + filename + '"]').parent().addClass('ui-sidebar-item-active');
        }
        
        function renderSample() {
            $('.example').each(function (index, item) {
                var $tab = $('<div data-ui-type="Tab" data-ui-id="democode' + index
                           + '"data-ui-variants="align-right-democode">'
                           + '<ul data-role="navigator" id="ctrl-default-democode' + index + '-navigator" class="ui-tab-navigator"></ul></div>');
                var $tabHtml = $('<li data-for="democodehtml' + index + '"><span>HTML</span></li>');
                var $tabJs = $('<li data-for="democodejs' + index + '"><span>JS</span></li>');
                $tab.find('ul').append($tabHtml);      
                var $tabContent = $('<div class="ui-tab-content ui-tab-content-democode-border"></div>');
                var $tabContentHtml = $('<div class="ui-tab-panel" id="democodehtml' + index + '"></div>');
                var $tabContentJs = $('<div class="ui-tab-panel" id="democodejs' + index + '"></div>');
                $tabContent.append($tabContentHtml);
                if ($(item).next('script').length > 0) {
                    $tab.find('ul').append($tabJs);
                    $tabContent.append($tabContentJs);
                }
                $tab.insertAfter($(item));
                $tabContent.insertAfter($tab);

                var $sample = $('<div class="highlight"><pre class="source source-markup prettyprint"><code class="language-markup"></code></pre></div>');
                var $code = $sample.find('.language-markup');
                var $item = $(item);
                $item.nextAll('.ui-tab-content').find('#democodehtml' + index).html($sample);
                var sampleCode = $item.html();
                var indexOfFirstElement = sampleCode.indexOf('<');
                var arr = sampleCode.split('\n');
                var targetArr = [];
                var reg = new RegExp('^\\s{' + (indexOfFirstElement - 1) + '}')
                for (var i = 0; i < arr.length; i++) {
                    targetArr.push(arr[i].replace(reg, ''));
                }
                $code.text(targetArr.join('\n'));
                var jsText = $item.nextAll('script').text().replace(/(^\s*)|(\s*$)/g,"").replace(/(;\s*)/g, ';\n');
                var $jsSample = $('<div class="highlight"><pre class="source source-markup prettyprint"><code class="language-markup"></code></pre></div>');
                var $jsCode = $jsSample.find('.language-markup').text(jsText);
                $item.nextAll('.ui-tab-content').find('#democodejs' + index).html($jsSample);
            });
        }
        genNavigator();
        renderSample();
        prettyPrint();
    }
)

// var ready = (function () {
//     var list = [];
//     return function (callback) {
//         if (callback) {
//             list.push(callback);
//         }
//         else {
//             for (var i = 0; i < list.length; i++) {
//                 list[i]();
//             }
//             ready = function (callback) {
//                 callback();
//             };
//         }
//     }
// }());

// function writeScript(url) {
//     var gaJsHost = (("https:" == document.location.protocol) ?
//         "https://" : "http://");
//     document.write(unescape("%3Cscript src='" + gaJsHost + url +
//         "' type='text/javascript'%3E%3C/script%3E"));
// }
