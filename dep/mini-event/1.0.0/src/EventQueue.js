/**
 * mini-event
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 事件队列
 * @author otakustay
 */
define(
    function (require) {
        var lib = require('./lib');

        /**
         * 判断已有的一个事件上下文对象是否和提供的参数等同
         *
         * @param {Object} context 在队列中已有的事件上下文对象
         * @param {Function | boolean} handler 处理函数，可以是`false`
         * @param {Mixed} [thisObject] 处理函数的`this`对象
         * @return {boolean}
         * @ignore
         */
        function isContextIdentical(context, handler, thisObject) {
            // `thisObject`为`null`和`undefined`时认为等同，所以用`==`
            return context
                && context.handler === handler
                && context.thisObject == thisObject;
        }

        /**
         * 事件队列
         *
         * @constructor
         */
        function EventQueue() {
            this.queue = [];
        }

        /**
         * 添加一个事件处理函数
         *
         * @param {Function | boolean} handler 处理函数，
         * 可以传递`false`作为特殊的处理函数，参考{@link EventTarget#on}
         * @param {Object} [options] 相关配置
         * @param {Mixed} [options.thisObject] 执行处理函数时的`this`对象
         * @param {boolean} [options.once=false] 设定函数仅执行一次
         */
        EventQueue.prototype.add = function (handler, options) {
            if (handler !== false && typeof handler !== 'function') {
                throw new Error(
                    'event handler must be a function or const false');
            }

            var wrapper = {
                handler: handler
            };
            lib.extend(wrapper, options);

            for (var i = 0; i < this.queue.length; i++) {
                var context = this.queue[i];
                // 同样的处理函数，不同的`this`对象，相当于外面`bind`了一把再添加，
                // 此时认为这是完全不同的2个处理函数，但`null`和`undefined`认为是一样的
                if (isContextIdentical(context, handler, wrapper.thisObject)) {
                    return;
                }
            }

            this.queue.push(wrapper);
        };

        /**
         * 移除一个或全部处理函数
         *
         * @param {Function | boolean} [handler] 指定移除的处理函数，
         * 如不提供则移除全部处理函数，可以传递`false`作为特殊的处理函数
         * @param {Mixed} [thisObject] 指定函数对应的`this`对象，
         * 不提供则仅移除没有挂载`this`对象的那些处理函数
         */
        EventQueue.prototype.remove = function (handler, thisObject) {
            // 如果没提供`handler`，则直接清空
            if (!handler) {
                this.clear();
                return;
            }

            for (var i = 0; i < this.queue.length; i++) {
                var context = this.queue[i];

                if (isContextIdentical(context, handler, thisObject)) {
                    // 为了让`execute`过程中调用的`remove`工作正常，
                    // 这里不能用`splice`直接删除，仅设为`null`留下这个空间
                    this.queue[i] = null;

                    // 完全符合条件的处理函数在`add`时会去重，因此这里肯定只有一个
                    return;
                }
            }
        };

        /**
         * 移除全部处理函数，如果队列执行时调用这个函数，会导致剩余的处理函数不再执行
         */
        EventQueue.prototype.clear = function () {
            this.queue.length = 0;
        };

        /**
         * 执行所有处理函数
         *
         * @param {Event} event 事件对象
         * @param {Mixed} thisObject 函数执行时的`this`对象
         */
        EventQueue.prototype.execute = function (event, thisObject) {
            // 如果执行过程中销毁，`dispose`会把`this.queue`弄掉，所以这里留一个引用，
            // 在`dispose`中会额外把数组清空，因此不用担心后续的函数会执行
            var queue = this.queue;
            for (var i = 0; i < queue.length; i++) {
                if (typeof event.isImmediatePropagationStopped === 'function'
                    && event.isImmediatePropagationStopped()
                ) {
                    return;
                }

                var context = queue[i];

                // 移除事件时设置为`null`，因此可能无值
                if (!context) {
                    continue;
                }

                var handler = context.handler;

                // `false`等同于两个方法的调用
                if (handler === false) {
                    if (typeof event.preventDefault === 'function') {
                        event.preventDefault();
                    }
                    if (typeof event.stopPropagation === 'function') {
                        event.stopPropagation();
                    }
                }
                else {
                    // 这里不需要做去重处理了，在`on`的时候会去重，因此这里不可能重复
                    handler.call(context.thisObject || thisObject, event);
                }

                if (context.once) {
                    this.remove(context.handler);
                }
            }
        };

        /**
         * 获取队列的长度
         *
         * @reutrn {number}
         */
        EventQueue.prototype.getLength = function () {
            var count = 0;
            for (var i = 0; i < this.queue.length; i++) {
                if (this.queue[i]) {
                    count++;
                }
            }
            return count;
        };

        /**
         * 获取队列的长度，与{@link EventQueue#getLength}相同
         *
         * @method
         * @reutrn {number}
         */
        EventQueue.prototype.length = EventQueue.prototype.getLength;

        /**
         * 销毁
         *
         * 如果在队列执行的过程中销毁了对象，则在对象销毁后，剩余的处理函数不会再执行了
         */
        EventQueue.prototype.dispose = function () {
            // 在执行过程中被销毁的情况下，这里`length`置为0，循环就走不下去了
            this.clear();
            this.queue = null;
        };

        return EventQueue;
    }
);
