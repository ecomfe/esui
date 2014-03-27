define(function (require) {
    var SearchBox = require('esui/SearchBox');

    function getInputElement(box) {
        return box.main.getElementsByTagName('input')[0];
    }

    function getButtonElement(box) {
        return box.main.getElementsByTagName('span')[0];
    }

    describe('SearchBox', function () {
        it('should be a constructor', function () {
            expect(SearchBox).toBeOfType('function');
        });

        it('should be instaitable', function () {
            expect(new SearchBox()).toBeOfType('object');
        });

        describe('created via script', function () {
            it('should create a `esui-search-box` element by default', function () {
                var box = new SearchBox();
                expect(box.main).toBeElement('esui-search-box');
            });
        });

        describe('created via HTML', function () {
            describe('when use a `<input>` as main element', function () {
                it('should treat DOM attributes as control properties', function () {
                    var div = document.createElement('div');
                    div.innerHTML = '<input value="value" title="title" maxlength="10" placeholder="placeholder" />';
                    var main = div.firstChild;
                    var box = new SearchBox({ main: main });

                    expect(box.get('text')).toBe('value');
                    expect(box.get('title')).toBe('title');
                    expect(box.get('maxLength')).toBe(10);
                    expect(box.get('placeholder')).toBe('placeholder');
                });

                it('should preserve a clone of the `<input>` element', function () {
                    var div = document.createElement('div');
                    div.innerHTML = '<input id="test-search-box-input" />';
                    var main = div.firstChild;
                    var box = new SearchBox({ main: main });
                    box.appendTo(container);

                    expect(document.getElementById('test-search-box-input')).toBeDefined();
                });

                it('should replace the `<input>` element with a `<esui-search-box>`', function () {
                    var div = document.createElement('div');
                    div.innerHTML = '<input />';
                    var main = div.firstChild;
                    var box = new SearchBox({ main: main });
                    box.appendTo(container);
                    expect(box.main).toBeElement('esui-search-box');
                });
            });

            describe('when use a non-input element', function () {
                it('should treat DOM attributes and `innerHTML` as control properties', function () {
                    var main = document.createElement('div');
                    main.setAttribute('title', 'title');
                    main.innerHTML = 'value';
                    var box = new SearchBox({ main: main });

                    expect(box.get('text')).toBe('value');
                    expect(box.get('title')).toBe('title');
                });
            });
        });

        describe('generally', function () {
            it('should contain a `<input>` and a `<span>` element', function () {
                var box = new SearchBox();
                box.appendTo(container);

                var textbox = getInputElement(box);
                var button = getButtonElement(box);

                expect(textbox).toBeElement('input');
                expect(textbox.type).toBe('text');
                expect(button).toBeElement('span');
            });

            it('should reflect some properties to DOM attributes ans styles', function () {
                var box = new SearchBox({
                    title: 'title',
                    text: 'text',
                    maxLength: 10,
                    placeholder: 'placeholder',
                    width: 100,
                    disabled: true,
                    readOnly: true
                });
                box.appendTo(container);

                var textbox = getInputElement(box);

                expect(box.main.title).toBe('title');
                expect(textbox.value).toBe('text');
                expect(textbox.maxLength).toBe(10);
                //原生不支持placeholder，需要用 getAttribute
                expect(textbox.getAttribute('placeholder')).toBe('placeholder');
                expect(textbox.style.width).toBe('100px');
                expect(textbox.disabled).toBe(true);
                expect(textbox.readOnly).toBe(true);
            });
        });

        describe('search event', function () {
            it('should fire when click on button', function () {
                var box = new SearchBox();
                box.appendTo(container);
                var handler = jasmine.createSpy('search');
                box.on('search', handler);

                var button = getButtonElement(box);
                dispatchEvent(button, 'click');

                expect(handler).toHaveBeenCalled();
            });

            it('should fire when press enter in textbox', function () {
                var box = new SearchBox();
                box.appendTo(container);
                var handler = jasmine.createSpy('search');
                box.on('search', handler);

                var textbox = getInputElement(box);
                textbox.focus();
                dispatchEvent(textbox, 'keypress', { keyCode: 13 });

                expect(handler).toHaveBeenCalled();
            });
        });

        describe('input event', function () {
            it('should fire when input in textbox', function () {
                var box = new SearchBox();
                box.appendTo(container);
                var handler = jasmine.createSpy('input');
                box.on('input', handler);

                var textbox = getInputElement(box);
                textbox.focus();
                dispatchEvent(textbox, 'input', { keyCode: 13 });
                expect(handler).toHaveBeenCalled();
            });
        });
    });
});