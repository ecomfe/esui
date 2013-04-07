define(function (require) {
    var Tab = require('esui/Tab');

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
                var tabs = [
                    { title: 'tab1', panel: 'a' },
                    { title: 'tab2', panel: 'b' },
                    { title: 'tab3', panel: 'c' }
                ];
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
    });
});