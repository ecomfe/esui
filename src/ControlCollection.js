/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 控件集合，类似`jQuery`对象的功能
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');

        /**
         * 控件集合，类似`jQuery`对象，提供便携的方法来访问和修改一个或多个控件
         *
         * `ControlCollection`提供{@link Control}的所有 **公有** 方法，
         * 但 *没有* 任何 **保护或私有** 方法
         *
         * 对于方法，`ControlCollection`采用 **Write all, Read first** 的策略，
         * 需要注意的是，类似{@link Control#setProperties}的方法虽然有返回值，
         * 但被归类于写操作，因此会对所有内部的控件生效，但只返回第一个控件执行的结果
         *
         * `ControlCollection`仅继承{@link Control}的方法，并不包含任何子类独有方法，
         * 因此无法认为集合是一个{@link InputControl}而执行如下代码：
         *
         *     collection.setValue('foo');
         *
         * 此时可以使用通用的{@link Control#set}方法来代替：
         *
         *     collection.set('value', 'foo');
         *
         * 根据{@link Control#set}方法的规则，如果控件存在`setValue`方法，则会进行调用
         *
         * @constructor
         */
        function ControlCollection() {
            /**
             * @property {number} length
             *
             * 当前控件分组中控件的数量
             *
             * @readonly
             */
            this.length = 0;
        }

        // 为了让Firebug认为这是个数组
        ControlCollection.prototype.splice = Array.prototype.splice;

        /**
         * 向集合中添加控件
         *
         * @param {Control} control 添加的控件
         */
        ControlCollection.prototype.add = function (control) {
            var index = u.indexOf(this, control);
            if (index < 0) {
                [].push.call(this, control);
            }
        };

        /**
         * 从集合中移除控件
         *
         * @param {Control} control 需要移除的控件
         */
        ControlCollection.prototype.remove = function (control) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === control) {
                    //  ie8 splice下有问题，只会改变length,并设置元素索引，但不会删除元素
                    //  var t = {0:'a', 1: 'b', 2:'c', 3:'d', length: 4};
                    //  [].splice.call(t, 3, 1);
                    //  alert(t.length)
                    //  for(var k in t) {
                    //     alert(k+ ':' + t[k])
                    //  }

                    [].splice.call(this, i, 1);
                    return;
                }
            }
        };

        /**
         * 对分组内每个控件调用指定函数
         *
         * @param {Function} iterator 每次循环调用的函数，
         * 函数接受 **当前的控件** 、 **索引** 及 **当前控件集合实例** 为参数
         * @param {Mixed} thisObject 执行`iterator`时的`this`对象，
         * 如果不指定此参数，则`iterator`内的`this`对象为控件实例
         */
        ControlCollection.prototype.each = function (iterator, thisObject) {
            u.each(
                this,
                function (control, i) {
                    iterator.call(thisObject || control, control, i, this);
                }
            );
        };

        /**
         * 对分组内的每个控件调用给定名称的方法
         *
         * 调用此方法必须保证此集合中的 **所有** 控件均有`methodName`指定的方法，
         * 否则将会出现`TypeError("has no method 'methodName'")`异常
         *
         * @param {string} methodName 需要调用的函数的名称
         * @param {Mixed...} args 调用方法时指定的参数
         * @return {Mixed[]} 返回一个数组，依次包含每个控件调用方法的结果
         */
        ControlCollection.prototype.invoke = function (methodName) {
            var args = [this];
            args.push.apply(args, arguments);
            return u.invoke.apply(u, args);
        };

        // 写方法
        u.each(
            [
                'enable', 'disable', 'setDisabled',
                'show', 'hide', 'toggle',
                'addChild', 'removeChild',
                'set', 'setProperties',
                'addState', 'removeState', 'toggleState',
                'on', 'off', 'fire',
                'dispose', 'destroy',
                'setViewContext',
                'render', 'repaint', 'appendTo', 'insertBefore'
            ],
            function (method) {
                ControlCollection.prototype[method] = function () {
                    var args = [method];
                    args.push.apply(args, arguments);
                    var result = this.invoke.apply(this, args);
                    return result && result[0];
                };
            }
        );

        // 读方法
        u.each(
            [
                'isDisabled', 'isHidden', 'hasState',
                'get', 'getCategory', 'getChild', 'getChildSafely'
            ],
            function (method) {
                ControlCollection.prototype[method] = function () {
                    var first = this[0];
                    return first
                        ? first[method].apply(first, arguments)
                        : undefined;
                };
            }
        );

        return ControlCollection;
    }
);
