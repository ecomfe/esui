/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 语言基础库
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');

        /**
         * @override lib
         */
        var lib = {};

        var counter = 0x861005;
        /**
         * 获取唯一id
         * 
         * @param {string} [prefix="esui"] 前缀
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
         * @return {Function} 返回`subClass`构造器
         */
        lib.inherits = function (subClass, superClass) {
            var Empty = function () {};
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
         * 对一个对象进行深度复制
         *
         * @param {Object} source 需要进行复制的对象
         * @return {Object} 复制出来的新对象
         * @deprecated 将在4.0版本中移除，使用{@link lib#deepClone}方法代替
         */
        lib.clone = function (source) {
            if (!source || typeof source !== 'object') {
                return source;
            }

            var result = source;
            if (u.isArray(source)) {
                result = u.clone(source);
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
                        result[key] = lib.deepClone(source[key]);
                    }
                }
            }

            return result;
        };

        /**
         * 对一个对象进行深度复制
         *
         * @param {Object} source 需要进行复制的对象
         * @return {Object} 复制出来的新对象
         */
        lib.deepClone = lib.clone;

        /**
         * 将数组转换为字典
         *
         * @param {Array} array 数组
         * @return {Object} 以`array`中的每个对象为键，以`true`为值的字典对象
         */
        lib.toDictionary = function (array) {
            var dictionary = {};
            u.each(
                array,
                function (value) {
                    dictionary[value] = true;
                }
            );

            return dictionary;
        };

        /**
         * 判断一个对象是否为数组
         *
         * @param {Mixed} source 需要判断的对象
         * @return {boolean}
         * @deprecated 将在4.0版本中移除，使用`underscore.isArray`代替
         */
        lib.isArray = u.isArray;

        /**
         * 将对象转为数组
         *
         * @param {Mixed} source 需要转换的对象
         * @return {Array}
         * @deprecated 将在4.0版本中移除，使用`underscore.toArray`代替
         */
        lib.toArray = u.toArray;

        /**
         * 扩展对象
         *
         * @param {Object} source 需要判断的对象
         * @param {Object...} extensions 用于扩展`source`的各个对象
         * @return {Object} 完成扩展的`source`对象
         * @deprecated 将在4.0版本中移除，使用`underscore.extend`代替
         */
        lib.extend = u.extend;

        /**
         * 固定函数的`this`对象及参数
         *
         * @param {Function} fn 需要处理的函数
         * @param {Object} thisObject 执行`fn`时的`this`对象
         * @param {Mixed...} args 执行`fn`时追回在前面的参数
         * @return {Function}
         * @deprecated 将在4.0版本中移除，使用`underscore.bind`代替
         */
        lib.bind = u.bind;

        /**
         * 为函数添加参数
         *
         * 该函数类似于{@link lib#bind}，但不固定`this`对象
         *
         * @param {Function} fn 需要处理的函数
         * @param {Mixed...} args 执行`fn`时追回在前面的参数
         * @return {Function}
         * @deprecated 将在4.0版本中移除，使用`underscore.partial`代替
         */
        lib.curry = u.partial;

        /**
         * 在数组或类数组对象中查找指定对象的索引
         *
         * @param {Array | Object} array 用于查找的数组或类数组对象
         * @param {Mixed} value 需要查找的对象
         * @param {number} [fromIndex] 开始查找的索引
         * @return {number}
         * @deprecated 将在4.0版本中移除，使用`underscore.indexOf`代替
         */
        lib.indexOf = u.indexOf;

        /**
         * 对字符串进行HTML解码
         *
         * @param {string} source 需要解码的字符串
         * @return {string}
         * @deprecated 将在4.0版本中移除，使用`underscore.unescape`代替
         */
        lib.decodeHTML = u.unescape;

        /**
         * 对字符串进行HTML编码
         *
         * @param {string} source 需要编码的字符串
         * @return {string}
         * @deprecated 将在4.0版本中移除，使用`underscore.escape`代替
         */
        lib.encodeHTML = u.escape;

        return lib;
    }
);
