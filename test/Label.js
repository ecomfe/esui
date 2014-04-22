define(function (require) {
    var Label = require('esui/Label');
    var esui = require('esui');

    describe('Label', function () {
        describe('created via script', function () {
            it('should create a `<esui-label>` element if `tagName` is not specified', function () {
                var label = new Label();
                label.appendTo(container);
                expect(label.main.nodeName.toLowerCase()).toBe('esui-label');
            });

            it('should create a specified element if `tagName` is given', function () {
                var label = new Label({ tagName: 'h1' });
                label.appendTo(container);
                expect(label.main.nodeName.toLowerCase()).toBe('h1');
            });
        });

        describe('created via HTML', function () {
            var label;
            beforeEach(function () {
                var html = '<h1 data-ui="type: Label;id: test;">Hello World</h1>';
                container.innerHTML = html;
                esui.init(container);
                label = esui.getViewContext().get('test');
            });

            it('should be able to create from HTML', function () {
                expect(label).toBeDefined();
            });

            it('should read `tagName` from HTML element', function () {
                expect(label.get('tagName')).toBe('h1');
            });

            it('should read the correct text from HTML element', function () {
                expect(label.getText()).toBe('Hello World');
            });
        });

        describe('generally', function () {
            it('should return the exact string given via `setText` when calling `getText`', function () {
                var label = new Label();
                label.appendTo(container);
                label.setText('Hello World');
                expect(label.getText()).toBe('Hello World');
            });

            it('should encode html when calling `setText`', function () {
                var label = new Label();
                label.appendTo(container);
                label.setText('<>"&');
                expect(label.getText()).toBe('<>"&');
            });

            it('should encode HTML when setting `title` property', function () {
                var label = new Label();
                label.appendTo(container);
                label.setTitle('<>"&');
                expect(label.getTitle()).toBe('<>"&');
            });
        });
    });
});