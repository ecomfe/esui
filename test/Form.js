define(function (require) {
    var Form = require('esui/Form');
    var container = document.getElementById('container');

    describe('Form', function () {
        describe('created via script', function () {
            it('should create a `<form>` element', function () {
                var form = new Form();
                expect(form.main.nodeName.toLowerCase()).toBe('form');
            });

            it('should create a `<form>` element even `tagName` is given from constructor', function () {
                var form = new Form({ tagName: 'div' });
                expect(form.get('tagName')).toBe('form');
                expect(form.main.nodeName.toLowerCase()).toBe('form');
            });

            it('should render `action` attribute to `<form>` element if given', function () {
                var form = new Form({ action: 'abc' });
                expect(form.get('action')).toBe('abc');
                expect(form.main.getAttribute('action')).toBe('abc');
            });

            it('should make the `<form>` element\'s `method` attribute "POST"', function () {
                var form = new Form();
                expect(form.main.getAttribute('method').toUpperCase()).toBe('POST');
            });
        });

        describe('create via HTML', function () {
            it('should read `action` method from main element when created from `<form>` element', function () {
                var main = document.createElement('form');
                main.action = 'abc';
                var form = new Form({ main: main });
                expect(form.get('action')).toBe('abc');
            });

            it('should give default values to properties when created form other elements', function () {
                var main = document.createElement('div');
                var form = new Form({ main: main });
                expect(form.get('method')).toBe('POST');
            });
        });

        var InputControl= require('esui/InputControl');
        function FakeInput(name, i) {
            this.rawValue = i;
            this.name = name;
            InputControl.call(this, {});
        }
        require('esui/lib').inherits(FakeInput, InputControl);

        // TODO: 如何测试`getData`？
    });
});