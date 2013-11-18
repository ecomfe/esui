/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 字符串相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var lib = {};

        var WHITESPACE = /^[\s\xa0\u3000]+|[\u3000\xa0\s]+$/g;

        /**
         * 删除目标字符串两端的空白字符
         *
         * @param {string} source 目标字符串
         *
         * @return {string} 删除两端空白字符后的字符串
         */
        lib.trim = function (source) {
            if (!source) {
                return '';
            }

            return String(source).replace(WHITESPACE, '');
        };

        /**
         * 字符串格式化
         *
         * @param {string} template 原字符串
         * @param {Object.<string, *>} data 参数
         *
         * @return {string} 格式化后的字符串
         */
        lib.format = function (template, data) {
            if (!template) {
                return '';
            }

            if (data == null) {
                return template;
            }

            return template.replace(
                /\$\{(.+?)\}/g,
                function (match, key) {
                    var replacer = data[key];
                    if (typeof replacer === 'function') {
                        replacer = replacer(key);
                    }

                    return replacer == null ? '' : replacer;
                }
            );
        };

        /**
         * 将字符串转换成 camel 格式
         *
         * @param {string} source 源字符串
         *
         * @return {string}
         */
        lib.camelize = function (source) {
            if (!source) {
                return '';
            }

            return source.replace(
                /-([a-z])/g,
                function (alpha) {
                    return alpha.toUpperCase();
                }
            );
        };

        /**
         * 将字符串转换成 pascal 格式
         *
         * @param {string} source 源字符串
         *
         * @return {string}
         */
        lib.pascalize = function (source) {
            if (!source) {
                return '';
            }

            return source.charAt(0).toUpperCase()
                + lib.camelize(source.slice(1));
        };

        return lib;
    }
);