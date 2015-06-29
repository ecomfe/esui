define(function (require) {
    var lib = require('esui/lib');
    var $ = require('jquery');

    describe('Libs', function () {
        it('hasAttribute', function () {
            var $input = $('#hasAttribute');
            var b = lib.hasAttribute($input[0], 'disabled');

            // 测试单属性
            expect(b).toBe(true);
            // 有值的属性
            b = lib.hasAttribute($input[0], 'style');
            expect(b).toBe(true);

            $input.removeAttr('disabled');

            b = lib.hasAttribute($input[0], 'disabled');
            expect(b).toBe(false);
        });

        it('setAttribute', function () {
            var $input = $('#hasAttribute');
            lib.setAttribute($input[0], 'type', 'radio');

            expect($input.attr('type')).toBe('radio');
        });
    });
});