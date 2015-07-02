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
        var u = require('underscore');
        var eoo = require('eoo');

        /**
         * ESUI行为库基类构造函数
         * @param {Object=} options 行为选项
         * @param {Element} element 行为对应的元素
         */
        var Base = eoo.create(
            {
                type: 'behaviorBase',

                constructor: function (options, element) {
                    this.options = u.extend({}, Base.defaultProperties, options);
                    this.customEventPrefix = this.options.customEventPrefix;
                    this.eventNamespace = '.' + this.type + $.guid++;
                    this.classPrefix = this.options.classPrefix;
                    this.bindings = $();

                    this.element = $(element);
                    element = this.element[0];
                    this.document = $(
                        element.style ? element.ownerDocument : (element.document || element)
                    );
                    this.window = $(this.document[0].defaultView || this.document[0].parentWindow);

                    this.init();
                },

                init: function () {},

                /**
                 * 触发事件，做两件事情：
                 * 1. 触发this.element上的同名事件
                 * 2. 调用this.options上的同名方法
                 *
                 * @param {string} type 事件类型
                 * @param {Event} event $.Event
                 * @param {Object} data 传给handler的data
                 * @return {boolean} 是否阻止后续行为
                 */
                trigger: function (type, event, data) {
                    event = $.Event(event);
                    event.type = (this.customEventPrefix + type).toLowerCase();
                    event.target = this.element[0];

                    // 将原生event属性拷贝到自定义事件上
                    var orig = event.originalEvent;
                    if (orig) {
                        for (var prop in orig) {
                            if (!(prop in event)) {
                                event[prop] = orig[prop];
                            }
                        }
                    }

                    data = data || {};
                    this.element.trigger(event, data);

                    var callback = this.options[type];
                    return !(
                        $.isFunction(callback)
                        && callback.apply(this.element[0], [event].concat(data)) === false
                    );
                },

                /**
                 * 事件监听
                 * @param {boolean=} suppressDisabledCheck disabled状态时是否禁止触发
                 * @param {Element=} element 元素
                 * @param {Function|string} handlers 如果为string，则为实例的方法名
                 */
                on: function (suppressDisabledCheck, element, handlers) {
                    // 未指定suppressDisabledCheck
                    if (typeof suppressDisabledCheck !== 'boolean') {
                        handlers = element;
                        element = suppressDisabledCheck;
                        suppressDisabledCheck = false;
                    }

                    // 未指定element
                    if (!handlers) {
                        handlers = element;
                        element = this.element;
                    }
                    else {
                        element = $(element);
                        this.bindings = this.bindings.add(element);
                    }

                    var me = this;
                    $.each(
                        handlers,
                        function (event, handler) {

                            function handlerProxy() {
                                // 允许子元素自行决定在disabled状态时是否响应事件
                                if (!suppressDisabledCheck && (me.options.disabled === true)) {
                                    return;
                                }
                                handler = typeof handler === 'string' ? me[handler] : handler;
                                return handler.apply(me, arguments);
                            }

                            // 复制guid,方便unbind
                            if (typeof handler !== 'string') {
                                handlerProxy.guid = handler.guid
                                    = handler.guid || handlerProxy.guid || $.guid++;
                            }

                            // .on(event selector)
                            var match = event.match(/^([\w:-]*)\s*(.*)$/);
                            var eventName = match[1] + me.eventNamespace;
                            var selector = match[2];
                            element.on(eventName, selector, handlerProxy);
                        }
                   );
                },

                /**
                 * 获取带前缀的class
                 * @param {boolean=} fullName 是否返回全称
                 * @param {string} typeName typeName
                 * @param {string} styleType class名称
                 * @return {string}
                 */
                getClassName: function (fullName, styleType, typeName) {
                    var me = this;
                    var prefix = me.classPrefix;

                    if (u.isString(fullName)) {
                        typeName = styleType;
                        styleType = fullName;
                        fullName = false;
                    }

                    if (!typeName) {
                        typeName = this.type;
                    }

                    styleType = styleType || '';

                    var options = me.options;
                    var classes = [];
                    u.each(
                        styleType.split(/\s+/g),
                        function (type) {
                            var result;

                            if (type) {
                                if (type.indexOf(prefix) === 0) {
                                    result = type;
                                }
                                else {
                                    result = [prefix, typeName, type].join('-');
                                }
                            }
                            else {
                                result = [prefix, typeName].join('-');
                            }
                            if (fullName) {
                                result = '.' + result
                            }
                            classes.push(result);
                        }
                    );
                    return classes.join(' ');
                },

                /**
                 * 为元素添加className
                 * @param {Element|string} element $元素
                 * @param {string} className class名称
                 */
                addClass: function (element, className) {
                    this.toggleClass(element, className, true);
                },

                /**
                 * 删除元素指定className
                 *
                 * @param {Element|string} element $元素
                 * @param {string} className class名称
                 */
                removeClass: function (element, className) {
                    this.toggleClass(element, className, false);
                },

                /**
                 * 添加或删除元素class
                 *
                 * @param {Element|string} element $元素
                 * @param {string} className class名称
                 * @param {boolean} toggle 添加或删除
                 */
                toggleClass: function (element, className, toggle) {
                    if (u.isBoolean(element)) {
                        toggle = element;
                        className = '';
                        element = this.element;
                    }
                    else if (u.isBoolean(className)) {
                        toggle = className;
                        className = element;
                        element = this.element;
                    }
                    else {
                        element = $(element || this.element);
                    }
                    element.toggleClass(this.getClassName(className), toggle);
                },

                /**
                 * 判断是否包含指定class
                 *
                 * @param {Element|string} element $元素
                 * @param {string} className class名称
                 */
                hasClass: function (element, className) {
                    if (u.isString(element)) {
                        className = element;
                        element = this.element;
                    }
                    element.hasClass(this.getClassName(className));
                },

                setOptions: function (options) {
                    var me = this;
                    u.each(
                        options,
                        function (item, key) {
                            me.setOption(key, options[key]);
                        }
                    );
                },

                setOption: function (key, value) {
                    this.options[key] = value;
                },

                enable: function () {
                    return this.setOptions({disabled: false});
                },

                disable: function () {
                    return this.setOptions({disabled: true});
                },

                dispose: function () {

                    // TODO: 考虑自动移除classes

                    this.element
                        .off(this.eventNamespace)
                        .removeData(this.type);

                    this.bindings.off(this.eventNamespace);
                }
            }
        );

        Base.defaultProperties = {
            customEventPrefix: 'base',
            classPrefix: 'ui'
        };

        return Base;
    }
);
