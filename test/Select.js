define(function (require) {
    var Select = require('esui/Select');
    var datasource = [
        { name: 'a', value: '1' },
        { name: 'b', value: '2' },
        { name: 'c', value: '3' },
        { name: 'd', value: '4' },
        { name: 'e', value: '5' },
        { name: 'f', value: '6' }
    ];

    function findLayer() {
        for (var i = document.body.children.length - 1; i >= 0; i--) {
            var element = document.body.children[i];
            if (/ui-select-layer/.test(element.className)) {
                return element;
            }
        }
        return null;
    }

    describe('Select', function () {
        it('should be a constructor', function () {
            expect(Select).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Select()).toBeOfType('object');
        });

        describe('created via script', function () {
            it('should create a `<div>` element as its main element', function () {
                var select = new Select();
                select.appendTo(container);
                expect(container.getElementsByTagName('div').length).toBeGreaterThan(0);
            });
        });

        describe('created via HTML', function () {
            it('should extract datasource from child `<option>` elements if main element is a `<select>`', function () {
                var html = [
                    '<select data-ui-type="Select" data-ui-id="test">',
                        '<option value="1">a</option>',
                        '<option value="2">b</option>',
                        '<option value="3" selected="selected">c</option>',
                        '<option value="4">d</option>',
                        '<option value="5">e</option>',
                        '<option value="6">f</option>',
                    '</select>'
                ];
                container.innerHTML = html;
                require('esui/main').init(container);
                var select = require('esui/main').get('test');
                expect(select.get('datasource')).toEqual(datasource);
                expect(select.getValue()).toBe('3');
            });

            it('should remove the old `<select>` main element and create a `<div>` instead', function () {
                container.innerHTML = '<select data-ui="type: Select; id: test;"></select>';
                require('esui/main').init(container);
                var select = require('esui/main').get('test');
                expect(container.getElementsByTagName('select').length).toBe(0);
                expect(select.get('main').nodeName.toLowerCase()).toBe('div');
            });
        });

        describe('generally', function () {
            it('should accept `text` config property and treat it as `name`', function () {
                var datasource = [
                    { text: 'a', value: '1' }
                ];
                var select = new Select({ datasource: datasource });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                expect(getText(findLayer().children[0])).toBe('a');
            });

            it('should use `name` over `text` if both are given', function () {
                var datasource = [
                    { text: 'a', name: 'b', value: '1' }
                ];
                var select = new Select({ datasource: datasource });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                expect(getText(findLayer().children[0])).toBe('b');
            });

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

            it('should select the first item if given a non-exist `value` and no `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, value: '10' });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should select `emptyText` if given a non-exist `value` when `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, value: '10', emptyText: 'test' });
                expect(select.get('selectedIndex')).toBe(-1);
                expect(select.getRawValue()).toBe(null);
            });

            it('should select the first item if given a non-exist `rawValue` and no `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, rawValue: '10' });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should select `emptyText` if given a non-exist `rawValue` when `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, rawValue: '10', emptyText: 'test' });
                expect(select.get('selectedIndex')).toBe(-1);
                expect(select.getRawValue()).toBe(null);
            });

            it('should select the first item if given a out-of-range `selectedIndex` and no `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, selectedIndex: 10 });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should select `emptyText` if given a out-of-range `selectedIndex` when `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, selectedIndex: 10, emptyText: 'test' });
                expect(select.get('selectedIndex')).toBe(-1);
                expect(select.getRawValue()).toBe(null);
            });

            it('should select the first item by default if none of them are given', function () {
                var select = new Select({ datasource: datasource });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should select `emptyText` by default if only `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, emptyText: 'test' });
                expect(select.get('selectedIndex')).toBe(-1);
                expect(select.getRawValue()).toBe(null);
            });

            it('should render `emptyText` when `emptyText` is selcted', function () {
                var select = new Select({ datasource: datasource, emptyText: 'test' });
                select.appendTo(container);
                expect(select.main.firstChild.innerHTML).toBe('test');
            });

            it('should select the first item if `datasource` is changed in runtime which causes value to be unsynced and no `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, value: '6' });
                select.appendTo(container);
                select.setProperties({ datasource: datasource.slice(0, 3) });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should select the first item if `datasource` is changed in runtime which causes value to be unsynced but `selectedIndex` is still in range and no `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ datasource: datasource.slice(3) });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('4');
            });

            it('should select `emptyText` if `datasource` is change in runtime which causes value to be unsynced when `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, value: '6', emptyText: 'test' });
                select.appendTo(container);
                select.setProperties({ datasource: datasource.slice(0, 3) });
                expect(select.get('selectedIndex')).toBe(-1);
                expect(select.getRawValue()).toBe(null);
            });

            it('should select `emptyText` if `datasource` is changed in runtime which causes value to be unsynced but `selectedIndex` is still in range when `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, value: '2', emptyText: 'test' });
                select.appendTo(container);
                select.setProperties({ datasource: datasource.slice(3, 3) });
                expect(select.get('selectedIndex')).toBe(-1);
                expect(select.getRawValue()).toBe(null);
            });

            it('should not adjust value related properties if `datasource` is changed but value is still in sync', function () {
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

            it('should select the first item if `selectedIndex` is changed in runtime and is given an out-of-range value and no `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ selectedIndex: 10 });
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should `emptyText` if `selectedIndex` is changed in runtime and is given an out-of-range value when `emptyText` is given', function () {
                var select = new Select({ datasource: datasource, value: '2', emptyText: 'test' });
                select.appendTo(container);
                select.setProperties({ selectedIndex: 10 });
                expect(select.get('selectedIndex')).toBe(-1);
                expect(select.getRawValue()).toBe(null);
            });

            it('should select the first item if `emptyText` is removed when `emptyText` is previously selected', function () {
                var select = new Select({ datasource: datasource, emptyText: 'test' });
                select.set('emptyText', null);
                expect(select.get('selectedIndex')).toBe(0);
                expect(select.getRawValue()).toBe('1');
            });

            it('should keep selecting `emptyText` if `datasource` is changed and given an item whose value is empty', function () {
                var select = new Select({ datasource: datasource, emptyText: 'test' });
                select.set('datasource', [{ name: 'x', value: '' }]);
                expect(select.get('selectedIndex')).toBe(-1);
                expect(select.getRawValue()).toBe(null);
            })

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

            it('should accept runtime change of `emptyText`', function () {
                var select = new Select({ datasource: datasource, emptyText: 'test' });
                select.appendTo(container);
                select.set('emptyText', 'changed');
                expect(select.main.firstChild.innerHTML).toBe('changed');
                expect(select.main.getElementsByTagName('input')[0].value).toBe('');
            });

            it('should utilize `displayTemplate` when display selected value text', function () {
                var select = new Select({ datasource: datasource, selectedIndex: 0 });
                select.displayTemplate = '${text} test ${value}';
                select.appendTo(container);
                expect(select.main.firstChild.innerHTML).toBe('a test 1');
            });

            it('should not utilize `displayTemplate` if `emptyText` is set and used', function () {
                var select = new Select({ datasource: datasource, emptyText: 'test' });
                select.appendTo(container);
                expect(select.main.firstChild.innerHTML).toBe('test');
            });

            it('should call `getDisplayHTML` when display selected value text', function () {
                var select = new Select({ datasource: datasource, selectedIndex: 0 });
                select.getDisplayHTML = function (item) {
                    return 'test';
                };
                spyOn(select, 'getDisplayHTML').andCallThrough();
                select.appendTo(container);
                expect(select.getDisplayHTML).toHaveBeenCalled();
                expect(select.getDisplayHTML.mostRecentCall.args.length).toBe(1);
                expect(select.getDisplayHTML.mostRecentCall.args[0]).toBe(datasource[0]);
                expect(select.main.firstChild.innerHTML).toBe('test');
            });

            it('should call `getDisplayHTML` with null when `emptyText` is set and used', function () {
                var select = new Select({ datasource: datasource, emptyText: 'test' });
                select.getDisplayHTML = function (item) {
                    return 'changed';
                };
                spyOn(select, 'getDisplayHTML').andCallThrough();
                select.appendTo(container);
                expect(select.getDisplayHTML).toHaveBeenCalled();
                expect(select.getDisplayHTML.mostRecentCall.args.length).toBe(1);
                expect(select.getDisplayHTML.mostRecentCall.args[0]).toBe(null);
                expect(select.main.firstChild.innerHTML).toBe('changed');
            });

            it('should sync `selectedIndex` after `value` is changed', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                select.setProperties({ value: '3' });
                expect(select.get('selectedIndex')).toBe(2);
                expect(select.getRawValue()).toBe('3');
            });

            it('should open a layer with className `ui-select-layer` under `body` when clicked', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                expect(layer).toBeDefined();
                expect(layer.className).not.toMatch(/ui-select-layer-hidden/);
            });

            it('should add a className `ui-select-layer-selected` to the selected option in layer', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                expect(layer.children[0].className).not.toMatch(/ui-select-layer-selected/);
                expect(layer.children[1].className).toMatch(/ui-select-layer-selected/);
                expect(layer.children[2].className).not.toMatch(/ui-select-layer-selected/);
                expect(layer.children[3].className).not.toMatch(/ui-select-layer-selected/);
                expect(layer.children[4].className).not.toMatch(/ui-select-layer-selected/);
                expect(layer.children[5].className).not.toMatch(/ui-select-layer-selected/);
            });

            it('should change the element with `ui-select-layer-selected` class when value is changed', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                select.setValue('3');
                var layer = findLayer();
                expect(layer.children[0].className).not.toMatch(/ui-select-layer-selected/);
                expect(layer.children[1].className).not.toMatch(/ui-select-layer-selected/);
                expect(layer.children[2].className).toMatch(/ui-select-layer-selected/);
                expect(layer.children[3].className).not.toMatch(/ui-select-layer-selected/);
                expect(layer.children[4].className).not.toMatch(/ui-select-layer-selected/);
                expect(layer.children[5].className).not.toMatch(/ui-select-layer-selected/);
            });

            it('should select the correct item if an option element in layer is clicked', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                var option = layer.children[2];
                dispatchEvent(option, 'click');
                expect(select.get('selectedIndex')).toBe(2);
                expect(select.getValue()).toBe('3');
                expect(select.getRawValue()).toBe('3');
            });

            it('should hide the layer when item is clicked', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                var option = layer.children[2];
                dispatchEvent(option, 'click');
                expect(layer.className).toMatch(/ui-select-layer-hidden/);
            });

            it('should destroy the layer when disposed', function () {
                var select = new Select({ datasource: datasource });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                select.dispose();
                var layer = findLayer();
                expect(layer).toBe(null);
            });

            it('should hide the layer when itself is set to hidden even if the layer is previously shown', function () {
                var select = new Select({ datasource: datasource });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                expect(layer.className).not.toMatch(/ui-select-layer-hidden/);
                select.hide();
                expect(layer.className).toMatch(/ui-select-layer-hidden/);
            });

            it('should be able to customize item template by changeing the `itemTemplate` property', function () {
                var select = new Select({ datasource: datasource });
                select.itemTemplate = '123';
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                for (var i = 0; i < layer.children.length; i++) {
                    expect(layer.children[i].innerHTML).toBe('123');
                }
            });

            it('should be able to customize item template by changing the `getItemHTML` function', function () {
                var select = new Select({ datasource: datasource });
                select.getItemHTML = function () { return '123'; };
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                for (var i = 0; i < layer.children.length; i++) {
                    expect(layer.children[i].innerHTML).toBe('123');
                }
            });
        });

        describe('when disabled', function () {
            it('should not open the layer when clicked', function () {
                var select = new Select({ datasource: datasource, disabled: true });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                if (layer) {
                    expect(layer.className).toMatch(/ui-select-layer-hidden/);
                }
            });

            it('must hide the layer even if the layer is previous set to visible', function () {
                var select = new Select({ datasource: datasource });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                expect(layer.className).not.toMatch(/ui-select-layer-hidden/);
                select.disable();
                expect(layer.className).toMatch(/ui-select-layer-hidden/);
            });

            it('should repaint as normal when properties changed', function () {
                var select = new Select({ datasource: datasource, disabled: true });
                select.appendTo(container);
                select.setProperties({ value: '3' });
                expect(select.getValue()).toBe('3');
                expect(container.getElementsByTagName('span')[0].innerHTML).toBe('c');
            });

            it('should return to normal after enabled again', function () {
                var select = new Select({ datasource: datasource, disabled: true });
                select.appendTo(container);
                select.enable();
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                expect(layer).toBeDefined();
            });
        });

        describe('when readOnly', function () {
            it('should not open the layer when clicked', function () {
                var select = new Select({ datasource: datasource, readOnly: true });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                if (layer) {
                    expect(layer.className).toMatch(/ui-select-layer-hidden/);
                }
            });

            it('must hide the layer even if the layer is previous set to visible', function () {
                var select = new Select({ datasource: datasource });
                select.appendTo(container);
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                expect(layer.className).not.toMatch(/ui-select-layer-hidden/);
                select.setReadOnly(true);
                expect(layer.className).toMatch(/ui-select-layer-hidden/);
            });

            it('should repaint as normal when properties changed', function () {
                var select = new Select({ datasource: datasource, readOnly: true });
                select.appendTo(container);
                select.setProperties({ value: '3' });
                expect(select.getValue()).toBe('3');
                expect(container.getElementsByTagName('span')[0].innerHTML).toBe('c');
            });

            it('should return to normal after enabled again', function () {
                var select = new Select({ datasource: datasource, readOnly: true });
                select.appendTo(container);
                select.enable();
                dispatchEvent(select.main, 'click');
                var layer = findLayer();
                expect(layer).toBeDefined();
            });
        });

        describe('`change` event', function () {
            it('should fire if `value` is changed', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ value: '3' });
                expect(spy).toHaveBeenCalled();
            });

            it('should fire if `rawValue` is changed', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ rawValue: '3' });
                expect(spy).toHaveBeenCalled();
            });

            it('should fire if `selectedIndex` is changed', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ selectedIndex: 2 });
                expect(spy).toHaveBeenCalled();
            });

            it('should fire if `datasource` is changed which causes the first item to be selected', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.set('datasource', datasource.slice(3));
                expect(spy).toHaveBeenCalled();
            });

            it('should fire if `datasource` is changed which causes `emptyText` to be selected', function () {
                var select = new Select({ datasource: datasource, value: '2', emptyText: 'test' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.set('datasource', datasource.slice(3));
                expect(spy).toHaveBeenCalled();
            });

            it('should fire if `value` is changed to a non-exist value', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.set('value', 'abc');
                expect(spy).toHaveBeenCalled();
            });

            it('should fire if `rawValue` is changed to a non-exist value', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.set('rawValue', 'abc');
                expect(spy).toHaveBeenCalled();
            });

            it('should fire if `selectedIndex` is changed to an out-of-range value', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.set('selectedIndex', -1);
                expect(spy).toHaveBeenCalled();
            });

            it('should not fire if `value` is given the same as previous', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ value: '2' });
                expect(spy).not.toHaveBeenCalled();
            });

            it('should not fire if `rawValue` is given the same as previous', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ rawValue: '2' });
                expect(spy).not.toHaveBeenCalled();
            });

            it('should not fire if `selectedIndex` is given the same as previous', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.setProperties({ selectedIndex: 1 });
                expect(spy).not.toHaveBeenCalled();
            });

            it('should not fire if `datasource` is changed but value is still available as previous', function () {
                var select = new Select({ datasource: datasource, value: '2' });
                var spy = jasmine.createSpy();
                select.on('change', spy);
                select.appendTo(container);
                select.set('datasource', datasource.slice(0, 3));
                expect(spy).not.toHaveBeenCalled();
            });
        });
    });
});