define(function (require) {
    var Command = require('esui/extension/Command');

    describe('Command extension', function () {
        it('should be a constructor', function () {
            expect(Command).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Command()).toBeOfType('object');
        });

        it('must have a `type` property on its prototype with value `Command`', function () {
            expect(Command.prototype.type).toBe('Command');
        });

        // TODO: 添加扩展本身的测试

        describe('createDispatcher static method', function () {
            var createDispatcher = Command.createDispatcher;

            it('should be a function', function () {
                expect(createDispatcher).toBeOfType('function');
            });

            it('should accept an object as its `config`', function () {
                expect(createDispatcher({})).toBeOfType('function');
            });

            it('should accept an array as its `config`', function () {
                expect(createDispatcher([])).toBeOfType('function');
            });

            var event = { type: 'command', triggerType: 'click', name: 'test', args: '' };

            describe('when given an object (higher priority is more important)', function () {
                it('should dispatch to given `handler` with name `*` and no `triggerType` with priority 1', function () {
                    var config = {
                        '*': jasmine.createSpy()
                    };
                    var dispatch = createDispatcher(config);
                    dispatch(event);
                    expect(config['*']).toHaveBeenCalled();
                });

                it('should dispatch to given `handler` with name `*` and a matched `triggerType` with priority 2', function () {
                    var config = {
                        'click:*': jasmine.createSpy(),
                        '*': jasmine.createSpy()
                    };
                    var dispatch = createDispatcher(config);
                    dispatch(event);
                    expect(config['click:*']).toHaveBeenCalled();
                    expect(config['*']).not.toHaveBeenCalled();
                });

                it('should dispatch to a `execute${name} method on control instance with priority 3', function () {
                    var config = {
                        'click:*': jasmine.createSpy()
                    };
                    var control = {
                        executeTest: jasmine.createSpy()
                    };
                    var dispatch = createDispatcher(config);
                    dispatch.call(control, event);
                    expect(control.executeTest).toHaveBeenCalled();
                    expect(config['click:*']).not.toHaveBeenCalled();
                });

                it('should dispatch to a `execute${name}${triggerType}` method on control instance with priority 4', function () {
                    var control = {
                        executeTestClick: jasmine.createSpy(),
                        executeTest: jasmine.createSpy()
                    };
                    var dispatch = createDispatcher({});
                    dispatch.call(control, event);
                    expect(control.executeTestClick).toHaveBeenCalled();
                    expect(control.executeTest).not.toHaveBeenCalled();
                });

                it('should dispatch to given `handler` when `name` is matched and `triggerType` is not given with priority 5', function () {
                    var config = {
                        'test': jasmine.createSpy()
                    };
                    var control = {
                        executeTestClick: jasmine.createSpy()
                    };
                    var dispatch = createDispatcher(config);
                    dispatch(event);
                    expect(config['test']).toHaveBeenCalled();
                    expect(control.executeTestClick).not.toHaveBeenCalled();
                });

                it('should dispatch to given `handler` when `triggerType` and `name` are all matched with priority 6', function () {
                    var config = {
                        'click:test': jasmine.createSpy(),
                        'test': jasmine.createSpy()
                    };
                    var dispatch = createDispatcher(config);
                    dispatch(event);
                    expect(config['click:test']).toHaveBeenCalled();
                    expect(config['test']).not.toHaveBeenCalled();
                });
            });

            describe('when given an array (higher priority is more important)', function () {
                it('should dispatch to given `handler` with name `*` and no `triggerType` with priority 1', function () {
                    var config = [
                        { name: '*', handler: jasmine.createSpy() }
                    ];
                    var dispatch = createDispatcher(config);
                    dispatch(event);
                    expect(config[0].handler).toHaveBeenCalled();
                });

                it('should dispatch to given `handler` with name `*` and a matched `triggerType` with priority 2', function () {
                    var config = [
                        { name: '*', triggerType: 'click', handler: jasmine.createSpy() },
                        { name: '*', handler: jasmine.createSpy() }
                    ];
                    var dispatch = createDispatcher(config);
                    dispatch(event);
                    expect(config[0].handler).toHaveBeenCalled();
                    expect(config[1].handler).not.toHaveBeenCalled();
                });

                it('should dispatch to a `execute${name} method on control instance with priority 3', function () {
                    var config = [
                        { name: '*', triggerType: 'click', handler: jasmine.createSpy() }
                    ];
                    var control = {
                        executeTest: jasmine.createSpy()
                    };
                    var dispatch = createDispatcher(config);
                    dispatch.call(control, event);
                    expect(control.executeTest).toHaveBeenCalled();
                    expect(config[0].handler).not.toHaveBeenCalled();
                });

                it('should dispatch to a `execute${name}${triggerType}` method on control instance with priority 4', function () {
                    var control = {
                        executeTestClick: jasmine.createSpy(),
                        executeTest: jasmine.createSpy()
                    };
                    var dispatch = createDispatcher({});
                    dispatch.call(control, event);
                    expect(control.executeTestClick).toHaveBeenCalled();
                    expect(control.executeTest).not.toHaveBeenCalled();
                });

                it('should dispatch to given `handler` when `name` is matched and `triggerType` is not given with priority 5', function () {
                    var config = [
                        { name: 'test', handler: jasmine.createSpy() }
                    ];
                    var control = {
                        executeTestClick: jasmine.createSpy()
                    };
                    var dispatch = createDispatcher(config);
                    dispatch(event);
                    expect(config[0].handler).toHaveBeenCalled();
                    expect(control.executeTestClick).not.toHaveBeenCalled();
                });

                it('should dispatch to given `handler` when `triggerType` and `name` are all matched with priority 6', function () {
                    var config = [
                        { name: 'test', triggerType: 'click', handler: jasmine.createSpy() },
                        { name: 'test', handler: jasmine.createSpy() }
                    ];
                    var dispatch = createDispatcher(config);
                    dispatch(event);
                    expect(config[0].handler).toHaveBeenCalled();
                    expect(config[1].handler).not.toHaveBeenCalled();
                });
            });
        });
    });
});