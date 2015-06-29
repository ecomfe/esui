( function() {
    require.config({
        'waitSeconds': 2,
        'baseUrl': '../../../test',
        'packages': [
            {
                'name': 'esui',
                'location': '../src',
                'main': 'main'
            },
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
                'name': 'eoo',
                'location': '../dep/eoo/0.1.3/src',
                'main': 'main'
            },
            {
                'name': 'jquery',
                'location': '../dep/jquery/1.9.1/src',
                'main': 'jquery.min'
            }
        ],
        'paths': {
            'jasmine': 'asset/js/jasmine',
            'jasmine-html': 'asset/js/jasmine-html',
            'matchers': 'asset/js/matchers',
            'jquery-simulate': 'asset/js/jquery.simulate'
        },
        'shim': {
            'jquery-simulate': ['jquery'],
            'jasmine': {
                'exports': 'jasmine'
            },
            'jasmine-html': ['jasmine'],
            'matchers': ['jasmine']
        }
    });
    
    function createNav($) {
        var navItems = [
            'button', 'control', 'crumb', 'form', 'inputControl',
            'label', 'panel', 'safeWrapper', 'searchBox', 'select', 'tab',
            'textBox', 'validity', 'viewContext', 'wizard', 'libs'
        ];
        var navHtml = '';
        $(navItems).each(function (index, item) {
            var initial = item.slice(0, 1).toUpperCase() + item.slice(1);
            navHtml += '<li><a href="../' + item +'/' + item + '.html">' + initial + '</a></li>';
        });
        $('body').append('<div id="navigator" class="navigator"></div>');
        $('#navigator').html(navHtml);
    }
    
    require(
        ['jquery'],
        function($) {
            $(document).ready(function () {
                createNav($);
                var widget = $('script[data-widget]').attr('data-widget');
                var initial = widget.slice(0, 1).toUpperCase() + widget.slice(1);
                var ctrPath = './unit/' + widget + '/' + initial;
                require.config({
                    'paths': {
                        'ctrPath': ctrPath
                    }
                });
                require(
                    ['esui', 'ctrPath', 'jasmine-html', 'matchers'],
                    function (esui, control, jasmine_html, matchers) {
                        afterEach(function () {
                            esui.getViewContext().clean();
                        });
                        var jasmineEnv = jasmine.getEnv();
                        jasmineEnv.updateInterval = 1000;
                        var htmlReporter = new jasmine.HtmlReporter();
                        jasmineEnv.addReporter(htmlReporter);
                        jasmineEnv.specFilter = function(spec) {
                            return htmlReporter.specFilter(spec);
                        };
                        jasmineEnv.execute();
                    }
                );
            });
        }
    );
} )();
