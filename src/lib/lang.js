/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 语言基础库
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = {};

        var counter = 0x861005;
        /**
         * 获取唯一id
         * 
         * @inner
         * @param {string} prefix 前缀
         * @return {string}
         */
        lib.getGUID = function (prefix) {
            prefix = prefix || 'esui';
            return prefix + counter++;
        };

        /**
         * 为类型构造器建立继承关系
         *
         * @param {Function} subClass 子类构造器
         * @param {Function} superClass 父类构造器
         */
        lib.inherits = function (subClass, superClass) {
            // by Tangram 1.x: baidu.lang.inherits
            var Empty = function () {
            };
            Empty.prototype = superClass.prototype;
            var selfPrototype = subClass.prototype;
            var proto = subClass.prototype = new Empty();

            for (var key in selfPrototype) {
                proto[key] = selfPrototype[key];
            }
            subClass.prototype.constructor = subClass;
            subClass.superClass = superClass.prototype;

            return subClass;
        };

        /**
         * 对一个 object 进行深度复制
         *
         * @param {Object} source 需要进行复制的对象
         *
         * @return {Object} 复制出来的新对象
         */
        lib.clone = function (source) {
            if (!source || typeof source !== 'object') {
                return source;
            }

            var result = source;
            if (lib.isArray(source)) {
                result = [];
                for (var i = 0; i < source.length; i++) {
                    result.push(source[i]);
                }
            }
            else if (({}).toString.call(source) === '[object Object]'
                // IE下，DOM和BOM对象上一个语句为true，
                // isPrototypeOf挂在`Object.prototype`上的，
                // 因此所有的字面量都应该会有这个属性
                // 对于在`window`上挂了`isPrototypeOf`属性的情况，直接忽略不考虑
                && ('isPrototypeOf' in source)
            ) {
                result = {};
                for (var key in source) {
                    if (source.hasOwnProperty(key)) {
                        result[key] = lib.clone(source[key]);
                    }
                }
            }

            return result;
        };

        lib.isArray = u.isArray;

        lib.toArray = u.toArray;

        lib.extend = u.extend;

        lib.bind = u.bind;

        lib.curry = u.partial;

        lib.indexOf = u.indexOf;

        lib.decodeHTML = u.unescape;

        lib.encodeHTML = u.escape;

        return lib;
    }
);