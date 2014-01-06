define(function (require) {
    var control = {
        id: 'foo',
        skin: 'bar',
        type: 'velo'
    };
    var helper = new (require('esui/Helper'))(control);
    control.helper = helper;

    var engine = new (require('etpl').Engine)();
    engine.parse('<!-- target: id -->${test | id(${instance})}');
    engine.parse('<!-- target: class -->${test | class(${instance})}');
    engine.parse('<!-- target: part -->${test | part(\'div\', ${instance})}');
    engine.parse('<!-- target: idSmartName -->${test.id}');
    engine.parse('<!-- target: classSmartName -->${test.class}');
    engine.parse('<!-- target: common -->Hello ${name}');
    helper.setTemplateEngine(engine);

    describe('template module for `Helper`', function () {
        it('should expose `setTemplateEngine` method to `Helper`', function () {
            expect(helper.setTemplateEngine).toBeOfType('function');
        });

        it('should generate id with `id` filter', function () {
            var html = helper.renderTemplate('id', {});
            expect(html).toBe(helper.getId('test'));
        });

        it('should generate class name with `class` filter', function () {
            var html = helper.renderTemplate('class', {});
            expect(html).toBe(helper.getPartClassName('test'));
        });

        it('should generate part html with `part` filter', function () {
            var html = helper.renderTemplate('part', {});
            expect(html).toBe(helper.getPartHTML('test', 'div'));
        });

        it('should generate id with `.id` smart name', function () {
            var html = helper.renderTemplate('idSmartName', {});
            expect(html).toBe(helper.getId('test'));
        });

        it('should generate class name with `.class` smart name', function () {
            var html = helper.renderTemplate('classSmartName', {});
            expect(html).toBe(helper.getPartClassName('test'));
        });

        it('should behave as normall for common property access', function () {
            var html = helper.renderTemplate('common', { name: 'foo' });
            expect(html).toBe('Hello foo');
        })
    });
});
