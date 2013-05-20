define(function (require) {
    var Wizard = require('esui/Wizard');
    var steps = [
        { text: '1', panel: 'a' },
        { text: '2', panel: 'b' },
        { text: '3' }
    ];

    describe('Wizard', function () {
        it('should be a constructor', function () {
            expect(Wizard).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Wizard()).toBeOfType('object');
        });

        describe('created via script', function () {
            it('should create a `<ol>` element as its main element', function () {
                var wizard = new Wizard();
                expect(wizard.main.nodeName.toLowerCase()).toBe('ol');
            });
        });

        describe('created via HTML', function () {
            it('should extract config from each `<li>` child element if `path` is not given and the main element is not empty', function () {
                var html = [
                    '<ol data-ui="type: Wizard; id: test;">',
                        '<li data-for="a"><span>1</span></li>',
                        '<li data-for="b"><span>2</span></li>',
                        '<li><span>3</span></li>',
                    '</ol>'
                ];
                container.innerHTML = html;
                require('esui').init(container);
                var wizard = require('esui').get('test');
                expect(wizard.get('steps')).toEqual(steps);
            });
        });

        describe('generally', function () {
            it('should assign an empty array to `steps` property if not given', function () {
                var wizard = new Wizard();
                expect(wizard.get('steps')).toEqual([]);
            });

            it('should assign 0 to `activeIndex` property if not given', function () {
                var wizard = new Wizard();
                expect(wizard.get('activeIndex')).toBe(0);
            });

            it('should accept an `activeIndex` property if given', function () {
                var wizard = new Wizard({ steps: steps, activeIndex: 1 });
                expect(wizard.get('activeIndex')).toBe(1);
                expect(wizard.get('activeStep')).toBe(steps[1]);
            });

            it('should increment `activeIndex` by 1 when `stepNext` is called', function () {
                var wizard = new Wizard({  steps: steps });
                wizard.stepNext();
                expect(wizard.get('activeIndex')).toBe(1);
            });

            it('should do nothing when `stepNext` is called on the last step', function () {
                var wizard = new Wizard({ steps: steps, activeIndex: 2 });
                wizard.stepNext();
                expect(wizard.get('activeIndex')).toBe(2);
            });

            it('should forward to the finish step when `stepNext` is called on the last step', function () {
                var wizard = new Wizard({ steps: steps, activeIndex: 2, finishText: '4' });
                wizard.stepNext();
                expect(wizard.get('activeIndex')).toBe(3);
            });

            it('should decrement `activeIndex` by 1 when `stepPrevious` is called', function () {
                var wizard = new Wizard({ steps: steps, activeIndex: 2 });
                wizard.stepPrevious();
                expect(wizard.get('activeIndex')).toBe(1);
            });

            it('should do nothing when `stepPrevious` is called on the first step', function () {
                var wizard = new Wizard({ steps: steps, activeIndex: 0 });
                wizard.stepPrevious();
                expect(wizard.get('activeIndex')).toBe(0);
            });

            it('should reset `activeIndex` to 0 if `steps` is changed and no new `activeIndex` is given', function () {
                var wizard = new Wizard({ steps: steps, activeIndex: 2 });
                wizard.set('steps', steps.slice(0, 2));
                expect(wizard.get('activeIndex')).toBe(0);
            })

            it('should create as many `<li>` element as `steps.length` if no `finishText` is specified', function () {
                var wizard = new Wizard({ steps: steps });
                wizard.appendTo(container);
                var nodes = container.getElementsByTagName('li');
                expect(nodes.length).toBe(steps.length);
                expect(getText(nodes[0])).toBe('1');
                expect(getText(nodes[1])).toBe('2');
                expect(getText(nodes[2])).toBe('3');
            });

            it('should create an extra `<li>` element if `finishText` is given', function () {
                var wizard = new Wizard({ steps: steps, finishText: '4' });
                wizard.appendTo(container);
                var nodes = container.getElementsByTagName('li');
                expect(nodes.length).toBe(steps.length + 1);
                expect(getText(nodes[3])).toBe('4');
            });

            it('should add a `ui-wizard-node` class to each node', function () {
                var wizard = new Wizard({ steps: steps, finishText: '4' });
                wizard.appendTo(container);
                var nodes = container.getElementsByTagName('li');
                expect(nodes[0].className).toMatch(/ui-wizard-node/);
                expect(nodes[1].className).toMatch(/ui-wizard-node/);
                expect(nodes[2].className).toMatch(/ui-wizard-node/);
                expect(nodes[3].className).toMatch(/ui-wizard-node/);
            });

            it('should add a `ui-wizard-node-active` class to the active node', function () {
                var wizard = new Wizard({ steps: steps, activeIndex: 1 });
                wizard.appendTo(container);
                var nodes = container.getElementsByTagName('li');
                expect(nodes[1].className).toMatch(/ui-wizard-node-active/);
            });

            it('should add a `ui-wizard-node-first` class to the first node', function () {
                var wizard = new Wizard({ steps: steps });
                wizard.appendTo(container);
                var nodes = container.getElementsByTagName('li');
                expect(nodes[0].className).toMatch(/ui-wizard-node-first/);
            });

            it('should add a `ui-wizard-node-last` class to the last node', function () {
                var wizard = new Wizard({ steps: steps });
                wizard.appendTo(container);
                var nodes = container.getElementsByTagName('li');
                expect(nodes[2].className).toMatch(/ui-wizard-node-last/);
            });

            it('should change the active node when `activeIndex` is changed', function () {
                var wizard = new Wizard({ steps: steps });
                wizard.appendTo(container);
                wizard.set('activeIndex', 2);
                var nodes = container.getElementsByTagName('li');
                expect(nodes[0].className).not.toMatch(/ui-wizard-node-active/);
                expect(nodes[2].className).toMatch(/ui-wizard-node-active/);
            });

            it('should rerender nodes when `steps` is changed', function () {
                var wizard = new Wizard({ steps: steps });
                wizard.appendTo(container);
                wizard.set('steps', steps.slice(0, 2));
                var nodes = container.getElementsByTagName('li');
                expect(nodes.length).toBe(2);
                expect(getText(nodes[0])).toBe('1');
                expect(getText(nodes[1])).toBe('2');
            });

            it('should rerender nodes when `finishText` is changed', function () {
                var wizard = new Wizard({ steps: steps });
                wizard.appendTo(container);
                wizard.set('finishText', '4');
                var nodes = container.getElementsByTagName('li');
                expect(nodes.length).toBe(4);
                expect(getText(nodes[3])).toBe('4');
            });

            it('should add a `ui-wizard-panel-hidden` class on all related `panel` for non-active nodes when rendered', function () {
                container.innerHTML = '<div id="a"></div><div id="b"></div>';
                var wizard = new Wizard({ steps: steps });
                wizard.appendTo(container);
                expect(document.getElementById('a').className).not.toMatch(/ui-wizard-panel-hidden/);
                expect(document.getElementById('b').className).toMatch(/ui-wizard-panel-hidden/);
            });

            it('should add a `ui-wizard-panel-hidden` class on all related `panel` for non-active nodes when `activeIndex` is changed', function () {
                container.innerHTML = '<div id="a"></div><div id="b"></div>';
                var wizard = new Wizard({ steps: steps });
                wizard.appendTo(container);
                wizard.set('activeIndex', 1);
                expect(document.getElementById('a').className).toMatch(/ui-wizard-panel-hidden/);
                expect(document.getElementById('b').className).not.toMatch(/ui-wizard-panel-hidden/);
            });

            describe('`enter` event', function () {
                it('should fire when `activeIndex` is changed', function () {
                    var wizard = new Wizard({ steps: steps });
                    wizard.appendTo(container);
                    var handler = jasmine.createSpy();
                    wizard.on('enter', handler);
                    wizard.set('activeIndex', 2);
                    expect(handler).toHaveBeenCalled();
                });

                it('should fire when `steps` is changed', function () {
                    var wizard = new Wizard({ steps: steps });
                    wizard.appendTo(container);
                    var handler = jasmine.createSpy();
                    wizard.on('enter', handler);
                    wizard.set('steps', steps.slice(0, 2));
                    expect(handler).toHaveBeenCalled();
                });

                it('should not fire when `activeIndex` is set but not changed', function () {
                    var wizard = new Wizard({ steps: steps });
                    wizard.appendTo(container);
                    var handler = jasmine.createSpy();
                    wizard.on('enter', handler);
                    wizard.set('activeIndex', 0);
                    expect(handler).not.toHaveBeenCalled();
                });

                it('should not fire when `steps` is set but not changed', function () {
                    var wizard = new Wizard({ steps: steps });
                    wizard.appendTo(container);
                    var handler = jasmine.createSpy();
                    wizard.on('enter', handler);
                    wizard.set('steps', steps);
                    expect(handler).not.toHaveBeenCalled();
                });

                it('should fire when `stepNext` is called', function () {
                    var wizard = new Wizard({ steps: steps });
                    wizard.appendTo(container);
                    var handler = jasmine.createSpy();
                    wizard.on('enter', handler);
                    wizard.stepNext();
                    expect(handler).toHaveBeenCalled();
                });

                it('should not fire when `stepNext` is called on the last step', function () {
                    var wizard = new Wizard({ steps: steps, activeIndex: 2 });
                    wizard.appendTo(container);
                    var handler = jasmine.createSpy();
                    wizard.on('enter', handler);
                    wizard.stepNext();
                    expect(handler).not.toHaveBeenCalled();
                });

                it('should fire when `stepPrevious` is called', function () {
                    var wizard = new Wizard({ steps: steps, activeIndex: 2 });
                    wizard.appendTo(container);
                    var handler = jasmine.createSpy();
                    wizard.on('enter', handler);
                    wizard.stepPrevious();
                    expect(handler).toHaveBeenCalled();
                });

                it('should not fire when `stepPrevious` is called on the first step', function () {
                    var wizard = new Wizard({ steps: steps, activeIndex: 0 });
                    wizard.appendTo(container);
                    var handler = jasmine.createSpy();
                    wizard.on('enter', handler);
                    wizard.stepPrevious();
                    expect(handler).not.toHaveBeenCalled();
                });
            });
        });
    });
});