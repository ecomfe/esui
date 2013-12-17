/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 控件包装类，用于模拟一个不存在的控件
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');

        /**
         * 控件安全包装，模拟一个无任何功能的控件
         *
         * **由于技术限制，此类不继承{@link Control}，不能用`instanceof`判断类型**
         *
         * 在实际使用中，经常会有这样的代码：
         *
         *     var panel = ui.get('panel');
         *     if (panel) {
         *         panel.set('content', someHTML);
         *     }
         *
         * 为了消除这些分支，可以使用本类。本类提供控件所有的基础方法：
         *
         * - 禁用 / 启用：`enable` | `disable` | `setDisabled` | `isDisabled`
         * - 显示 / 隐藏：`show` | `hide` | `toggle` | `isHidden`
         * - 分类：`getCategory`
         * - 取值：`getValue` | getRawValue | `setValue` | `setRawValue`
         * - 子控件：`getChild` | `getChildSafely` | `addChild` | `removeChild`
         * - 设置值：`set` | `get` | `setProperties`
         * - 状态：`addState` | `removeState` | `toggleState` | `hasState`
         * - 事件：`on` | `off` | `fire`
         * - 销毁：`dispose` | `destroy`
         * - 生命周期：`initOptions` | `createMain` | `initStructure`
         * - 视图管理：`setViewContext`
         * - 渲染：`appendTo` | `insertBefore` | `render` | `repaint`
         * - 内部辅助：`isPropertyChanged`
         * - 已废弃：`initChildren` | `disposeChildren`
         *
         * 所有设置、改变值的方法均为空逻辑。获取值的方法根据分类有如下可能：
         *
         * - 获取字符串的方法，返回空字符串`""`
         * - 获取未知类型的方法，返回`null`
         * - 获取对象的方法，返回空对象`{}`
         * - 获取数组的方法，返回空数组`[]`
         * - 获取`boolean`值的方法，返回`false`
         * - {@link SafeWrapper#getCategory}返回`"control"`
         * - {@link SafeWrapper#getChildSafely}返回一个{@link SafeWrapper}对象
         *
         * 通常不应该直接实例化此类，通过以下方法获取此类的实例：
         *
         * - {@link ViewContext#getSafely}
         * - {@link Control#getChildSafely}
         * - {@link main#wrap}
         *
         * @extends Control
         * @constructor
         */
        function SafeWrapper() {
        }

        // 设置值的方法
        u.each(
            [
                'enable', 'disable', 'setDisabled',
                'show', 'hide', 'toggle',
                'setValue', 'setRawValue',
                'addChild', 'removeChild',
                'set',
                'addState', 'removeState', 'toggleState',
                'on', 'off', 'fire',
                'dispose', 'destroy',
                'initOptions', 'createMain', 'initStructure',
                'setViewContext',
                'render', 'repaint', 'appendTo', 'insertBefore',
                'initChildren', 'disposeChildren'
            ],
            function (method) {
                SafeWrapper.prototype[method] = function () {};
            }
        );

        // 获取值方法
        u.each(
            ['isDisabled', 'isHidden', 'hasState', 'isPropertyChanged'],
            function (method) {
                SafeWrapper.prototype[method] = function () {
                    return false;
                };
            }
        );

        u.each(
            ['getRawValue', 'getChild', 'get'],
            function (method) {
                SafeWrapper.prototype[method] = function () {
                    return null;
                };
            }
        );

        u.each(
            ['getValue'],
            function (method) {
                SafeWrapper.prototype[method] = function () {
                    return '';
                };
            }
        );

        u.each(
            ['setProperties'],
            function (method) {
                SafeWrapper.prototype[method] = function () {
                    return {};
                };
            }
        );

        // 特殊的几个
        SafeWrapper.prototype.getCategory = function () {
            return 'control';
        };

        SafeWrapper.prototype.getChildSafely = function (childName) {
            var wrapper = new SafeWrapper();
            
            wrapper.childName = childName;
            wrapper.parent = this;
            if (this.viewContext) {
                wrapper.viewContext = this.viewContext;
            }

            return wrapper;
        };

        return SafeWrapper;
    }
);
