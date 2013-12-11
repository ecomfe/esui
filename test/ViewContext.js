define(function (require) {
    var ViewContext = require('esui/ViewContext');

    function FakeControl(group) {
        this.enable = jasmine.createSpy('enable');
        this.disable = jasmine.createSpy('disable');
        this.show = jasmine.createSpy('show');
        this.hide = jasmine.createSpy('hide');
        this.setViewContext = jasmine.createSpy('setViewContext');
        this.group = group;
    }

    FakeControl.prototype.get = function(name) {
        return this[name];
    };

    describe('ViewContext', function () {
        describe('group function', function () {
            it('should have a `getGroup` method', function () {
                var viewContext = new ViewContext();
                expect(viewContext.getGroup).toBeOfType('function');
            });

            it('should add controls to group when control is attached', function () {
                var viewContext = new ViewContext();
                var control = new FakeControl('test');
                viewContext.add(control);

                var group = viewContext.getGroup('test');
                expect(group).toBeOfType('object');
                expect(group.length).toBe(1);
                expect(group[0]).toBe(control);
            });

            it('should remove controls from group when control is detacched', function () {
                var viewContext = new ViewContext();
                var control = new FakeControl('test');
                viewContext.add(control);
                viewContext.remove(control);

                var group = viewContext.getGroup('test');
                expect(group).toBeOfType('object');
                expect(group.length).toBe(0);
            });

            it('should parse group property and handle control with multiple groups when add', function () {
                var viewContext = new ViewContext();
                var control = new FakeControl('a b c');
                viewContext.add(control);

                expect(viewContext.getGroup('a').length).toBe(1);
                expect(viewContext.getGroup('b').length).toBe(1);
                expect(viewContext.getGroup('c').length).toBe(1);
            });

            it('should parse group property and handle control with multiple groups when remove', function () {
                var viewContext = new ViewContext();
                var control = new FakeControl('a b c');
                viewContext.add(control);
                viewContext.remove(control);

                expect(viewContext.getGroup('a').length).toBe(0);
                expect(viewContext.getGroup('b').length).toBe(0);
                expect(viewContext.getGroup('c').length).toBe(0);
            });

            it('should return an empty group even no controls is attached to this group', function () {
                var viewContext = new ViewContext();

                expect(viewContext.getGroup('test')).toBeOfType('object');
                expect(viewContext.getGroup('test').length).toBe(0);
            });

            it('should dispose all groups when cleaned', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                spyOn(group, 'disposeGroup');

                viewContext.clean();
                expect(group.disposeGroup).toHaveBeenCalled();
            });

            it('should dispose all groups when disposed', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                spyOn(group, 'disposeGroup');

                viewContext.dispose();
                expect(group.disposeGroup).toHaveBeenCalled();
            });
        });

        describe('ControlGroup object', function () {
            it('should be live', function () {
                var viewContext = new ViewContext();
                var control = new FakeControl('test');
                viewContext.add(control);

                var group = viewContext.getGroup('test');
                viewContext.remove(control);
                expect(group.length).toBe(0);
            });

            it('should sync `length` property when add', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                viewContext.add(new FakeControl('test'));
                viewContext.add(new FakeControl('test'));
                viewContext.add(new FakeControl('test'));

                expect(group.length).toBe(3);
            });

            it('should sync `length` property when remove', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                viewContext.add(new FakeControl('test'));
                viewContext.add(new FakeControl('test'));
                var control = new FakeControl('test');
                viewContext.add(control);
                viewContext.remove(control);

                expect(group.length).toBe(2);
            });

            it('should move latter elements forward when remove', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                viewContext.add(new FakeControl('test'));
                viewContext.add(new FakeControl('test'));
                var control = new FakeControl('test');
                viewContext.add(control);
                viewContext.add(new FakeControl('test'));
                viewContext.remove(control);

                for (var i = 0; i < 3; i++) {
                    expect(group[i]).toBeDefined();
                }
            });

            it('should sync indexed property when add', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                viewContext.add(new FakeControl('test'));
                viewContext.add(new FakeControl('test'));
                viewContext.add(new FakeControl('test'));

                expect(group[0]).toBeDefined();
                expect(group[1]).toBeDefined();
                expect(group[2]).toBeDefined();
            });

            it('should sync indexed property when remove', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                viewContext.add(new FakeControl('test'));
                viewContext.add(new FakeControl('test'));
                var control = new FakeControl('test');
                viewContext.add(control);
                viewContext.remove(control);

                expect(group[0]).toBeDefined();
                expect(group[1]).toBeDefined();
                expect(group[2]).toBeUndefined();
            });

            it('should have an `enable` method', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');

                expect(group.enable).toBeOfType('function');
            });

            it('should enable all containing controls when `enable` is called', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                var controls = [
                    new FakeControl('test'),
                    new FakeControl('test'),
                    new FakeControl('test')
                ];
                viewContext.add(controls[0]);
                viewContext.add(controls[1]);
                viewContext.add(controls[2]);

                group.enable();

                expect(controls[0].enable).toHaveBeenCalled();
                expect(controls[1].enable).toHaveBeenCalled();
                expect(controls[2].enable).toHaveBeenCalled();
            });

            it('should have an `disable` method', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');

                expect(group.disable).toBeOfType('function');
            });

            it('should disable all containing controls when `disable` is called', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                var controls = [
                    new FakeControl('test'),
                    new FakeControl('test'),
                    new FakeControl('test')
                ];
                viewContext.add(controls[0]);
                viewContext.add(controls[1]);
                viewContext.add(controls[2]);

                group.disable();

                expect(controls[0].disable).toHaveBeenCalled();
                expect(controls[1].disable).toHaveBeenCalled();
                expect(controls[2].disable).toHaveBeenCalled();
            });

            it('should have an `show` method', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');

                expect(group.show).toBeOfType('function');
            });

            it('should show all containing controls when `show` is called', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                var controls = [
                    new FakeControl('test'),
                    new FakeControl('test'),
                    new FakeControl('test')
                ];
                viewContext.add(controls[0]);
                viewContext.add(controls[1]);
                viewContext.add(controls[2]);

                group.show();

                expect(controls[0].show).toHaveBeenCalled();
                expect(controls[1].show).toHaveBeenCalled();
                expect(controls[2].show).toHaveBeenCalled();
            });

            it('should have an `hide` method', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');

                expect(group.hide).toBeOfType('function');
            });

            it('should hide all containing controls when `hide` is called', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                var controls = [
                    new FakeControl('test'),
                    new FakeControl('test'),
                    new FakeControl('test')
                ];
                viewContext.add(controls[0]);
                viewContext.add(controls[1]);
                viewContext.add(controls[2]);

                group.hide();

                expect(controls[0].hide).toHaveBeenCalled();
                expect(controls[1].hide).toHaveBeenCalled();
                expect(controls[2].hide).toHaveBeenCalled();
            });

            it('should have a `disposeGroup` method', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');

                expect(group.disposeGroup).toBeOfType('function');
            });

            it('should remove all containing controls when disposed', function () {
                var viewContext = new ViewContext();
                var group = viewContext.getGroup('test');
                var controls = [
                    new FakeControl('test'),
                    new FakeControl('test'),
                    new FakeControl('test')
                ];
                viewContext.add(controls[0]);
                viewContext.add(controls[1]);
                viewContext.add(controls[2]);

                group.disposeGroup();

                expect(group.length).toBe(0);
                expect(group[0]).toBeUndefined();
                expect(group[1]).toBeUndefined();
                expect(group[2]).toBeUndefined();
            });
        });
    });
});