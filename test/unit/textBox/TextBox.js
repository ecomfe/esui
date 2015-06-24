define(function (require) {
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
            it('should create a `<esui-text-box>` element as its main element', function () {
                var textbox = new TextBox();
                textbox.appendTo(container);
                expect(textbox.main.nodeName.toLowerCase()).toBe('esui-text-box');
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

            it('should remove `tabindex` attribute to prevent tab navigation problem', function () {
                var div = document.createElement('div');
                div.innerHTML = '<input type="text" tabindex="1" />';
                var main = div.firstChild;

                var textbox = new TextBox({ main: main });
                textbox.appendTo(container);
                expect(hasAttribute(textbox.main, 'tabindex')).toBe(false);
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
                if ('placeholder' in document.createElement('input')) {
                    // ie8中对 input 设置了 placeholder，会造成 'placeholder' in input 为 true
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

            describe('hint label', function () {
                it('should appear when `hint` is set', function () {
                    var textbox = new TextBox({ hint: 'px' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var hintLabel = textbox.main.getElementsByTagName('label');
                    for (var i = 0; i < hintLabel.length; i++) {
                        if (hintLabel[i].className.indexOf('hint') >= 0) {
                            hintLabel = hintLabel[i];
                            break;
                        }
                    }
                    expect(hintLabel).toBeDefined();
                    expect(hintLabel.nodeName.toLowerCase()).toBe('label');
                    expect(hintLabel.getAttribute('for') || hintLabel.getAttribute('htmlFor')).toBe(input.id);
                    expect(hintLabel.className).toContain('ui-textbox-hint');
                    expect(hintLabel.innerHTML).toBe('px');
                });

                it('should not appear when `hint` is not set or is a falsy value', function () {
                    var textbox = new TextBox();
                    textbox.appendTo(container);
                    var labels = textbox.main.getElementsByTagName('label');
                    var hintLabel;
                    for (var i = 0; i < labels.length; i++) {
                        if (labels[i].className.indexOf('hint') >= 0) {
                            hintLabel = labels[i];
                            break;
                        }
                    }
                    expect(hintLabel).toBeUndefined();
                });

                it('should appear before `<input>` element when `hintType` is set to `prefix`', function () {
                    var textbox = new TextBox({ hint: 'px', hintType: 'prefix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var hintLabel = input.previousSibling;
                    expect(hintLabel).toBeDefined();
                    expect(hintLabel.className).toContain('ui-textbox-hint');
                });

                it('should appear before `<input>` element when `hintType` is set to `suffix`', function () {
                    var textbox = new TextBox({ hint: 'px', hintType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var hintLabel = input.nextSibling;
                    expect(hintLabel).toBeDefined();
                    expect(hintLabel.className).toContain('ui-textbox-hint');
                });

                it('should appear after `<input>` element when `hintType` is not set', function () {
                    var textbox = new TextBox({ hint: 'px', hintType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var hintLabel = input.nextSibling;
                    expect(hintLabel).toBeDefined();
                    expect(hintLabel.className).toContain('ui-textbox-hint');
                });

                it('should add `ui-textbox-hint-{hintType}` class to main element', function () {
                    var textbox = new TextBox({ hint: 'px', hintType: 'suffix' });
                    textbox.appendTo(container);
                    expect(textbox.main.className).toContain('ui-textbox-hint-suffix');
                    textbox.set('hintType', 'prefix');
                    expect(textbox.main.className).toContain('ui-textbox-hint-prefix');
                });

                it('should accept runtime change of `hint`', function () {
                    var textbox = new TextBox({ hint: 'px', hintType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var hintLabel = input.nextSibling;
                    expect(hintLabel.innerHTML).toBe('px');
                    textbox.set('hint', 'test');
                    expect(hintLabel.innerHTML).toBe('test');
                });

                it('should accept runtime change of `hintType`', function () {
                    var textbox = new TextBox({ hint: 'px', hintType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var hintLabel = input.nextSibling;
                    textbox.set('hintType', 'prefix');
                    expect(input.previousSibling).toBe(hintLabel);
                });

                it('should be removed when `hint` is set to falsy', function () {
                    var textbox = new TextBox({ hint: 'px', hintType: 'suffix' });
                    textbox.appendTo(container);
                    var input = textbox.main.getElementsByTagName('input')[0];
                    var hintLabel = input.nextSibling;

                    textbox.set('hint', '');
                    var hasNotParent =
                           hintLabel.parentNode === null || hintLabel.parentElement == null;
                    expect(hasNotParent).toBe(true);
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