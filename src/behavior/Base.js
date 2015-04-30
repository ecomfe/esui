/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 鼠标事件
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {

        var $ = require('jquery');

        var exports = {};

        exports.type = 'behaviorBase';

        exports.constructor = function (element) {
            this.$super(arguments);
            this.element = $(element);
			this.document = $(
                element.style ? element.ownerDocument : (element.document || element)
            );
			this.window = $(this.document[0].defaultView || this.document[0].parentWindow);
        };

        var EventTarget = require('mini-event/EventTarget');
        var Base = require('eoo').create(EventTarget, exports);

        Base.defaultProperties = {

        };

        Base.bridge = function (name, base) {

            $.fn[name] = function(options) {
                var isMethodCall = typeof options === "string";
                var args = Array.prototype.slice.call(arguments, 1);
                var returnValue = this;

                if (isMethodCall) {
                    this.each(
                        function() {
                            var methodValue;
                            var instance = $.data(this, fullName);
                            if (options === "instance") {
                                returnValue = instance;
                                return false;
                            }
                            if (!instance) {
                                return $.error(
                                    "cannot call methods on " + name
                                    + " prior to initialization; "
                                    + "attempted to call method '"
                                    + options + "'"
                                );
                            }
                            if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
                                return $.error(
                                    "no such method '" + options + "' for "
                                    + name + " widget instance"
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
                        function() {
                            var instance = $.data(this, fullName);
                            if (instance) {
                                instance.option(options || {});
                                if (instance._init) {
                                    instance._init();
                                }
                            }
                            else {
                                $.data(this, fullName, new base(options, this));
                            }
                        }
                    );
                }

                return returnValue;
            };
        };

        return Base;
    }
);
