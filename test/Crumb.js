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
            it('should create a `<esui-crumb>` element as its main element', function () {
                var crumb = new Crumb();
                crumb.appendTo(container);
                expect(container.getElementsByTagName('esui-crumb').length).toBeGreaterThan(0);
            });

            it('should assign `path` property to an empty array if not given', function () {
                var crumb = new Crumb();
                expect(crumb.get('path')).toEqual([]);
            });
        });

        describe('created via HTML', function () {
            var main = document.createElement('div');
            main.innerHTML = '<a href="#1">test1</a><a href="#2">test2</a><span>test3</span>';
            var crumb = new Crumb({ main: main });
            crumb.appendTo(container);

            it('should get `path` option from existing DOM structure', function () {
                var path = [
                    { href: '#1', text: 'test1' },
                    { href: '#2', text: 'test2' },
                    { text: 'test3' }
                ];
                expect(crumb.get('path')).toEqual(path);
            });

            it('should add separators to DOM', function () {
                //for ie
                main.innerHTML = '<a href="#1">test1</a><a href="#2">test2</a><span>test3</span>';
                var crumb = new Crumb({ main: main });
                crumb.appendTo(container);
                expect(main.children.length).toBe(5);
                expect(main.children[0].className).toContain('ui-crumb-node');
                expect(main.children[0].className).toContain('ui-crumb-node-first');
                expect(main.children[1].className).toContain('ui-crumb-separator');
                expect(main.children[2].className).toContain('ui-crumb-node');
                expect(main.children[3].className).toContain('ui-crumb-separator');
                expect(main.children[4].className).toContain('ui-crumb-node');
                expect(main.children[4].className).toContain('ui-crumb-node-last');
            });
        });

        describe('generally', function () {
            it('should create a `<a>` element if a node have both `text` and `href` properties', function () {
                var path = [
                    { text: 'test', href: 'http://test.com/' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var node = crumb.main.firstChild;
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
                var node = crumb.main.firstChild;
                expect(node.nodeName.toLowerCase()).toBe('span');
                expect(node.innerHTML).toBe('test');
            });

            it('should add a className `crumb-node` to each node element', function () {
                var path = [
                    { text: 'test' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var node = crumb.main.firstChild;
                expect(node.className).toMatch(/crumb-node/);
            });

            it('should add a className `crumb-node-first` to the first node element', function () {
                var path = [
                    { text: 'test', href: 'http://test.com' },
                    { text: 'test' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var node = crumb.main.firstChild;
                expect(node.className).toMatch(/crumb-node-first/);
            });

            it('should add a className `crumb-node-first` to the first node element', function () {
                var path = [
                    { text: 'test', href: 'http://test.com' },
                    { text: 'test' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var node = crumb.main.lastChild;
                expect(node.className).toMatch(/crumb-node-last/);
            });

            it('should add both className `crumb-node-first` and `crumb-node-last` to the only element if it has only one node', function () {
                var path = [
                    { text: 'test', href: 'http://test.com' }
                ];
                var crumb = new Crumb({ path: path });
                crumb.appendTo(container);
                var node = crumb.main.firstChild;
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
                expect(crumb.main.children.length).toBe(3);
            });
        });
    });
});