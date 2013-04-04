define(function (require) {
    var Select = require('esui/Select');
    var container = document.getElementById('container');

    describe('Select', function () {
        it('should be a constructor', function () {
            expect(Select).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Select()).toBeOfType('object');
        });

        it('should create a `<div>` element as its main element', function () {
            var select = new Select();
            select.appendTo(container);
            expect(container.getElementsByTagName('div').length).toBeGreaterThan(0);
        });

        it('should have a `input[type="hidden"]` element', function () {
            var select = new Select();
            select.appendTo(container);
            expect(container.getElementsByTagName('input').length).toBe(1);
            expect(container.getElementsByTagName('input')[0].type).toBe('hidden');
        });

        var datasource = [
            { text: 'a', value: '1' },
            { text: 'b', value: '2' },
            { text: 'c', value: '3' },
            { text: 'd', value: '4' },
            { text: 'e', value: '5' },
            { text: 'f', value: '6' },
        ];

        it('should accept a `value` option and render it to `<input>` element', function () {
            var select = new Select({ datasource: datasource, value: '3' });
            select.appendTo(container);
            expect(container.getElementsByTagName('input')[0].value).toBe('3');
        });

        it('should accept a `selectedIndex` option and render it to `<input>` element', function () {
            var select = new Select({ datasource: datasource, selectedIndex: 2 });
            select.appendTo(container);
            expect(container.getElementsByTagName('input')[0].value).toBe('3');
        });

        it('should accept `value` if `value` and `selectedIndex` are both given', function () {
            var select = new Select({ datasource: datasource, value: '3', selectedIndex: 5 });
            select.appendTo(container);
            expect(container.getElementsByTagName('input')[0].value).toBe('3');
        });

        it('should accept `rawValue` if `value` and `rawValue` are both given', function () {
            var select = new Select({ datasource: datasource, value: '2', rawValue: '3' });
            select.appendTo(container);
            expect(container.getElementsByTagName('input')[0].value).toBe('3');
        });

        it('should accept `rawValue` if `value`, `rawValue` and `selectedIndex` are all given', function () {
            var select = new Select({ datasource: datasource, value: '2', rawValue: '3', selectedIndex: 5 });
            select.appendTo(container);
            expect(container.getElementsByTagName('input')[0].value).toBe('3');  
        });

        it('should render selected item\'s text to its content', function () {
            var select = new Select({ datasource: datasource, value: '3' });
            select.appendTo(container);
            expect(container.getElementsByTagName('span')[0].innerHTML).toBe('c');
        });
    });
});