/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file ESUI Behavior Base
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {

        var $ = require('jquery');
        var lib = require('esui/lib');
        var u = require('underscore');

        /**
         * ESUI行为库基类
         */
        var exports = {};

        exports.type = 'behaviorBase';

        /**
         * 构造函数
         * @param {Object=} options 行为选项
         * @param {Element} element 行为对应的元素
         */
        exports.constructor = function (options, element) {
            this.$super(arguments);
            if (u.isElement(options)) {
                element = options;
                options = {};
            }
            this.options = lib.extend({}, this.$self.defaultProperties, options);
            this.element = $(element);
            element = this.element[0];
            this.document = $(
                element.style ? element.ownerDocument : (element.document || element)
            );
            this.window = $(this.document[0].defaultView || this.document[0].parentWindow);

            this.init();
        };

        /**
         * 初始化
         */
        exports.init = function () {};

        exports.fire = function (type, data) {
            // 由于mini-event会覆盖data的target属性，
            // 所以这里要额外存一个副本
            if (data && !data.$target && data.target) {
                data.$target = data.target;
            }
            var me = this;
            var callback = function (event) {
                var func = me.options[type];
                if (u.isFunction(func)) {
                    var result = func.call(me, event);
                    if (result === false) {
                        event.preventDefault();
                    }
                }
            }
            var event = this.$super(arguments);
            callback(event);

            return event;
        }

        var EventTarget = require('mini-event/EventTarget');
        var Base = require('eoo').create(EventTarget, exports);

        /**
         * 默认属性
         */
        Base.defaultProperties = {};

        return Base;
    }
);
