/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 字符串相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        /**
         * @override lib
         */
        var lib = {};

        var WHITESPACE = /^[\s\xa0\u3000]+|[\u3000\xa0\s]+$/g;

        /**
         * 删除目标字符串两端的空白字符
         *
         * @param {string} source 目标字符串
         * @return {string} 删除两端空白字符后的字符串
         */
        lib.trim = function (source) {
            if (!source) {
                return '';
            }

            return String(source).replace(WHITESPACE, '');
        };

        function format(template, data, prefix) {
            if (!template) {
                return '';
            }

            if (data == null) {
                return template;
            }

            if (u.isUndefined(prefix)) {
                prefix = '\\$';
            }

            return template.replace(
                new RegExp(prefix + '\\{(.+?)\\}', 'g'),
                function (match, key) {
                    var replacer = data[key];
                    if (typeof replacer === 'function') {
                        replacer = replacer(key);
                    }

                    return replacer == null ? '' : replacer;
                }
            );
        }

        var langFormatter = function (template, data) {
            return format(template, data, '');
        };

        /**
         * 设置国际化格式函数，默认中文实现仅替换变量
         * 英文等其他语言存在单复数替换需求，需外部提供实现
         *
         * @param {Function} formatter 外部格式化实现
         */
        lib.setLangFormatter = function (formatter) {
            if (u.isFunction(formatter)) {
                langFormatter = formatter;
            }
        };

        /**
         * 字符串格式化
         *
         * 简单的格式化使用`${name}`进行占位
         *
         * @param {string} template 原字符串
         * @param {Object} data 用于模板替换的数据
         * @return {string} 格式化后的字符串
         */
        lib.format = function (template, data) {
            return format.apply(null, arguments);
        };

        /**
         * i18n国际化 + 格式化
         * 包括变量替换以及单复数处理等，具体实现可由外部替换
         *
         * @param {string} template 原字符串
         * @param {Object} data 用于模板替换的数据
         * @return {string} 格式化后的字符串
         */
        lib.langFormat = function (template, data) {
            return langFormatter(template, data, '');
        };

        /**
         * 将字符串转换成`camelCase`格式
         *
         * 该方法将横线`-`视为单词的 **唯一分隔符**
         *
         * @param {string} source 源字符串
         * @return {string}
         */
        lib.camelize = function (source) {
            if (!source) {
                return '';
            }

            return source.replace(
                /-([a-z])/g,
                function (match, alpha) {
                    return alpha.toUpperCase();
                }
            );
        };

        /**
         * 将字符串转换成`PascalCase`格式
         *
         * 该方法将横线`-`视为单词的 **唯一分隔符**
         *
         * @param {string} source 源字符串
         * @return {string}
         */
        lib.pascalize = function (source) {
            if (!source) {
                return '';
            }

            return source.charAt(0).toUpperCase()
                + lib.camelize(source.slice(1));
        };

        /**
         * 将Token列表字符串切分为数组
         *
         * Token列表是使用逗号或空格分隔的字符串
         *
         * @param {string | string[] | null | undefined} input 输入值
         * @return {string[]}
         */
        lib.splitTokenList = function (input) {
            if (!input) {
                return [];
            }

            if (u.isArray(input)) {
                return;
            }

            return u.chain(input.split(/[,\s]/))
                .map(lib.trim)
                .compact()
                .value();
        };

        return lib;
    }
);
