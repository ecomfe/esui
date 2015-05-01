/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file jquery bridge
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {
        /**
         * 将类桥接到jquery插件上
         * 桥接效果：
         * $(element).name(options) --> new Base(options, element),
         * @param {string} name 插件名称
         * @param {Class} Base 要桥接的类
         */
        return function (name, Base) {
            $.fn[name] = function (options) {
                var isMethodCall = typeof options === 'string';
                var args = Array.prototype.slice.call(arguments, 1);
                var returnValue = this;
                var fullName = 'esui-' + name;

                if (isMethodCall) {
                    this.each(
                        function () {
                            var methodValue;
                            var instance = $.data(this, fullName);
                            if (options === 'instance') {
                                returnValue = instance;
                                return false;
                            }
                            if (!instance) {
                                return $.error(
                                    'cannot call methods on ' + name
                                    + ' prior to initialization; '
                                    + 'attempted to call method "'
                                    + options + '"'
                                );
                            }
                            if (!$.isFunction(instance[options]) || options.charAt(0) === '_') {
                                return $.error(
                                    'no such method "' + options + '" for '
                                    + name + ' widget instance'
                                );
                            }
                            methodValue = instance[options].apply(instance, args);
                            if (methodValue !== instance && methodValue !== undefined) {
                                returnValue = methodValue && methodValue.jquery ?
                                    returnValue.pushStack(methodValue.get()) :
                                    methodValue;
                                return false;
                            }
                        }
                    );
                }
                else {

                    // Allow multiple hashes to be passed on init
                    if (args.length) {
                        options = $.extend.apply(null, [options].concat(args));
                    }

                    this.each(
                        function () {
                            var instance = $.data(this, fullName);
                            if (instance) {
                                instance.option(options || {});
                                if (instance._init) {
                                    instance._init();
                                }
                            }
                            else {
                                $.data(this, fullName, new Base(options, this));
                            }
                        }
                    );
                }

                return returnValue;
            };
        };
    }
);
