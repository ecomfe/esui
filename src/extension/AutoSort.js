/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 表格自动排序扩展
 * @author otakustay
 */

define(
    function (require) {
        var Table = require('../Table');
        var Extension = require('../Extension');

        /**
         * 表格自动排序扩展
         *
         * @constructor
         * @extends Extension
         */
        function AutoSort() {
            Extension.apply(this, arguments);
        }

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

                    return typeof x === 'string' && typeof y === 'string'
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
         * @public
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
         * @public
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