/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 提供事件相关操作的基类
 * @author otakustay
 */
define(
    function (require) {
        var lib = require('./lib');
        var Event = require('./Event');
        var EventQueue = require('./EventQueue');

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
        function EventTarget() {
        }

        /**
         * 注册一个事件处理函数
         *
         * @param {string} type 事件的类型
         * @param {Function | boolean} fn 事件的处理函数，
         * 特殊地，如果此参数为`false`，将被视为特殊的事件处理函数，
         * 其效果等于`preventDefault()`及`stopPropagation()`
         * @param {Mixed} [thisObject] 事件执行时`this`对象
         * @param {Object} [options] 事件相关配置项
         * @param {boolean} [options.once=false] 控制事件仅执行一次
         */
        EventTarget.prototype.on = function (type, fn, thisObject, options) {
            if (!this.miniEventPool) {
                this.miniEventPool = {};
            }

            if (!this.miniEventPool.hasOwnProperty(type)) {
                this.miniEventPool[type] = new EventQueue();
            }

            var queue = this.miniEventPool[type];

            options = lib.extend({}, options);
            if (thisObject) {
                options.thisObject = thisObject;
            }

            queue.add(fn, options);
        };

        /**
         * 注册一个仅执行一次的处理函数
         *
         * @param {string} type 事件的类型
         * @param {Function} fn 事件的处理函数
         * @param {Mixed} [thisObject] 事件执行时`this`对象
         * @param {Object} [options] 事件相关配置项
         */
        EventTarget.prototype.once = function (type, fn, thisObject, options) {
            options = lib.extend({}, options);
            options.once = true;
            this.on(type, fn, thisObject, options);
        };

        /**
         * 注销一个事件处理函数
         *
         * @param {string} type 事件的类型，
         * 如果值为`*`仅会注销通过`*`为类型注册的事件，并不会将所有事件注销
         * @param {Function} [handler] 事件的处理函数，
         * 无此参数则注销`type`指定类型的所有事件处理函数
         * @param {Mixed} [thisObject] 处理函数对应的`this`对象，
         * 无此参数则注销`type`与`handler`符合要求，且未挂载`this`对象的处理函数
         */
        EventTarget.prototype.un = function (type, handler, thisObject) {
            if (!this.miniEventPool
                || !this.miniEventPool.hasOwnProperty(type)
            ) {
                return;
            }

            var queue = this.miniEventPool[type];
            queue.remove(handler, thisObject);
        };

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
        EventTarget.prototype.fire = function (type, args) {
            // 只提供一个对象作为参数，则是`.fire(args)`的形式，需要加上type
            if (arguments.length === 1 && typeof type === 'object') {
                args = type;
                type = args.type;
            }

            if (!type) {
                throw new Error('No event type specified');
            }

            if (type === '*') {
                throw new Error('Cannot fire global event');
            }

            var event = args instanceof Event
                ? args
                : new Event(type, args);
            event.target = this;

            // 无论`this.miniEventPool`有没有被初始化，
            // 如果有直接挂在对象上的方法是要触发的
            var inlineHandler = this['on' + type];
            if (typeof inlineHandler === 'function') {
                inlineHandler.call(this, event);
            }

            // 在此处可能没有`miniEventPool`，这是指对象整个就没初始化，
            // 即一个事件也没注册过就`fire`了，这是正常现象
            if (this.miniEventPool && this.miniEventPool.hasOwnProperty(type)) {
                var queue = this.miniEventPool[type];
                queue.execute(event, this);
            }

            // 同时也有可能在上面执行标准事件队列的时候，把这个`EventTarget`给销毁了，
            // 此时`miniEventPool`就没了，这种情况是正常的不能抛异常，要特别处理
            if (this.miniEventPool && this.miniEventPool.hasOwnProperty('*')) {
                var globalQueue = this.miniEventPool['*'];
                globalQueue.execute(event, this);
            }

            return event;
        };

        /**
         * 销毁所有事件
         */
        EventTarget.prototype.destroyEvents = function () {
            if (!this.miniEventPool) {
                return;
            }

            for (var name in this.miniEventPool) {
                if (this.miniEventPool.hasOwnProperty(name)) {
                    this.miniEventPool[name].dispose();
                }
            }

            this.miniEventPool = null;
        };

        /**
         * 在无继承关系的情况下，使一个对象拥有事件处理的功能
         * 
         * @param {Mixed} target 需要支持事件处理功能的对象
         * @static
         */
        EventTarget.enable = function (target) {
            target.miniEventPool = {};
            lib.extend(target, EventTarget.prototype);
        };

        return EventTarget;
    }
);
