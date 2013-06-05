define(function () {
    var TextBox = require('esui/TextBox');

    function findInput(textbox) {
        return textbox.main.getElementsByTagName('input')[0]
            || textbox.main.getElementsByTagName('textarea')[0];
    }

    describe('TextBox', function () {
        it('should be a constructor', function () {
            expect(TextBox).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new TextBox()).toBeOfType('object');
        });

        describe('should have default property value', function () {
            var textbox = new TextBox();
            it('mode === "text"', function () { expect(textbox.get('mode')).toBe('text'); });
            it('value === ""', function () { expect(textbox.get('value')).toBe(''); });
            it('placeholder === ""', function () { expect(textbox.get('placeholder')).toBe(''); });
            it('autoSelect === false', function () { expect(textbox.get('autoSelect')).toBe(false); });
        });

        describe('created via script', function () {
            it('should create a `<div>` element as its main element', function () {
                var textbox = new TextBox();
                textbox.appendTo(container);
                expect(textbox.main.nodeName.toLowerCase()).toBe('div');
            });

            it('should create a correct `<input type="text" />` element if `mode` is "text"', function () {
                var textbox = new TextBox({ mode: 'text', name: 'test' });
                textbox.appendTo(container);
                var input = findInput(textbox);
                expect(input).toBeDefined();
                expect(input.type).toBe('text');
                expect(input.name).toBe('test');
            });

            it('should create a `<input type="password" />` element if `mode` is "password"', function () {
                var textbox = new TextBox({ mode: 'password', name: 'test' });
                textbox.appendTo(container);
                var input = findInput(textbox);
                expect(input).toBeDefined();
                expect(input.type).toBe('password');
                expect(input.name).toBe('test');
            });

            it('should create a `<textarea>` element if `mode` is "textarea"', function () {
                var textbox = new TextBox({ mode: 'textarea', name: 'test' });
                textbox.appendTo(container);
                var input = findInput(textbox);
                expect(input).toBeDefined();
                expect(input.name).toBe('test');
            });
        });

        describe('created via DOM', function () {
            it('should extract properties from the elemnt', function () {
                var div = document.createElement('div');
                div.innerHTML = '<input type="text" name="test" placeholder="test" value="test" />';
                var main = div.firstChild;

                var textbox = new TextBox({ main: main });
                expect(textbox.get('name')).toBe('test');
                expect(textbox.get('placeholder')).toBe('test');
                expect(textbox.get('value')).toBe('test');
            });

            it('should guess `mode` from the element', function () {
                var div = document.createElement('div');
                div.innerHTML = '<input type="text" />';
                var main = div.firstChild;

                var textbox = new TextBox({ main: main });
                expect(textbox.get('mode')).toBe('text');

                div.innerHTML = '<input />';
                main = div.firstChild;

                textbox = new TextBox({ main: main });
                expect(textbox.get('mode')).toBe('text');

                div.innerHTML = '<input type="password" />';
                main = div.firstChild;

                textbox = new TextBox({ main: main });
                expect(textbox.get('mode')).toBe('password');

                div.innerHTML = '<textarea type="password"></textarea>';
                main = div.firstChild;

                textbox = new TextBox({ main: main });
                expect(textbox.get('mode')).toBe('textarea');
            });

            it('should preserve attributes from original DOM element', function () {
                var div = document.createElement('div');
                div.innerHTML = '<input type="text" maxlength="3" />';
                var main = div.firstChild;

                var textbox = new TextBox({ main: main });
                textbox.appendTo(container);
                expect(findInput(textbox).getAttribute('maxlength')).toBe('3');
            });
        });

        describe('generally', function () {
            it('should sync value when input text', function () {
                var textbox = new TextBox();
                textbox.appendTo(container);
                var input = findInput(textbox);
                input.value = 'test';
                if ('oninput' in input) {
                    dispatchEvent(input, 'input');
                }
                expect(textbox.getValue()).toBe('test');
            });

            it('should fire an `input` event when input text', function () {
                var textbox = new TextBox();
                textbox.appendTo(container);
                var handler = jasmine.createSpy('input');
                textbox.on('input', handler);
                var input = findInput(textbox);
                input.value = 'test';
                if ('oninput' in input) {
                    dispatchEvent(input, 'input');
                }
                expect(handler).toHaveBeenCalled();
            });

            it('should delegate `focus` and `blur` events', function () {
                var textbox = new TextBox();
                textbox.appendTo(container);
                var focus = jasmine.createSpy('focus');
                var blur = jasmine.createSpy('blur');
                textbox.on('focus', focus);
                textbox.on('blur', blur);
                var input = findInput(textbox);
                dispatchEvent(input, 'focus');
                dispatchEvent(input, 'blur');
                expect(focus).toHaveBeenCalled();
                expect(blur).toHaveBeenCalled();
            });

            it('should accept `width` and `height` property', function () {
                var textbox = new TextBox();
                textbox.appendTo(container);
                textbox.set('width', 200);
                textbox.set('height', 40);
                var input = findInput(textbox);
                expect(input.style.width).toBe('200px');
                expect(input.style.height).toBe('40px');
            });

            it('should accept `title` property and reflect on `title` DOM attribute', function () {
                var textbox = new TextBox();
                textbox.appendTo(container);
                textbox.set('title', 'test');
                var input = findInput(textbox);
                expect(input.getAttribute('title')).toBe('test');
                var label = textbox.main.getElementsByTagName('label')[0];
                if (label) {
                    expect(label.getAttribute('title')).toBe('test');
                }
            });

            it('should remove `title` DOM attribute when `title` is empty', function () {
                var textbox = new TextBox({ title: 'test' });
                textbox.appendTo(container);
                textbox.set('title', '');
                var input = findInput(textbox);
                expect(hasAttribute(input, 'title')).toBeFalsy();
                var label = textbox.main.getElementsByTagName('label')[0];
                if (label) {
                    expect(hasAttribute(input, 'title')).toBeFalsy();
                }
            });

            it('should accept `placeholder` property and fix compatibility', function () {
                var textbox = new TextBox();
                textbox.appendTo(container);
                textbox.set('placeholder', 'test');
                var input = findInput(textbox);
                if ('placeholder' in input) {
                    expect(input.getAttribute('placeholder')).toBe('test');
                }
                else {
                    var label = textbox.main.getElementsByTagName('label')[0];
                    expect(label).toBeDefined();
                    expect(label.className).toMatch('ui-textbox-placeholder');
                    expect(label.innerHTML).toBe('test');
                    expect(label.getAttribute('for') || label.getAttribute('htmlFor')).toBe(input.id);
                }
            });

            describe('unit label', function () {
                it('should appear when `unit` is set', function () {
                    var textbox = new TextBox({ unit: 'px' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var unitLabel = textbox.main.getElementsByTagName('label');
                    for (var i = 0; i < unitLabel.length; i++) {
                        if (unitLabel[i].className.indexOf('unit') >= 0) {
                            unitLabel = unitLabel[i];
                            break;
                        }
                    }
                    expect(unitLabel).toBeDefined();
                    expect(unitLabel.nodeName.toLowerCase()).toBe('label');
                    expect(unitLabel.getAttribute('for') || unitLabel.getAttribute('htmlFor')).toBe(input.id);
                    expect(unitLabel.className).toContain('ui-textbox-unit');
                    expect(unitLabel.innerHTML).toBe('px');
                });

                it('should not appear when `unit` is not set or is a falsy value', function () {
                    var textbox = new TextBox();
                    textbox.appendTo(container);
                    var labels = textbox.main.getElementsByTagName('label');
                    var unitLabel;
                    for (var i = 0; i < labels.length; i++) {
                        if (labels[i].className.indexOf('unit') >= 0) {
                            unitLabel = labels[i];
                            break;
                        }
                    }
                    expect(unitLabel).toBeUndefined();
                });

                it('should appear before `<input>` element when `unitType` is set to `prefix`', function () {
                    var textbox = new TextBox({ unit: 'px', unitType: 'prefix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var unitLabel = input.previousSibling;
                    expect(unitLabel).toBeDefined();
                    expect(unitLabel.className).toContain('ui-textbox-unit');
                });

                it('should appear before `<input>` element when `unitType` is set to `suffix`', function () {
                    var textbox = new TextBox({ unit: 'px', unitType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var unitLabel = input.nextSibling;
                    expect(unitLabel).toBeDefined();
                    expect(unitLabel.className).toContain('ui-textbox-unit');
                });

                it('should appear after `<input>` element when `unitType` is not set', function () {
                    var textbox = new TextBox({ unit: 'px', unitType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var unitLabel = input.nextSibling;
                    expect(unitLabel).toBeDefined();
                    expect(unitLabel.className).toContain('ui-textbox-unit');
                });

                it('should add `ui-textbox-unit-{unitType}` class to main element', function () {
                    var textbox = new TextBox({ unit: 'px', unitType: 'suffix' });
                    textbox.appendTo(container);
                    expect(textbox.main.className).toContain('ui-textbox-unit-suffix');
                    textbox.set('unitType', 'prefix');
                    expect(textbox.main.className).toContain('ui-textbox-unit-prefix');
                });

                it('should accept runtime change of `unit`', function () {
                    var textbox = new TextBox({ unit: 'px', unitType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var unitLabel = input.nextSibling;
                    expect(unitLabel.innerHTML).toBe('px');
                    textbox.set('unit', 'test');
                    expect(unitLabel.innerHTML).toBe('test');
                });

                it('should accept runtime change of `unitType`', function () {
                    var textbox = new TextBox({ unit: 'px', unitType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var unitLabel = input.nextSibling;
                    textbox.set('unitType', 'prefix');
                    expect(input.previousSibling).toBe(unitLabel);
                });

                it('should be removed when `unit` is set to falsy', function () {
                    var textbox = new TextBox({ unit: 'px', unitType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var unitLabel = input.nextSibling;
                    textbox.set('unit', '');
                    expect(unitLabel.parentNode).toBe(null);
                });
            });

            describe('placeholder', function () {
                it('should appear when `<input>` is not focused and its value is empty', function () {
                    var textbox = new TextBox({ placeholder: 'test' });
                    textbox.appendTo(container);
                    var label = textbox.main.getElementsByTagName('label')[0];
                    // Only test IE
                    if (label) {
                        expect(label.className).not.toContain('hidden');
                    }
                });

                it('should hide when `<input>` is focused', function () {
                    var textbox = new TextBox({ placeholder: 'test' });
                    textbox.appendTo(container);
                    var input = findInput(textbox);
                    dispatchEvent(input, 'focus');
                    var label = textbox.main.getElementsByTagName('label')[0];
                    // Only test IE
                    if (label) {
                        expect(label.className).toContain('hidden');
                    }
                });

                it('should hide when `<input>` has value', function () {
                    var textbox = new TextBox({ placeholder: 'test', value: 'test' });
                    textbox.appendTo(container);
                    var input = findInput(textbox);
                    var label = textbox.main.getElementsByTagName('label')[0];
                    // Only test IE
                    if (label) {
                        expect(label.className).toContain('hidden');
                    }
                });

                it('should appear when `value` is set to empty', function () {
                    var textbox = new TextBox({ placeholder: 'test', value: 'test' });
                    textbox.appendTo(container);
                    textbox.set('value', '');
                    var input = findInput(textbox);
                    var label = textbox.main.getElementsByTagName('label')[0];
                    // Only test IE
                    if (label) {
                        expect(label.className).not.toContain('hidden');
                    }
                })
            })

            // NOTICE: `input`和`enter`事件没法测
            // NOTICE: `autoSelect`没法测
        });
    });
});