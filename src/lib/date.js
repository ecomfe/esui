/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 日期相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var moment = require('moment');

        /**
         * @class lib.date
         * @singleton
         */
        var date = {};

        /**
         * 默认日期格式，可通过向该属性追回格式来调整{@link lib.date#parse}支持的格式
         *
         * 默认格式有以下几个：
         *
         * - `YYYYMMDDHHmmss`
         * - `YYYY-MM-DD HH:mm:ss`
         * - `YYYY/MM/DD HH:mm:ss`
         * - `YYYY-MM-DDTHH:mm:ss.SSSZ`
         *
         * @cfg
         * @type {string[]}
         * @deprecated 将在4.0版本中移除，应尽量确定格式并使用`moment#parse`代替
         */
        date.dateFormats = [
            'YYYYMMDDHHmmss',
            'YYYY-MM-DD HH:mm:ss',
            'YYYY/MM/DD HH:mm:ss',
            'YYYY-MM-DDTHH:mm:ss.SSSZ' // ISO字符串
        ];

        /**
         * 对目标日期对象进行格式化
         *
         * 具体支持的格式参考
         * [moment文档](http://momentjs.com/docs/#/displaying/format/)
         *
         * @param {Date} source 目标日期对象
         * @param {string} pattern 日期格式化规则
         * @return {string} 格式化后的字符串
         * @deprecated 将在4.0版本中移除，请使用`moment#format`代替
         */
        date.format = function (source, pattern) {
            return moment(source).format(pattern);
        };

        /**
         * 将目标字符串转换成日期对象
         *
         * 具体支持的格式参考
         * [moment文档](http://momentjs.com/docs/#/displaying/format/)
         *
         * 默认使用{@link lib.date#dateFormats}作为解析格式
         *
         * @param {string} source 目标字符串
         * @param {string} [format] 指定解析格式，
         * 不提供此参数则使用{@link lib.date#dateFormats}作为解析格式，
         * 由于默认包含多个格式，这将导致性能有所下降，因此尽量提供明确的格式参数
         * @return {Date} 转换后的日期对象
         * @deprecated 将在4.0版本中移除，请使用`moment#parse`代替
         */
        date.parse = function (source, format) {
            var dateTime = moment(source, format || date.dateFormats);
            return dateTime.toDate();
        };

        return { date: date };
    }
);
