/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 表格行点击扩展
 * @author dddbear
 */
define(
    function (require) {
        var Extension = require('../Extension');
        var lib = require('../lib');
        var main = require('../main');
        var Table = require('../Table');
        var u = require('underscore');

        /**
         * 校验元素是否是非法元素
         * 如果是控件、带有扩展功能的元素、本身可点击的元素，都是非法元素
         *
         * @param {HTMLElement} node 要校验的元素
         * @return {boolean} 是否非法
         */
        function checkNodeInvalid(node) {
            var uiPrefix = main.getConfig('uiPrefix');
            var commandPrefix = 'data-command';
            var attributes = node.attributes;
            var tagName = node.tagName.toLowerCase();
            var clickableTags = ['a', 'button', 'select', 'input'];

            if (u.indexOf(clickableTags, tagName) !== -1) {
                return true;
            }

            return u.any(
                attributes,
                function (attribute) {
                    var name = attribute.name;
                    return name.indexOf(uiPrefix) !== -1 || name.indexOf(commandPrefix) !== -1;
                }
            );
        }

        /**
         * 表格行鼠标点击的事件handler
         *
         * @param {HTMLElement} element row元素
         * @param {miniEvent.event} e 事件对象
         */
        function rowClickHandler(element, e) {
            var rowClassName = this.helper.getPartClasses('row')[0];
            var target = e.target;
            var index = lib.getAttribute(element, 'data-index');
            while (target.nodeType === 1 && !lib.hasClass(target, rowClassName)) {
                // 遇到不合法元素即返回
                if (checkNodeInvalid(target)) {
                    return;
                }
                target = target.parentNode;
            }

            this.fire('rowclick', {rowIndex: index});
        }


        /**
         * 表格行点击扩展
         *
         * 启用该扩展后：
         * 除了控件、启用扩展的元素以外，点击表格行的任意区域，都会触发'rowclick'事件
         *
         * @class extension.TableRowClick
         * @extends Extension
         * @constructor
         */
        function TableRowClick() {
            Extension.apply(this, arguments);
        }

        /**
         * 指定扩展类型，始终为`"TableRowClick"`
         *
         * @type {string}
         */
        TableRowClick.prototype.type = 'TableRowClick';

        /**
         * 激活扩展
         *
         * @override
         */
        TableRowClick.prototype.activate = function () {
            var target = this.target;
            // 只对`Table`控件生效
            if (!(target instanceof Table)) {
                return;
            }

            target.addHandlers(
                'click',
                {
                    handler: rowClickHandler,
                    matchFn: target.helper.getPartClasses('row')[0]
                }
            );

            Extension.prototype.activate.apply(this, arguments);
        };

        /**
         * 取消扩展的激活状态
         *
         * @override
         */
        TableRowClick.prototype.inactivate = function () {
            var target = this.target;
            // 只对`Table`控件生效
            if (!(target instanceof Table)) {
                return;
            }

            target.removeHandlers(
                'click',
                {
                    handler: rowClickHandler,
                    matchFn: target.helper.getPartClasses('row')[0]
                }
            );

            Extension.prototype.inactivate.apply(this, arguments);
        };

        lib.inherits(TableRowClick, Extension);
        main.registerExtension(TableRowClick);

        return TableRowClick;
    }
);