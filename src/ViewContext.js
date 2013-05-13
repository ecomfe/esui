/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 视图环境类 用于对控件视图的管理
 * @author DBear, errorrik
 */
 
define(
    function () {
        var counter = 0x830903;

        /**
         * 获取唯一id
         * 
         * @inner
         * @return {string}
         */
        function getGUID() {
            return 'vt' + counter++;
        }

        /**
         * 视图环境对象池
         * 
         * @inner
         * @type {Object}
         */
        var pool = {};

        /**
         * ViewContext类声明
         *
         * @constructor
         */
        function ViewContext() {
            /**
             * 视图环境控件集合
             * 
             * @type {Object} 
             */
            this.controls = {};

            /**
             * 视图环境id
             * 
             * @type {string} 
             */
            this.id = getGUID();

            // 入池
            pool[this.id] = this;
        }

        /**
         * 根据id获取视图环境
         *
         * @param {string} id 视图环境id
         * @static
         */
        ViewContext.get = function ( id ) {
            return pool[id] || null;
        };

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
            delete this.controls[control.id];
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
         * @public
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

        /**
         * 销毁视图环境 
         *
         * @public
         */
        ViewContext.prototype.dispose = function () {
            this.clean();
            delete pool[this.id];
        };

        return ViewContext;
    }
);