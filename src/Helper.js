/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 控件类常用的方法辅助类
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');

        /**
         * 控件辅助类
         *
         * @constructor
         * @param {Control} control 关联的控件实例
         */
        function Helper(control) {
            this.control = control;
        }

        u.extend(
            Helper.prototype,
            require('./helper/children'),
            require('./helper/dom'),
            require('./helper/event'),
            require('./helper/html'),
            require('./helper/life'),
            require('./helper/template')
        );

        return Helper;
    }
);
