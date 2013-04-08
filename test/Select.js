define(function (require) {
    var Select = require('esui/Select');
    var datasource = [
        { text: 'a', value: '1' },
        { text: 'b', value: '2' },
        { text: 'c', value: '3' },
        { text: 'd', value: '4' },
        { text: 'e', value: '5' },
        { text: 'f', value: '6' }
    ];

    describe('Select', function () {
        it('should be a constructor', function () {
            expect(Select).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Select()).toBeOfType('object');
        });

        describe('create via script', function () {
            it('should create a `<div>` element as its main element', function () {
                var select = new Select();
                select.appendTo(container);
                expect(container.getElementsByTagName('div').length).toBeGreaterThan(0);
            });
        });

        describe('generally', function () {
            it('should have a `input[type="hidden"]` element', function () {
                var select = new Select();
                select.appendTo(container);
                expect(container.getElementsByTagName('input').length).toBe(1);
                expect(container.getElementsByTagName('input')[0].type).toBe('hidden');
            });

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

            it('should adjust value related properties if given a non-exist `value`', function () {
                var select = new Select({ datasource: datasource, value: '10' });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should adjust value related properties if given a non-exist `rawValue`', function () {
                var select = new Select({ datasource: datasource, rawValue: '10' });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should adjust value related properties if given a out-of-range `selectedIndex`', function () {
                var select = new Select({ datasource: datasource, selectedIndex: 10 });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should assign value related properties by default if none of them are given', function () {
                var select = new Select({ datasource: datasource });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should adjust value related properties if `datasource` is change in runtime which causes value to be unsynced', function () {
                var select = new Select({ datasource: datasource, value: '6' });
                select.appendTo(container);
                select.setProperties({ datasource: datasource.slice(0, 3) });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should not adjust value related properties if `datasource` is change but value is still in sync', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ datasource: datasource.slice(0, 3) });
                expect(select.get('selectedIndex')).toBe(1);
                expect(select.getRawValue()).toBe('2');
            });

            it('should adjust value related properties if `value` is change in runtime and is given a non-exist value', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ value: '10' });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');                
            });

            it('should adjust value related properties if `rawValue` is change in runtime and is given a non-exist value', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ rawValue: '10' });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should adjust value related properties if `selectedIndex` is change in runtime and is given an out-of-range value', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ selectedIndex: 10 });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should accept runtime change of `value`', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ value: '3' });
                expect(select.get('selectedIndex')).toBe(2);
                expect(select.getRawValue()).toBe('3');
            });

            it('should accept runtime change of `rawValue`', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ rawValue: '3' });
                expect(select.get('selectedIndex')).toBe(2);
                expect(select.getRawValue()).toBe('3');
            });

            it('should accept runtime change of `selectedIndex`', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ selectedIndex: 2 });
                expect(select.get('selectedIndex')).toBe(2);
                expect(select.getRawValue()).toBe('3');
            });

            it('should fire a `change` event if `value` is changed', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ value: '3' });
                expect(spy).toHaveBeenCalled();
            });

            it('should fire a `change` event if `rawValue` is changed', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ rawValue: '3' });
                expect(spy).toHaveBeenCalled();
            });

            it('should fire a `change` event if `selectedIndex` is changed', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ selectedIndex: 2 });
                expect(spy).toHaveBeenCalled();
            });

            it('should not fire a `change` event if `value` is given the same as previous', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ value: '2' });
                expect(spy).not.toHaveBeenCalled();
            });

            it('should not fire a `change` event if `rawValue` is given the same as previous', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ rawValue: '2' });
                expect(spy).not.toHaveBeenCalled();
            });


            it('should not fire a `change` event if `selectedIndex` is given the same as previous', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ selectedIndex: 1 });
                expect(spy).not.toHaveBeenCalled();
            });
        });
    });
});