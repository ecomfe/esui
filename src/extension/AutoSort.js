/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 表格自动排序扩展
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var Table = require('../Table');
        var Extension = require('../Extension');

        /**
         * 表格自动排序扩展
         *
         * 当表格加上此扩展后，其排序功能将由扩展自动提供
         *
         * 扩展默认使用简单的两值相减（字符串用`localeCompare`）的方法判断大小，
         * 也可以在表格具体列的配置中给出`comparer`属性来提供自定义的排序算法
         *
         * @class extension.AutoSort
         * @extends Extension
         * @constructor
         */
        function AutoSort() {
            Extension.apply(this, arguments);
        }

        /**
         * 指定扩展类型，始终为`"AutoSort"`
         *
         * @type {string}
         */
        AutoSort.prototype.type = 'AutoSort';

        function sort(e) {
            var computeDiff = e.field.comparer;
            if (!computeDiff) {
                var fieldName = e.field.field;
                computeDiff = function (x, y) {
                    if (fieldName) {
                        x = x[fieldName];
                        y = y[fieldName];
                    }

                    return u.isString(x) && u.isString(y)
                        ? x.localeCompare(y)
                        : x - y;
                };
            }

            function compare(x, y) {
                var diff = computeDiff(x, y);
                return e.order === 'asc' ? diff : -diff;
            }

            var datasource = this.datasource;
            datasource.sort(compare);
            this.setDatasource(datasource);
        }

        /**
         * 激活扩展
         *
         * @override
         */
        AutoSort.prototype.activate = function () {
            // 只对`Table`控件生效
            if (!(this.target instanceof Table)) {
                return;
            }

            this.target.on('sort', sort);

            Extension.prototype.activate.apply(this, arguments);
        };

        /**
         * 取消扩展的激活状态
         *
         * @override
         */
        AutoSort.prototype.inactivate = function () {
            // 只对`Table`控件生效
            if (!(this.target instanceof Table)) {
                return;
            }

            this.target.un('sort', sort);

            Extension.prototype.inactivate.apply(this, arguments);
        };

        require('../lib').inherits(AutoSort, Extension);
        require('../main').registerExtension(AutoSort);
        return AutoSort;
    }
);
