define(function (require) {
    var esui = require('esui');
    var Button = require('esui/Button');
    var container = document.getElementById('container');
    describe('Button common', function () {
        it('should be a constructor', function () {
            expect(Button).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Button()).toBeOfType('object');
        });

        describe('create via script', function () {
            it('should create a `<div>` element as its main element', function () {
                var button = new Button();
                button.appendTo(container);
                expect(container.getElementsByTagName('div').length).toBe(0);
            });
        });
        describe('created via HTML', function () {
            var button;
            beforeEach(function () {
                var html = '<div data-ui="type: Button;id: test;">Button</div>';
                container.innerHTML = html;
                esui.init(container);
                button = esui.getViewContext().get('test');
            });

            it('should be able to create from HTML', function () {
                expect(button).toBeDefined();
            });

            it('should read `tagName` from HTML element', function () {
                expect(button.get('tagName')).toBe('div');
            });
        });
    });
    
    describe('Button options', function () {
        describe('generally', function () {
            it('should change the lable of button via `setContent`', function () {
                var button = new Button();
                button.appendTo(container);
                button.setContent('New Button');
                expect(button.main.innerHTML).toBe('New Button');
            });
        });
    });
    
    describe('Button events', function () {
        describe('generally', function () {
            it('should change the lable of button via `setContent`', function () {
                var button = new Button();
                button.appendTo(container);
                button.setContent('New Button');
                expect(button.main.innerHTML).toBe('New Button');
            });
        });
    });
    
    describe('Button methods', function () {
        describe('generally', function () {
            it('should change the lable of button via `setContent`', function () {
                var button = new Button();
                button.appendTo(container);
                button.setContent('New Button');
                expect(button.main.innerHTML).toBe('New Button');
            });
        });
    });
});