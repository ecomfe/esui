define(function (require) {
    var Tab = require('esui/Tab');
    var container = document.getElementById('container');
    var tabs = [
        { title: 'tab1', panel: 'a' },
        { title: 'tab2', panel: 'b' },
        { title: 'tab3', panel: 'c' }
    ];

    describe('Tab', function () {
        it('should be a constructor', function () {
            expect(Tab).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Tab()).toBeOfType('object');
        });

        describe('create via script', function () {
            it('should have a `tabs` property even it is not passed via constructor', function () {
                var tab = new Tab();
                expect(tab.get('tabs')).toBeOfType('array');
            });
        });

        describe('created via HTML', function () {
            it('should treat each child as a tab page if no `[data-role="navigator"]` child exists', function () {
                var main = document.createElement('div');
                var html = [
                    '<div title="tab1" id="a"></div>',
                    '<div title="tab2" id="b"></div>',
                    '<div title="tab3" id="c"></div>'
                ];
                main.innerHTML = html.join('\n');
                var tab = new Tab({ main: main });
                expect(tab.get('tabs')).toEqual(tabs);
            });

            it('should extract `tabs` property from a `[data-role="navigator"]` child if it exists', function () {
                var main = document.createElement('div');
                var html = [
                    '<div title="tab1" id="a"></div>',
                    '<ul data-role="navigator">',
                        '<li data-for="a">tab1</li>',
                        '<li data-for="b">tab2</li>',
                        '<li data-for="c">tab3</li>',
                    '</ul>',
                    '<div title="tab2" id="b"></div>'
                ];
                main.innerHTML = html.join('\n');
                var tab = new Tab({ main: main });
                var tabs = [
                    { title: 'tab1', panel: 'a' },
                    { title: 'tab2', panel: 'b' },
                    { title: 'tab3', panel: 'c' }
                ];
                expect(tab.get('tabs')).toEqual(tabs);
            });

            it('should override `tabs` option given from constructor if the main element has a `[data-role="navigator"]` child', function () {
                var main = document.createElement('div');
                var html = [
                    '<ul data-role="navigator">',
                        '<li data-for="a">tab1</li>',
                    '</ul>'
                ];
                main.innerHTML = html.join('\n');
                var tab = new Tab({ main: main, tabs: [] });
                var tabs = [
                    { title: 'tab1', panel: 'a' }
                ];
                expect(tab.get('tabs')).toEqual(tabs);
            });

            it('should override `tabs` option given from constructor if the main element has tab page children', function () {
                var main = document.createElement('div');
                var html = [
                    '<div title="tab1" id="a"></div>'
                ];
                main.innerHTML = html.join('\n');
                var tab = new Tab({ main: main, tabs: [] });
                var tabs = [
                    { title: 'tab1', panel: 'a' }
                ];
                expect(tab.get('tabs')).toEqual(tabs);
            });
        });

        describe('generally', function () {
            it('should create a navigator `<ul>` element', function () {
                var tab = new Tab({ tabs: tabs });
                tab.appendTo(container);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator).toBeDefined();
                expect(navigator.children.length).toBe(3);
                expect(navigator.children[0].innerHTML).toBe('tab1');
                expect(navigator.children[1].innerHTML).toBe('tab2');
                expect(navigator.children[2].innerHTML).toBe('tab3');
            });

            it('should rerender navigator `<ul>` element if `tabs` is changed via `setProperties`', function () {
                var tab = new Tab({ tabs: tabs });
                tab.appendTo(container);
                tab.setProperties({
                    tabs: [
                        { title: 'tab4', panel: 'd' }
                    ]
                });
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator).toBeDefined();
                expect(navigator.children.length).toBe(1);
                expect(navigator.children[0].innerHTML).toBe('tab4');
            });

            it('should reset `activeIndex` to 0 if `tabs` is changed via `setProperties` and current `activeIndex` is out of range', function () {
                var tab = new Tab({ tabs: tabs, activeIndex: 2 });
                tab.appendTo(container);
                tab.setProperties({
                    tabs: [
                        { title: 'tab4', panel: 'd' }
                    ]
                });
                expect(tab.get('activeIndex')).toBe(0);
            });

            it('should add a `ui-tab-active` class for selected tab', function () {
                var tab = new Tab({ tabs: tabs, activeIndex: 1 });
                tab.appendTo(container);
                var tabElement = container.getElementsByTagName('li')[1];
                expect(tabElement.className).toMatch(/ui-tab-active/);
            });

            it('should change the `display` style of all panel when tab is rendered', function () {
                var html = [
                    '<div id="a"></div>',
                    '<div id="b"></div>',
                    '<div id="c"></div>'
                ];
                container.innerHTML = html.join('\n');
                var tab = new Tab({ tabs: tabs, activeIndex: 1 });
                tab.appendTo(container);
                expect(document.getElementById('a').style.display).toBe('none');
                expect(document.getElementById('b').style.display).toBe('');
                expect(document.getElementById('c').style.display).toBe('none');
            });

            it('should hide all panel if a tab without `panel` property is activated', function () {
                var html = [
                    '<div id="a"></div>',
                    '<div id="b"></div>'
                ];
                container.innerHTML = html.join('\n');
                var tab = new Tab({
                    tabs: [
                        { title: 'tab1', panel: 'a' },
                        { title: 'tab2', panel: 'b' },
                        { title: 'tab3' },
                    ], 
                    activeIndex: 2
                });
                tab.appendTo(container);
                expect(document.getElementById('a').style.display).toBe('none');
                expect(document.getElementById('b').style.display).toBe('none');
            });

            it('should correctly adjust tab element and relative panel when `activate` is called', function () {
                var html = [
                    '<div id="a"></div>',
                    '<div id="b"></div>',
                    '<div id="c"></div>'
                ];
                container.innerHTML = html.join('\n');
                var tab = new Tab({ tabs: tabs, activeIndex: 1 });
                tab.appendTo(container);
                tab.activate(tabs[2]);
                expect(tab.get('activeIndex')).toBe(2);
                expect(document.getElementById('a').style.display).toBe('none');
                expect(document.getElementById('b').style.display).toBe('none');
                expect(document.getElementById('c').style.display).toBe('');
            });

            it('should correctly adjust tab element and relative panel when `activateAt` is called', function () {
                var html = [
                    '<div id="a"></div>',
                    '<div id="b"></div>',
                    '<div id="c"></div>'
                ];
                container.innerHTML = html.join('\n');
                var tab = new Tab({ tabs: tabs, activeIndex: 1 });
                tab.appendTo(container);
                tab.activateAt(2);
                expect(tab.get('activeIndex')).toBe(2);
                expect(document.getElementById('a').style.display).toBe('none');
                expect(document.getElementById('b').style.display).toBe('none');
                expect(document.getElementById('c').style.display).toBe('');
            });

            it('should add a tab config & element at the tail when `add` is called', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var newTab = { title: 'tab4', panel: 'd' };
                tab.add(newTab);
                expect(tab.get('tabs')[3]).toEqual(newTab);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(4);
                expect(navigator.children[3].innerHTML).toBe('tab4');
            });

            it('should add a tab config & element at the given position when `insert` is called', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var newTab = { title: 'tab4', panel: 'd' };
                tab.insert(newTab, 2);
                expect(tab.get('tabs')[2]).toEqual(newTab);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(4);
                expect(navigator.children[2].innerHTML).toBe('tab4');
            });

            it('should change `activeIndex` correctly when a tab is inserted', function () {
                var tab = new Tab({ tabs: tabs.slice(), activeIndex: 1 });
                tab.appendTo(container);
                tab.insert({ title: 'tab4', panel: 'd' }, 0);
                expect(tab.get('activeIndex')).toBe(2);
            });

            it('should hide a newly added tab\'s target panel', function () {
                container.innerHTML = '<div id="d"></div>';
                var tab = new Tab({ tabs: tabs.slice(), activeIndex: 1 });
                tab.appendTo(container);
                tab.add({ title: 'tab4', panel: 'd' });
                expect(document.getElementById('d').style.display).toBe('none');
            });

            it('should remove a tab config & element when `remove` is called', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                tab.remove(tab.get('tabs')[1]);
                expect(tab.get('tabs').length).toBe(2);
                expect(tab.get('tabs')[0]).toEqual({ title: 'tab1', panel: 'a' });
                expect(tab.get('tabs')[1]).toEqual({ title: 'tab3', panel: 'c' });
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(2);
                expect(navigator.children[0].innerHTML).toBe('tab1');
                expect(navigator.children[1].innerHTML).toBe('tab3');
            });

            it('should remove a tab config & element when `removeAt` is called', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                tab.removeAt(1);
                expect(tab.get('tabs').length).toBe(2);
                expect(tab.get('tabs')[0]).toEqual({ title: 'tab1', panel: 'a' });
                expect(tab.get('tabs')[1]).toEqual({ title: 'tab3', panel: 'c' });
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(2);
                expect(navigator.children[0].innerHTML).toBe('tab1');
                expect(navigator.children[1].innerHTML).toBe('tab3');
            });

            it('should reset `activeIndex` to the next one if the active tab is removed', function () {
                var tab = new Tab({ tabs: tabs.slice(), activeIndex: 1 });
                tab.appendTo(container);
                tab.removeAt(1);
                expect(tab.get('activeIndex')).toBe(1);
                expect(container.getElementsByTagName('li')[1].className).toMatch(/ui-tab-active/);
            });

            it('should set active tab to the last one if the last tab is active and removed', function () {
                var tab = new Tab({ tabs: tabs.slice(), activeIndex: 2 });
                tab.appendTo(container);
                tab.removeAt(2);
                expect(tab.get('activeIndex')).toBe(1);
                expect(container.getElementsByTagName('li')[1].className).toMatch(/ui-tab-active/);
            });
        });
    });
});