/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 视图环境类 用于对控件视图的管理
 * @author DBear
 */
define(
    function () {
        /**
         * ViewContext类声明
         *
         * @constructor
         */
        function ViewContext() {
            /**
             * 视图环境控件集合
             * @type {Object} 
             */
            this.controls = {};
        }


        /**
         * 将控件实例添加到视图环境中
         *
         * @param {Control} control 待加控件
         * @public
         */
        ViewContext.prototype.add = function (control) {
            var exists = this.controls[control.id];

            // id已存在
            if (exists) {
                // 是同一控件，不做处理
                if (exists === control) {
                    return;
                }

                // 不是同一控件，先覆盖原关联控件的viewContext
                exists.setViewContext(null);
            }

            this.controls[control.id] = control;
            control.setViewContext(this);

        };

        /**
         * 将控件实例从视图环境中移除。
         *
         * @param {Control} control 待移除控件
         * @public
         */
        ViewContext.prototype.remove = function (control) {

            this.controls[control.id] = null;
            control.setViewContext(null);

        };

        /**
         * 通过id获取控件实例。 
         *
         * @param {string} id 控件id
         * @return {Control} 根据id获取的控件
         * @public
         */
        ViewContext.prototype.get = function (id) {

            return this.controls[id];

        };

        /**
         * 清除视图环境中所有控件。 
         *
         */
        ViewContext.prototype.clean = function () {
            for (var id in this.controls) {
                if (this.controls.hasOwnProperty(id)) {
                    var control = this.controls[id];
                    this.remove(control);
                    control.dispose();
                }
            }
        };

        return ViewContext;

    }
);