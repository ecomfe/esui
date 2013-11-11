define(function (require) {
    var Tab = require('esui/Tab');
    var container = document.getElementById('container');
    var tabs = [
        { title: 'tab1', panel: 'a' },
        { title: 'tab2', panel: 'b' },
        { title: 'tab3', panel: 'c' }
    ];

    function findCloseElement(tabElement) {
        for (var i = 0; i < tabElement.children.length; i++) {
            var child = tabElement.children[i];
            if (/ui-tab-close/.test(child.className)) {
                return child;
            }
        }

        return null;
    }

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
                var newTabs = [
                    { title: 'tab1', panel: 'a' }
                ];
                var tab = new Tab({ main: main, tabs: newTabs });
                expect(tab.get('tabs')).toEqual(newTabs);
            });

            it('should not override `tabs` option if it is given from constructor even main element has tab page children', function () {
                var main = document.createElement('div');
                var html = [
                    '<div title="tab1" id="a"></div>'
                ];
                main.innerHTML = html.join('\n');
                var tab = new Tab({ main: main, tabs: tabs });
                expect(tab.get('tabs')).toEqual(tabs);
            });

            it('should leave existing `[data-role="navigator"]` element if no `tabs` option is given', function () {
                var main = document.createElement('div');
                var html = [
                    '<ul data-role="navigator" data-test="true">',
                        '<li data-for="a">tab1</li>',
                    '</ul>'
                ];
                main.innerHTML = html.join('\n');
                var tab = new Tab({ main: main });
                expect(main.firstChild.getAttribute('data-test')).toBe('true');
            });

            it('should add `ui-tab-navigator` class to the existing navigator element', function () {
                var main = document.createElement('div');
                var html = [
                    '<ul data-role="navigator" data-test="true">',
                        '<li data-for="a">tab1</li>',
                    '</ul>'
                ];
                main.innerHTML = html.join('\n');
                var tab = new Tab({ main: main });
                tab.appendTo(container);
                expect(main.firstChild.className).toMatch('ui-tab-navigator');
            });
        });

        describe('generally', function () {
            it('should create a navigator `<ul>` element', function () {
                var tab = new Tab({ tabs: tabs });
                tab.appendTo(container);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator).toBeDefined();
                expect(navigator.children.length).toBe(3);
                expect(getText(navigator.children[0])).toBe('tab1');
                expect(getText(navigator.children[1])).toBe('tab2');
                expect(getText(navigator.children[2])).toBe('tab3');
            });

            it('should add `ui-tab-navigator` class to the navigator element', function () {
                var tab = new Tab({ tabs: tabs });
                tab.appendTo(container);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.className).toMatch(/ui-tab-navigator/);
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
                expect(getText(navigator.children[0])).toBe('tab4');
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

            it('should add a `ui-tab-item-active` class for selected tab', function () {
                var tab = new Tab({ tabs: tabs, activeIndex: 1 });
                tab.appendTo(container);
                var tabElement = container.getElementsByTagName('li')[1];
                expect(tabElement.className).toMatch(/ui-tab-item-active/);
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
                        { title: 'tab3' }
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

            it('should activate the tab when it is clicked', function () {
                var tab = new Tab({ tabs: tabs, activeIndex: 1 });
                tab.appendTo(container);
                var navigator = container.getElementsByTagName('ul')[0];
                dispatchEvent(navigator.children[0], 'click');
                expect(tab.get('activeIndex')).toBe(0);
            });

            it('should add a tab config & element at the tail when `add` is called', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var newTab = { title: 'tab4', panel: 'd' };
                tab.add(newTab);
                expect(tab.get('tabs')[3]).toEqual(newTab);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(4);
                expect(getText(navigator.children[3])).toBe('tab4');
            });

            it('should add a tab config & element at the given position when `insert` is called', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var newTab = { title: 'tab4', panel: 'd' };
                tab.insert(newTab, 2);
                expect(tab.get('tabs')[2]).toEqual(newTab);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(4);
                expect(getText(navigator.children[2])).toBe('tab4');
            });

            it('should add a tab at first if `index` is less than 0 when `insert` is called', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var newTab = { title: 'tab4', panel: 'd' };
                tab.insert(newTab, -1);
                expect(tab.get('tabs')[0]).toEqual(newTab);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(4);
                expect(getText(navigator.children[0])).toBe('tab4');
            });

            it('should add a tab at last if `index` is out of range when `insert` is called', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var newTab = { title: 'tab4', panel: 'd' };
                tab.insert(newTab, 10);
                expect(tab.get('tabs')[3]).toEqual(newTab);
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(4);
                expect(getText(navigator.children[3])).toBe('tab4');
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
                expect(getText(navigator.children[0])).toBe('tab1');
                expect(getText(navigator.children[1])).toBe('tab3');
            });

            it('should remove many tab config & element when `remove` is called', function () {
                var a = {title: 'test'};
                var tab = new Tab({ tabs: tabs.slice().concat([a, a]) });
                tab.appendTo(container);
                tab.add(a);
                tab.add(a);
                tab.add(a);
                tab.remove(a);
                expect(tab.get('tabs').length).toBe(3);
                expect(tab.get('tabs')[0]).toEqual({ title: 'tab1', panel: 'a' });
                expect(tab.get('tabs')[1]).toEqual({ title: 'tab2', panel: 'b' });
                expect(tab.get('tabs')[2]).toEqual({ title: 'tab3', panel: 'c' });
                var navigator = container.getElementsByTagName('ul')[0];
                expect(navigator.children.length).toBe(3);
                expect(getText(navigator.children[0])).toBe('tab1');
                expect(getText(navigator.children[1])).toBe('tab2');
                expect(getText(navigator.children[2])).toBe('tab3');
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
                expect(getText(navigator.children[0])).toBe('tab1');
                expect(getText(navigator.children[1])).toBe('tab3');
            });

            it('should reset `activeIndex` to the next one if the active tab is removed', function () {
                var tab = new Tab({ tabs: tabs.slice(), activeIndex: 1 });
                tab.appendTo(container);
                tab.removeAt(1);
                expect(tab.get('activeIndex')).toBe(1);
                expect(container.getElementsByTagName('li')[1].className).toMatch(/ui-tab-item-active/);
            });

            it('should set active tab to the last one if the last tab is active and removed', function () {
                var tab = new Tab({ tabs: tabs.slice(), activeIndex: 2 });
                tab.appendTo(container);
                tab.removeAt(2);
                expect(tab.get('activeIndex')).toBe(1);
                expect(container.getElementsByTagName('li')[1].className).toMatch(/ui-tab-item-active/);
            });

            it('should keep the current active tab if `tabs` is changed but current active tab still exists', function () {
                var tab = new Tab({ tabs: tabs, activeIndex: 1 });
                tab.appendTo(container);
                tab.set('tabs', tabs.slice(1, 2));
                expect(tab.get('activeIndex')).toBe(0);
                expect(container.getElementsByTagName('li')[0].className).toMatch(/ui-tab-item-active/);
            });

            it('should set `activeIndex` to -1 if the last tab is removed', function () {
                var tab = new Tab({ tabs: tabs.slice(0, 1), activeIndex: 0 });
                tab.appendTo(container);
                tab.removeAt(0);
                expect(tab.get('activeIndex')).toBe(-1);
            });

            it('should hide the related panel if a tab is removed', function () {
                var html = [
                    '<div id="a"></div>',
                    '<div id="b"></div>',
                    '<div id="c"></div>'
                ];
                container.innerHTML = html.join('\n');
                var tab = new Tab({ tabs: tabs.slice(), activeIndex: 1 });
                tab.appendTo(container);
                tab.removeAt(1);
                expect(document.getElementById('b').style.display).toBe('none');
            });

            it('should set the newly added tab active if it is the only one', function () {
                container.innerHTML = '<div id="a"></div>';
                var tab = new Tab();
                tab.appendTo(container);
                tab.add(tabs.slice(0, 1));
                expect(tab.get('activeIndex')).toBe(0);
                expect(document.getElementById('a').style.display).toBe('');
            });

            it('should add an element with className `ui-tab-close` to each tab if `allowClose` is set to true', function () {
                var tab = new Tab({ tabs: tabs, allowClose: true });
                tab.appendTo(container);
                var navigator = container.getElementsByTagName('ul')[0];
                for (var i = 0; i < navigator.children.length; i++) {
                    var tab = navigator.children[i];
                    var close = findCloseElement(tab);
                    expect(close).toBeDefined();
                }
            });

            it('should add an close element for each tab if `allowClose` is changed to true after rendered', function () {
                var tab = new Tab({ tabs: tabs });
                tab.appendTo(container);
                tab.set('allowClose', true);
                var navigator = container.getElementsByTagName('ul')[0];
                for (var i = 0; i < navigator.children.length; i++) {
                    var tab = navigator.children[i];
                    var close = findCloseElement(tab);
                    expect(close).toBeDefined();
                }
            });

            it('should remove the close element for each tab if `allowClose` is changed to false after rendered', function () {
                var tab = new Tab({ tabs: tabs, allowClose: true });
                tab.appendTo(container);
                tab.setProperties({ allowClose: false });
                var navigator = container.getElementsByTagName('ul')[0];
                for (var i = 0; i < navigator.children.length; i++) {
                    var tab = navigator.children[i];
                    var close = findCloseElement(tab);
                    expect(close).toBe(null);
                }
            });

            it('should remove the tab when close element is clicked', function () {
                var tab = new Tab({ tabs: tabs.slice(), allowClose: true });
                tab.appendTo(container);
                var navigator = container.getElementsByTagName('ul')[0];
                var close = findCloseElement(navigator.children[2]);
                dispatchEvent(close, 'click');
                expect(tab.get('tabs')).toEqual(tabs.slice(0, 2));
            });
        });

        describe('`activate` event', function () {
            var tab;
            var handler;

            beforeEach(function () {
                tab = new Tab({ tabs: tabs.slice(), activeIndex: 1 });
                tab.appendTo(container);
                handler = jasmine.createSpy();
                tab.on('activate', handler);
            });

            it('should fire when `activeIndex` is changed', function () {
                tab.set('activeIndex', 0);
                expect(handler).toHaveBeenCalled();
            });

            it('should fire when `activate` is called with a tab different from the active one', function () {
                tab.activate(tab.get('tabs')[0]);
                expect(handler).toHaveBeenCalled();
            });

            it('should fire when currently active tab is removed', function () {
                tab.remove(tab.get('tabs')[1]);
                expect(handler).toHaveBeenCalled();
            });

            it('should fire if `tabs` is changed and currently active tab disappears', function () {
                tab.set('tabs', tabs.slice(2, 1));
                expect(handler).toHaveBeenCalled();
            })

            it('should not fire if `tabs` is changed but currently active tab still exists', function () {
                tab.set('tabs', tabs.slice(1, 2));
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not fire when `activeIndex` is set but its value is not changed', function () {
                tab.set('activeIndex', 1);
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not fire when `activate` is called with the same active tab', function () {
                tab.activate(tab.get('tabs')[1]);
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not fire when a none-activated & before-current tab is removed', function () {
                tab.removeAt(0);
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not fire when a none-activated & after-current tab is removed', function () {
                tab.removeAt(2);
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not fire when an insertion causes `activeIndex` to be changed', function () {
                tab.insert({ title: 'tab4', panel: 'd' }, 0);
                expect(handler).not.toHaveBeenCalled();
            });

            it('should give a correct event object when fired', function () {
                tab.set('activeIndex', 0);
                var event = handler.mostRecentCall.args[0];
                expect(event).toBeOfType('object');
                expect(event.type).toBe('activate');
                expect(event.activeIndex).toBe(0);
                expect(event.tab).toEqual(tabs[0]);
            });
        });

        describe('`add` event', function () {
            it('should fire when a tab is added', function () {
                var tab = new Tab();
                tab.appendTo(container);
                var spy = jasmine.createSpy();
                tab.on('add', spy);
                tab.add(tabs.slice(0, 1));
                expect(spy).toHaveBeenCalled();
            });

            it('should fire when a tab is inserted', function () {
                var tab = new Tab();
                tab.appendTo(container);
                var spy = jasmine.createSpy();
                tab.on('add', spy);
                tab.add(tabs[0], 0);
                expect(spy).toHaveBeenCalled();
            });

            it('should give a correct even object when fired', function () {
                var tab = new Tab();
                tab.appendTo(container);
                var spy = jasmine.createSpy();
                tab.on('add', spy);
                tab.add(tabs[0]);
                var event = spy.mostRecentCall.args[0];
                expect(event).toBeOfType('object');
                expect(event.type).toBe('add');
                expect(event.index).toBe(0);
                expect(event.tab).toEqual(tabs[0]);
            });
        });

        describe('`remove` event', function () {
            it('should fire when a tab is removed', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var spy = jasmine.createSpy();
                tab.on('remove', spy);
                tab.remove(tab.get('tabs')[0]);
                expect(spy).toHaveBeenCalled();
            });

            it('should fire when a tab is removed via `removeAt`', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var spy = jasmine.createSpy();
                tab.on('remove', spy);
                tab.removeAt(1);
                expect(spy).toHaveBeenCalled();
            });

            it('should fire when a `allowClose` tab is closed by clicking the close element', function () {
                var tab = new Tab({ tabs: tabs.slice(), allowClose: true });
                tab.appendTo(container);
                var spy = jasmine.createSpy();
                tab.on('remove', spy);
                var navigator = container.getElementsByTagName('ul')[0];
                var close = findCloseElement(navigator.children[0]);
                dispatchEvent(close, 'click');
                expect(spy).toHaveBeenCalled();
            });

            it('should give a correct even object when fired', function () {
                var tab = new Tab({ tabs: tabs.slice() });
                tab.appendTo(container);
                var spy = jasmine.createSpy();
                tab.on('remove', spy);
                tab.removeAt(0);
                var event = spy.mostRecentCall.args[0];
                expect(event).toBeOfType('object');
                expect(event.type).toBe('remove');
                expect(event.index).toBe(0);
                expect(event.tab).toEqual(tabs[0]);
            });
        });
    });
});