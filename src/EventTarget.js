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
        var lib = require('./lib');
        // 添加eventPrefix的原因是为了把组件抛出的event作为一个自定义事件。
        // JQ在调用自定义的非自定义事件的时候会把触发当前对象上的事件同名函数。
        // 为了利用JQ的事件机制。
        var eventPrefix = 'esui:';

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
                 * @return {Event} 事件传递过程中的`Event`对象
                 */
                fire: function (type, args) {
                    var event = $.Event(eventPrefix + type);
                    $(this).trigger(event, args);
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

        function getNamespace() {
            var namespace = this.type || 'default';
            return '.' + namespace;
        }

        return EventTarget;
    }
);
