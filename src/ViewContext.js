/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 视图环境类 用于对控件视图的管理
 * @author DBear, errorrik, otakustay
 */
define(
    function (require) {
        var ControlCollection = require('./ControlCollection');

        /**
         * 控件分组
         *
         * 控件分组表达一组控件，类似`getElementsByClass(className)`的效果，
         * 分组同时提供一些方法以方便地操作这个集合
         *
         * 控件分组是内部类，仅可以通过{@link ViewContext#getGroup}方法获取
         *
         * 为了保持私有性，`ControlGroup`去除了{@link ControlCollection#add}和
         * {@link ControlCollection#remove}方法，使用者不能修改集合
         *
         * @param {string} name 分组名称
         * @extends ControlCollection
         * @constructor
         * @private
         */
        function ControlGroup(name) {
            ControlCollection.apply(this, arguments);

            /**
             * @property {string} name
             *
             * 当前控件分组的名称
             *
             * @readonly
             */
            this.name = name;
        }

        require('./lib').inherits(ControlGroup, ControlCollection);

        /**
         * @method
         *
         * `ControlGroup`不提供此方法
         */
        ControlGroup.prototype.add = undefined;

        /**
         * @method
         *
         * `ControlGroup`不提供此方法
         */
        ControlGroup.prototype.remove = undefined;

        /**
         * 销毁当前实例
         */
        ControlGroup.prototype.disposeGroup = function () {
            for (var i = 0; i < this.length; i++) {
                delete this[i];
            }
            this.length = 0;
        };

        function addToGroup(control, group) {
            ControlCollection.prototype.add.call(group, control);
        }

        function removeFromGroup(control, group) {
            ControlCollection.prototype.remove.call(group, control);
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
        
        var SafeWrapper = require('./SafeWrapper');

        /**
         * 根据id获取控件实例，如无相关实例则返回{@link SafeWrapper}
         *
         * @param {string} id 控件id
         * @return {Control} 根据id获取的控件
         */
        ViewContext.prototype.getSafely = function (id) {
            var control = this.get(id);

            if (!control) {
                control = new SafeWrapper();
                control.id = id;
                control.viewContext = this;
            }

            return control;
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
                    this.groups[name].disposeGroup();
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
