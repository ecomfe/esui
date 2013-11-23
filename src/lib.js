/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file UI基础库适配层
 * @author otakustay, firede(firede@firede.us), erik
 */
define(
    function (require) {
        /**
         * 工具对象
         *
         * @class
         * @singleton
         */
        var lib = {};
        var u = require('underscore');

        if (/msie (\d+\.\d+)/i.test(navigator.userAgent)) {
            /**
             * IE浏览器版本号
             *
             * @type {number}
             * @deprecated 不要使用浏览器版本号检测特性
             */
            lib.ie = document.documentMode || +RegExp.$1;
        }

        u.extend(
            lib,
            require('./lib/attribute'),
            require('./lib/class'),
            require('./lib/date'),
            require('./lib/dom'),
            require('./lib/event'),
            require('./lib/lang'),
            require('./lib/page'),
            require('./lib/string')
        );

        return lib;
    }
);