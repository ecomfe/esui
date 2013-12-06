/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 视图环境类 用于对控件视图的管理
 * @author DBear, errorrik, otakustay
 */
define(
    function () {
        /**
         * 控件分组
         *
         * 控件分组表达一组控件，类似`getElementsByClass(className)`的效果，
         * 分组同时提供一些方法以方便地操作这个集合
         *
         * 控件分组是内部类，仅可以通过{@link ViewContext#getGroup}方法获取
         *
         * @constructor
         * @param {string} name 分组名称
         * @private
         */
        function ControlGroup(name) {
            /**
             * @property {number} length
             *
             * 当前控件分组中控件的数量
             *
             * @readonly
             */
            this.length = 0;

            /**
             * @property {string} name
             *
             * 当前控件分组的名称
             *
             * @readonly
             */
            this.name = name;
        }

        // 为了让Firebug认为这是个数组
        ControlGroup.prototype.splice = Array.prototype.splice;

        /**
         * 对分组内每个控件调用指定函数
         *
         * 需要注意的是，`ControlGroup`是 **live** 的，也就是说当进行循环时，
         * 如果此过程中有将一个控件销毁、移出{@link ViewContext}等行为，
         * 此控件会从当前的`ControlGroup`中消失，
         * 导致{@link ControlGroup#length}属性变化，
         * 因此在循环中如果对控件有相关操作，需要特别注意状态的同步问题
         *
         * @param {Function} iterator 每次循环调用的函数，函数的`this`为控件对象
         */
        ControlGroup.prototype.each = function (iterator) {
            for (var i = 0; i < this.length; i++) {
                var control = this[i];
                iterator.call(control);
            }
        };

        /**
         * 激活分组内所有控件
         */
        ControlGroup.prototype.enable = function () {
            this.each(function () { this.enable(); });
        };

        /**
         * 禁用分组内所有控件
         */
        ControlGroup.prototype.disable = function () {
            this.each(function () { this.disable(); });
        };

        /**
         * 显示分组内所有控件
         */
        ControlGroup.prototype.show = function () {
            this.each(function () { this.show(); });
        };

        /**
         * 隐藏分组内所有控件
         */
        ControlGroup.prototype.hide = function () {
            this.each(function () { this.hide(); });
        };

        /**
         * 销毁当前实例
         */
        ControlGroup.prototype.dispose = function () {
            for (var i = 0; i < this.length; i++) {
                delete this[i];
            }
            this.length = 0;
        };

        function addToGroup(control, group) {
            group[group.length] = control;
            group.length++;
        }

        function removeFromGroup(control, group) {
            for (var i = 0; i < group.length; i++) {
                if (group[i] === control) {
                    group.splice(i, 1);
                    return;
                }
            }
        }

        function getGroupNames(control) {
            var group = control.get('group');
            return group ? group.split(/[\t\r\n ]/) : [];
        }

        var counter = 0x830903;

        /**
         * 获取唯一id
         * 
         * @return {string}
         */
        function getGUID() {
            return 'vt' + counter++;
        }

        /**
         * 视图环境对象池
         * 
         * @type {Object}
         * @private
         */
        var pool = {};

        /**
         * 视图环境类
         *
         * 一个视图环境是一组控件的集合，不同视图环境中相同id的控件的DOM id不会重复
         *
         * @constructor
         * @param {string} id 该`ViewContext`的id
         */
        function ViewContext(id) {
            /**
             * 视图环境控件集合
             * 
             * @type {Object}
             * @private
             */
            this.controls = {};

            /**
             * 视图环境控件分组集合
             *
             * @type {Object}
             * @private
             */
            this.groups = {};

            id = id || getGUID();
            // 如果已经有同名的，就自增长一下
            if (pool.hasOwnProperty(id)) {
                var i = 1;
                var prefix = id + '-';
                while (pool.hasOwnProperty(prefix + i)) {
                    i++;
                }
                id = prefix + i;
            }

            /**
             * 视图环境id
             * 
             * @type {string} 
             * @readonly
             */
            this.id = id;

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

            var groups = getGroupNames(control);
            for (var i = 0; i < groups.length; i++) {
                var groupName = groups[i];

                if (!groupName) {
                    continue;
                }

                var group = this.getGroup(groupName);
                addToGroup(control, group);
            }

            control.setViewContext(this);

        };

        /**
         * 将控件实例从视图环境中移除。
         *
         * @param {Control} control 待移除控件
         */
        ViewContext.prototype.remove = function (control) {
            delete this.controls[control.id];

            var groups = getGroupNames(control);
            for (var i = 0; i < groups.length; i++) {
                var groupName = groups[i];

                if (!groupName) {
                    continue;
                }

                var group = this.getGroup(groupName);
                removeFromGroup(control, group);
            }

            control.setViewContext(null);

        };

        /**
         * 通过id获取控件实例。 
         *
         * @param {string} id 控件id
         * @return {Control} 根据id获取的控件
         */
        ViewContext.prototype.get = function (id) {
            return this.controls[id];
        };

        /**
         * 获取一个控件分组
         *
         * @param {string} name 分组名称
         * @return {ControlGroup}
         */
        ViewContext.prototype.getGroup = function (name) {
            if (!name) {
                throw new Error('name is unspecified');
            }

            var group = this.groups[name];
            if (!group) {
                group = this.groups[name] = new ControlGroup(name);
            }
            return group;
        };

        /**
         * 清除视图环境中所有控件
         */
        ViewContext.prototype.clean = function () {
            for (var id in this.controls) {
                if (this.controls.hasOwnProperty(id)) {
                    var control = this.controls[id];
                    control.dispose();
                    // 如果控件销毁后“不幸”`viewContext`还在，就移除掉
                    if (control.viewContext && control.viewContext === this) {
                        this.remove(control);
                    }
                }
            }

            for (var name in this.groups) {
                if (this.groups.hasOwnProperty(name)) {
                    this.groups[name].dispose();
                    this.groups[name] = undefined;
                }
            }
        };

        /**
         * 销毁视图环境 
         */
        ViewContext.prototype.dispose = function () {
            this.clean();
            delete pool[this.id];
        };

        return ViewContext;
    }
);
