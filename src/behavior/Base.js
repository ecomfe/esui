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

        var EventTarget = require('mini-event/EventTarget');
        var Base = require('eoo').create(EventTarget, exports);

        /**
         * 默认属性
         */
        Base.defaultProperties = {};

        return Base;
    }
);
