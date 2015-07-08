/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 提供事件相关操作的基类
 * @author otakustay, maoquan
 */
define(
    function (require) {
        var eoo = require('eoo');
        // 添加eventPrefix的原因是为了把组件抛出的event作为一个自定义事件。
        // JQ在调用自定义的非自定义事件的时候会把触发当前对象上的事件同名函数。
        // 为了利用JQ的事件机制。
        var eventPrefix = 'esui:';
        var u = require('underscore');

        /**
         * 提供事件相关操作的基类
         *
         * 可以让某个类继承此类，获得事件的相关功能：
         *
         *     function MyClass() {
         *         // 此处可以不调用EventTarget构造函数
         *     }
         *
         *     inherits(MyClass, EventTarget);
         *
         *     var instance = new MyClass();
         *     instance.on('foo', executeFoo);
         *     instance.fire('foo', { bar: 'Hello World' });
         *
         * 当然也可以使用`Object.create`方法：
         *
         *     var instance = Object.create(EventTarget.prototype);
         *     instance.on('foo', executeFoo);
         *     instance.fire('foo', { bar: 'Hello World' });
         *
         * 还可以使用`enable`方法让一个静态的对象拥有事件功能：
         *
         *     var instance = {};
         *     EventTarget.enable(instance);
         *
         *     // 同样可以使用事件
         *     instance.on('foo', executeFoo);
         *     instance.fire('foo', { bar: 'Hello World' });
         *
         * @constructor
         */
        var EventTarget = eoo.create(
            {

                /**
                 * 注册一个事件处理函数
                 *
                 * @param {string} type 事件的类型
                 * @param {Function} fn 事件的处理函数
                 */
                on: function (type, fn) {
                    var namespace = getNamespace.call(this);
                    $(this).on(eventPrefix + type + namespace, fn);
                },

                /**
                 * 注册一个仅执行一次的处理函数
                 *
                 * @param {string} type 事件的类型
                 * @param {Function} fn 事件的处理函数
                 */
                once: function (type, fn) {
                    $(this).one(eventPrefix + type, fn);
                },

                /**
                 * 注销一个事件处理函数
                 *
                 * @param {string} type 事件的类型，
                 * 如果值为`*`仅会注销通过`*`为类型注册的事件，并不会将所有事件注销
                 * @param {Function} [handler] 事件的处理函数，
                 * 无此参数则注销`type`指定类型的所有事件处理函数
                 */
                un: function (type, handler) {
                    var namespace = getNamespace.call(this);
                    $(this).off(eventPrefix + type + namespace, handler);
                },

                /**
                 * 触发指定类型的事件
                 *
                 * 3个重载：
                 *
                 * - `.fire(type)`
                 * - `.fire(args)`
                 * - `.fire(type, args)`
                 *
                 * @param {string | Mixed} type 事件类型
                 * @param {Mixed} [args] 事件对象
                 * @param {DOMEvent} [domEvent] 事件对象
                 * @return {Event} 事件传递过程中的`Event`对象
                 */
                fire: function (type, args, domEvent) {
                    var jqEvent = $.Event;
                    var event = jqEvent(eventPrefix + type);

                    // 把args extend到event上去。
                    // 但是推荐使用handler(event, args)方式来绑定事件
                    makeEventCompatible(event, args);

                    // 触发实例上的on type方法。
                    var inlineHandler = this['on' + type];
                    if (typeof inlineHandler === 'function') {
                        inlineHandler.call(this, event, args);
                    }
                    // 触发绑定的handlers
                    $(this).trigger(event, args);
                    // 在取消control event时候同时取消相关DOMEvent
                    // event.delegate中会用到这个方法
                    // 因为preventDefault和冒泡是同步的，所以这里可以保证执行
                    handleDOMEvent(domEvent, event);

                    return event;
                },

                /**
                 * 销毁所有事件
                 */
                destroyEvents: function () {
                    var namespace = getNamespace.call(this);
                    $(this).off(namespace);
                },

                /**
                 * 在无继承关系的情况下，使一个对象拥有事件处理的功能
                 *
                 * @param {Mixed} target 需要支持事件处理功能的对象
                 * @static
                 */
                enable: function (target) {
                    u.extend(target, EventTarget.prototype);
                }
            }
        );

        function makeEventCompatible(event, args) {
            var oldType = event.type;
            if (u.isObject(args)) {
                u.extend(event, args);
            }
            else if (args) {
                event.data = args;
            }
            event.type = oldType;
        }

        function handleDOMEvent(domEvent, event) {
            if (domEvent) {
                if (event.isDefaultPrevented()) {
                    domEvent.preventDefault();
                }
                if (event.isPropagationStopped()) {
                    domEvent.stopPropagation();
                }
                if (event.isImmediatePropagationStopped()) {
                    domEvent.stopImmediatePropagation();
                }
            }
        }

        function getNamespace() {
            var namespace = this.type || 'default';
            return '.' + namespace;
        }

        return EventTarget;
    }
);
