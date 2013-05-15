define(function (require) {
    var Crumb = require('esui/Crumb');

    describe('Crumb', function () {
        it('should be a constructor', function () {
            expect(Crumb).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Crumb()).toBeOfType('object');
        });

        describe('created via script', function () {
            it('should create a `<nav>` element as its main element', function () {
                var crumb = new Crumb();
                crumb.appendTo(container);
                expect(container.getElementsByTagName('nav').length).toBeGreaterThan(0);
            });

            it('should assign `path` property to an empty array if not given', function () {
                var crumb = new Crumb();
                expect(crumb.get('path')).toEqual([]);
            });
        });

        describe('generally', function () {
            it('should create an `<ol>` element in its main element', function () {
                var crumb = new Crumb();
                crumb.appendTo(container);
                expect(container.getElementsByTagName('ol').length).toBeGreaterThan(0);
            });

            it('should create a `<a>` element if a node have both `text` and `href` properties', function () {
                var path = [
                    { text: 'test', href: 'http://test.com/' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var ol = container.getElementsByTagName('ol')[0];
                var node = ol.firstChild.firstChild;
                expect(node.nodeName.toLowerCase()).toBe('a');
                expect(node.innerHTML).toBe('test');
                expect(node.getAttribute('href', 2)).toBe('http://test.com/');
            });

            it('should create a `<span>` element if a node have only a `text` property', function () {
                var path = [
                    { text: 'test' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var ol = container.getElementsByTagName('ol')[0];
                var node = ol.firstChild.firstChild;
                expect(node.nodeName.toLowerCase()).toBe('span');
                expect(node.innerHTML).toBe('test');
            });

            it('should add a className `crumb-node` to each node element', function () {
                var path = [
                    { text: 'test' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var ol = container.getElementsByTagName('ol')[0];
                var node = ol.firstChild;
                expect(node.className).toMatch(/crumb-node/);
            });

            it('should add a className `crumb-node-first` to the first node element', function () {
                var path = [
                    { text: 'test', href: 'http://test.com' },
                    { text: 'test' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var ol = container.getElementsByTagName('ol')[0];
                var node = ol.firstChild;
                expect(node.className).toMatch(/crumb-node-first/);
            });

            it('should add a className `crumb-node-first` to the first node element', function () {
                var path = [
                    { text: 'test', href: 'http://test.com' },
                    { text: 'test' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var ol = container.getElementsByTagName('ol')[0];
                var node = ol.lastChild;
                expect(node.className).toMatch(/crumb-node-last/);
            });

            it('should add both className `crumb-node-first` and `crumb-node-last` to the only element if it has only one node', function () {
                var path = [
                    { text: 'test', href: 'http://test.com' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var ol = container.getElementsByTagName('ol')[0];
                var node = ol.firstChild;
                expect(node.className).toMatch(/crumb-node-first/);
                expect(node.className).toMatch(/crumb-node-last/);
            });

            it('should regenerate nodes when `path` property is modified in runtime', function () {
                var path = [
                    { text: 'test', href: 'http://test.com' },
                    { text: 'test' }
                ];
                var crumb = new Crumb();
                crumb.appendTo(container);
                crumb.set('path', path);
                // 2 nodes + 1 separator
                expect(container.getElementsByTagName('li').length).toBe(3);
            });
        });
    });
})