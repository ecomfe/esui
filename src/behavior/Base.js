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
                    var defaultProp = Base.defaultProperties;

                    this.options = u.extend({}, options);
                    this.customEventPrefix = defaultProp.customEventPrefix;
                    this.eventNamespace = '.' + this.type + $.guid++;
                    this.classPrefix = [defaultProp.classPrefix, this.type].join('-');
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
                 * @param {string} styleType class名称
                 * @return {string}
                 */
                getClassName: function (styleType) {
                    var me = this;
                    if (!styleType) {
                        return this.classPrefix;
                    }
                    var options = this.options;
                    styleType = styleType.split(/\s+/g);
                    var classes = [];
                    u.each(
                        styleType,
                        function (type) {
                            if (type.indexOf(me.classPrefix) === 0) {
                                return type;
                            }
                            classes.push(options[type + 'Class'] || [me.classPrefix, type].join('-'));
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
                    var args = u.toArray(arguments);
                    this.toggleClass.apply(this, args.concat([true]));
                },

                /**
                 * 删除元素指定className
                 *
                 * @param {Element|string} element $元素
                 * @param {string} className class名称
                 */
                removeClass: function (element, className) {
                    var args = u.toArray(arguments);
                    this.toggleClass.apply(this, args.concat([false]));
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
                        element = $(element);
                    }
                    element.toggleClass(this.getClassName(className), toggle);
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

                    // we can probably remove the unbind calls in 2.0
                    // all event bindings should go through this._on()
                    this.element
                        .unbind(this.eventNamespace)
                        .removeData(this.type);

                    // clean up events and states
                    this.bindings.unbind(this.eventNamespace);
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
