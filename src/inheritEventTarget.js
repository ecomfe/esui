/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 让一个类继承事件功能
 * @author otakustay, errorrik
 */
define(
    function (require) {
        function interopDefault(exports) {
            return exports.__esModule ? exports.default : exports;
        }

        var EventTarget = interopDefault(require('mini-event/EventTarget'));
        var oo = require('eoo');

        /**
         * 让一个类继承自`mini-event.EventTarget`
         *
         * @param {Object} proto 类的原型
         * @return {Function} 类
         */
        return function inheritEventTarget(proto) {
            return oo.create(EventTarget, proto);
        };
    }
);
