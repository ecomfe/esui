/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 表格行内编辑扩展
 * @author wurongyao, otakustay
 */
define( 
    function (require) {
        var Extension = require('../Extension');
        var lib = require('../lib');
        var helper = require('../controlHelper');
        var main = require('../main');
        var Table = require('../Table');
        
        /**
         * 元素属性 自动加上data-前缀
         * 
         * @protected
         */
        function getId(table, name) {
            return helper.getId(table, name);
        }

        /**
         * 获取dom子部件的css class
         * 
         * @protected
         * @return {string}
         */
        function getClass(table, name) {
            return helper.getPartClasses(table, name).join(' ');
        }

        /**
         * 获取dom带有data-前缀的属性值
         * 
         * @private
         * @return {string}
         */
        function getAttr(element, key){
            return lib.getAttribute(element, 'data-' + key);
        }

        /**
         * 设置元素属性 自动加上data-前缀
         * 
         * @private
         */
        function setAttr(element, key, value){
            lib.setAttribute(element, 'data-' + key, value);
        }

        /**
         * 判断值是否为空
         * 
         * @private
         * @return {bool}
         */
        function hasValue(obj) {
            return !(typeof obj === 'undefined' || obj === null);
        }

        /**
         * 获取表格子行的元素id
         *
         * @private
         * @param {number} index 行序号
         * @return {string}
         */
        function getSubrowId(table, index) {
            return getId(table, 'subrow') + index;
        }

        /**
         * 获取表格子行入口元素的id
         *
         * @private
         * @param {number} index 行序号
         * @return {string}
         */
        function getSubentryId(table, index) {
            return getId(table, 'subentry') + index;
        }

        /**
         * subrow行绘制每行基本参数
         *
         * @private
         */
        function getSubrowArgs(table, rowIndex){
            return {
                subrow : table.subrow && table.subrow != 'false'
            };
        }


        /**
         * 处理子行入口元素鼠标移入的行为
         *
         * @private
         * @param {number} index 入口元素的序号
         */
        function entryOverHandler(element, e) {
            entryOver(this, element);
        }

        function entryOver(table, element) {
            var opened = /subentry-opened/.test(element.className);
            var classBase = 'subentry-hover';
                
            if (opened) {
                classBase = 'subentry-opened-hover';
            }
            helper.addPartClasses(table, classBase, element);
        }

        /**
         * 处理子行入口元素鼠标移出的行为
         *
         * @private
         * @param {number} index 入口元素的序号
         */
        function entryOutHandler(element, e) {
            entryOut(this, element);
        }
        
        function entryOut(table, element) {
            helper.removePartClasses(table, 'subentry-hover', element);
            helper.removePartClasses(table, 'subentry-opened-hover', element);
        }

        /**
         * 触发subrow的打开|关闭
         *
         * @private
         * @param {object} el 事件元素
         * @param {object} e 事件对象
         */
        function fireSubrow(el, e) {
            var table = this;
            var index = getAttr(el, 'index');
            var datasource = table.datasource;
            var dataLen = (datasource instanceof Array && datasource.length);
            
            if (!dataLen || index >= dataLen) {
                return;
            }
            
            if (!getAttr(el, 'subrowopened')) {
                var dataItem = datasource[index];
                var eventArgs = {
                    index:index, 
                    item: dataItem
                };
                eventArgs = table.fire('subrowopen', eventArgs);
                if (!eventArgs.isDefaultPrevented()) {
                    openSubrow(table, index, el);
                }
            } else {
                closeSubrow(table, index, el);
            }

            entryOver(table, el);
        }
        
        /**
         * 关闭子行
         *
         * @private
         * @param {number} index 子行的序号
         */
        function closeSubrow(table, index, entry) {
            var eventArgs = { 
                index: index, 
                item: table.datasource[index]
            };

            eventArgs = table.fire('subrowclose', eventArgs);

            if (!eventArgs.isDefaultPrevented()) {
                entryOut(table, entry);
                table.subrowIndex = null;
                
                helper.removePartClasses(
                    table, 
                    'subentry-opened', 
                    entry
                );
                helper.removePartClasses(
                    table, 
                    'row-unfolded', 
                    table.getRow(index)
                );
                
                setAttr(entry, 'title', table.subEntryOpenTip);
                setAttr(entry, 'subrowopened', '');
                
                lib.g(getSubrowId(table, index)).style.display = 'none';

                return true;
            }

            return false;
        }
        
        /**
         * 打开子行
         *
         * @private
         * @param {number} index 子行的序号
         */
        function openSubrow(table, index, entry) {
            var currentIndex = table.subrowIndex;
            var closeSuccess = 1;
            
            if (hasValue(currentIndex)) {
                closeSuccess = closeSubrow(
                    table, 
                    currentIndex, 
                    lib.g(getSubentryId(table, currentIndex))
                );
            }
            
            if (!closeSuccess) {
                return;
            }

            helper.addPartClasses(table, 'subentry-opened', entry);
            helper.addPartClasses(table, 'row-unfolded', table.getRow(index));

            setAttr(entry, 'title', table.subEntryCloseTip);
            setAttr(entry, 'subrowopened', '1');
            
            lib.g(getSubrowId(table, index)).style.display = '';
            
            (table.subrowMutex) && (table.subrowIndex = index);
        }

        /**
         * subrow入口的html模板
         *
         * @private
         */
        var tplSubEntry = '<div '
                        +  'class="${className}" '
                        + 'id="${id}" '
                        + 'title="${title}" '
                        + 'data-index="${index}">'
                        + '</div>';

        function getSubEntryHtml(
            table, data, field, rowIndex, fieldIndex, extraArgs
        ) {
            var subrow = extraArgs.subrow;
            var subentry = subrow && field.subEntry;
            var result = {
                notInText: true,
                width: table.subEntryWidth,
                align: 'right'
            };

            if (subentry) {
                var isSubEntryShown = typeof field.isSubEntryShow === 'function'
                    ? field.isSubEntryShow.call(
                        table, data, rowIndex, fieldIndex)
                    : true;
                if (isSubEntryShown !== false) {
                    result.html = lib.format(
                        tplSubEntry,
                        {
                            className : getClass(table, 'subentry'),
                            id :  getSubentryId(table, rowIndex),
                            title :  table.subEntryOpenTip,
                            index : rowIndex
                        }
                   );
                }

                result.colClass = getClass(table, 'subentryfield');
            }

            return result;
        }

        /**
         * 获取子内容区域的html
         *
         * @private
         * @return {string}
         */
        function getSubrowHtml(table, index, extraArgs) {
            return extraArgs.subrow
                    ? '<div id="' + getSubrowId(table, index)
                    +  '" class="' + getClass(table, 'subrow') + '"'
                    +  ' style="display:none"></div>'
                    : '';
        }


        /**
         * 表格子行扩展
         *
         * @constructor
         */
        function TableSubrow() {
            Extension.apply(this, arguments);
        }

        /**
         * 指定扩展类型，始终为`"TableEdit"`
         *
         * @type {string}
         */
        TableSubrow.prototype.type = 'TableSubrow';

        /**
         * 激活扩展
         *
         * @override
         */
        TableSubrow.prototype.activate = function () {
            var target = this.target;
            // 只对`Table`控件生效
            if (!(target instanceof Table)) {
                return;
            }

            var getPartClasses = helper.getPartClasses;
            var subentryClass = getPartClasses(target, 'subentry')[0];

            target.addRowBuilders([
                {
                    index: 0,
                    getRowArgs: getSubrowArgs,
                    getColHtml: getSubEntryHtml,
                    getSubrowHtml : getSubrowHtml
                }
            ]);

            target.addHandlers(
                'click',
                {
                    handler: fireSubrow,
                    matchFn: subentryClass
                }
            );

            target.addHandlers(
                'mouseover',
                {
                    handler: entryOverHandler, 
                    matchFn: subentryClass
                }
            );

            target.addHandlers(
                'mouseout', 
                {
                    handler: entryOutHandler, 
                    matchFn: subentryClass
                }
            );

            
            /**
             * 获取表格子行的元素
             *
             * @public
             * @param {number} index 行序号
             * @return {HTMLElement}
             */
            target.getSubrow = function(index) {
                return lib.g(getSubrowId(this, index));    
            };


            Extension.prototype.activate.apply(this, arguments);
        };

        /**
         * 取消扩展的激活状态
         *
         * @override
         */
        TableSubrow.prototype.inactivate = function () {
            var target = this.target;
            // 只对`Table`控件生效
            if (!(target instanceof Table)) {
                return;
            }

            delete target.getSubrow;

            Extension.prototype.inactivate.apply(this, arguments);
        };

        lib.inherits(TableSubrow, Extension);
        main.registerExtension(TableSubrow);
        
        return TableSubrow;
    }
);
