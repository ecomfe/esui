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
        var esui = require('../main');
        var Table = require('../Table');
        var $ = require('jquery');
        var eoo = require('eoo');

        /**
         * 表格子行扩展
         *
         * @constructor
         */
        var TableSubrow = eoo.create(
            Extension,
            {
                /**
                 * 指定扩展类型，始终为`"TableEdit"`
                 *
                 * @type {string}
                 */
                type: 'TableSubrow',

                /**
                 * 激活扩展
                 *
                 * @override
                 */
                activate: function () {
                    var target = this.target;
                    // 只对`Table`控件生效
                    if (!(target instanceof Table)) {
                        return;
                    }

                    var subentryClass = target.helper.getPartClassName('subentry');

                    target.addRowBuilders([
                        {
                            index: 0,
                            getRowArgs: getSubrowArgs,
                            getColHtml: getSubEntryHtml,
                            getSubrowHtml: getSubrowHtml
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
                    target.getSubrow = function (index) {
                        return getSubrow(this, index);
                    };

                    /**
                     * 设置子行内容
                     *
                     * @public
                     *
                     * @param {string} content 内容
                     * @param {number} index 行序号
                     *
                     */
                    target.setSubrowContent = function (content, index) {
                        var subrowPanel = getSubrowContainer(this, index);

                        if (subrowPanel) {
                            subrowPanel.set('content', content);
                        }
                    };

                    /**
                     * 获取子行Panel
                     *
                     * @public
                     *
                     * @param {number} index 行序号
                     *
                     * @return {Object}
                     */
                    target.getSubrowContainer = function (index) {
                        return getSubrowContainer(this, index);
                    };

                    /**
                     * 打开子行
                     *
                     * @public
                     * @param {number} index 子行的序号
                     */
                    target.openSubrow = function (index) {
                        var entry = lib.g(getSubentryId(this, index));
                        openSubrow(this, index, entry);
                    };

                    /**
                     * 关闭子行
                     *
                     * @public
                     * @param {number} index 子行的序号
                     */
                    target.closeSubrow = function (index) {
                        var entry = lib.g(getSubentryId(this, index));
                        closeSubrow(this, index, entry);
                    };

                    this.$super(arguments);
                },

                /**
                 * 取消扩展的激活状态
                 *
                 * @override
                 */
                inactivate: function () {
                    var target = this.target;
                    // 只对`Table`控件生效
                    if (!(target instanceof Table)) {
                        return;
                    }

                    delete target.getSubrow;

                    this.$super(arguments);
                }
            }
        );

        /**
         * 获取元素Id
         *
         * @private
         * @param {Object} table Table示例
         * @param {string} name name
         * @return {string} id
         */
        function getId(table, name) {
            return table.helper.getId(name);
        }

        /**
         * 获取dom子部件的css class
         *
         * @private
         * @param {Object} table Table示例
         * @param {string} name name
         *
         * @return {string}
         */
        function getClass(table, name) {
            return table.helper.getPartClassName(name);
        }

        /**
         * 设置元素属性 自动加上data-前缀
         *
         * @private
         * @param {Object} element dom元素
         * @param {string} key key
         * @param {string} value value
         *
         */
        function setAttr(element, key, value) {
            $(element).attr('data-' + key, value);
        }

        /**
         * 判断值是否为空
         *
         * @private
         * @param {Object} obj obj
         * @return {bool}
         */
        function hasValue(obj) {
            return !(typeof obj === 'undefined' || obj === null);
        }

        /**
         * 获取表格子行的元素id
         *
         * @private
         * @param {Object} table Table示例
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
         * @param {Object} table Table示例
         * @param {number} index 行序号
         * @return {string}
         */
        function getSubentryId(table, index) {
            return getId(table, 'subentry') + index;
        }

        /**
         * subrow行绘制每行基本参数
         *
         * @param {Object} table Table示例
         * @param {number} rowIndex 行序号
         * @return {Object} 获取到的参数
         * @private
         */
        function getSubrowArgs(table, rowIndex) {
            return {
                subrow: table.subrow && table.subrow !== 'false'
            };
        }

        /**
         * 处理子行入口元素鼠标移入的行为x
         *
         * @private
         * @param {Object} element dom元素
         * @param {Object} e 事件对象
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
            table.helper.addPartClasses(classBase, element);
        }

        /**
         * 处理子行入口元素鼠标移出的行为x
         *
         * @private
         * @param {Object} element dom元素
         * @param {Object} e 事件对象
         */
        function entryOutHandler(element, e) {
            entryOut(this, element);
        }

        function entryOut(table, element) {
            table.helper.removePartClasses(table, 'subentry-hover', element);
            table.helper.removePartClasses(table, 'subentry-opened-hover', element);
        }

        /**
         * 触发subrow的打开|关闭
         *
         * @private
         * @param {Object} el 事件元素
         * @param {Object} e 事件对象
         */
        function fireSubrow(el, e) {
            var table = this;
            var $el = $(el);
            var index = $el.data('index');
            var datasource = table.datasource;
            var dataLen = (datasource instanceof Array && datasource.length);

            if (!dataLen || index >= dataLen) {
                return;
            }

            if ($el.attr('data-subrowopened') !== '1') {
                var dataItem = datasource[index];
                var eventArgs = {
                    index: index,
                    item: dataItem
                };
                var event = table.fire('subrowopen', eventArgs);
                if (!event.isDefaultPrevented()) {
                    openSubrow(table, index, el);
                }
            }
            else {
                closeSubrow(table, index, el);
            }

            entryOver(table, el);
        }

        /**
         * 关闭子行
         *
         * @private
         * @param {Object} table Table示例
         * @param {number} index 子行的序号
         * @param {Object} entry dom元素
         * @return {bool}
         */
        function closeSubrow(table, index, entry) {
            var eventArgs = {
                index: index,
                item: table.datasource[index]
            };

            eventArgs = table.fire('subrowclose', eventArgs);

            if (!eventArgs.isDefaultPrevented()) {
                entryOut(table, entry);
                if (table.subrowMutex) {
                    table.subrowIndex = null;
                }

                table.helper.removePartClasses(
                    'subentry-opened',
                    entry
                );
                table.helper.removePartClasses(
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
         * @param {Object} table Table示例
         * @param {number} index 子行的序号
         * @param {Object} entry dom元素
         */
        function openSubrow(table, index, entry) {
            var currentIndex = table.subrowIndex;
            var closeSuccess = 1;

            if (table.subrowMutex && hasValue(currentIndex)) {
                closeSuccess = closeSubrow(
                    table,
                    currentIndex,
                    lib.g(getSubentryId(table, currentIndex))
                );
            }

            if (table.subrowMutex && !closeSuccess) {
                return;
            }

            table.helper.addPartClasses('subentry-opened', entry);
            table.helper.addPartClasses('row-unfolded', table.getRow(index));

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

        /**
         * subrowPanel的html模板
         *
         * @private
         *
         */
        var tplSubPanel = '<div '
                        + 'data-ui="type:Panel;id:${id}" '
                        + 'data-index="${index}">'
                        + '</div>';

        /**
         * 生成子行点击打开区域的Html
         *
         * @private
         * @param {Object} table Table示例
         * @param {Object} data 某行某列对应的数据
         * @param {Object} field 列配置
         * @param {number} rowIndex 行序号
         * @param {number} fieldIndex 列序号
         * @param {Object} extraArgs 额外参数
         *
         * @return {Object}
         */
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

            var iconClass = table.helper.getIconClass();
            if (subentry) {
                var isSubEntryShown = typeof field.isSubEntryShow === 'function'
                    ? field.isSubEntryShow.call(
                        table, data, rowIndex, fieldIndex)
                    : true;
                if (isSubEntryShown !== false) {
                    result.html = lib.format(
                        tplSubEntry,
                        {
                            className:
                                getClass(table, 'subentry')
                                + ' '
                                + iconClass,
                            id: getSubentryId(table, rowIndex),
                            title: table.subEntryOpenTip,
                            index: rowIndex
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
         * @param {Control} table table
         * @param {number} index index
         * @param {Object} extraArgs extraArgs
         * @return {string}
         */
        function getSubrowHtml(table, index, extraArgs) {
            var dataLen = table.datasource ? table.datasource.length : 0;
            return extraArgs.subrow
                    ? '<div id="' + getSubrowId(table, index)
                    +  '" class="' + getClass(table, 'subrow') + ' '
                    +  (dataLen === index + 1 ? getClass(table, 'subrow-last') : '') + '"'
                    +  ' style="display:none"></div>'
                    : '';
        }

        /**
         * 获取子行的容器
         *
         * @private
         * @param {Object} table Table示例
         * @param {number} index 行序号
         * @return {Object}
         */
        function getSubrow(table, index) {
            return lib.g(getSubrowId(table, index));
        }

        /**
         * 获取子行的Panel
         *
         * @private
         *
         * @param {Object} table Table示例
         * @param {number} index 行序号
         *
         * @return {Object}
         */
        function getSubrowContainer(table, index) {
            var subrowWrapper = getSubrow(table, index);
            var subrowPanelId = getId(table, 'subrow-panel-' + index);
            var subrowPanel = table.bodyPanel.getChild(subrowPanelId);

            if (!subrowPanel) {
                subrowWrapper.innerHTML = lib.format(
                    tplSubPanel,
                    {
                        id: subrowPanelId,
                        index: index
                    }
                );

                table.initChildren(subrowWrapper);
                subrowPanel = table.viewContext.get(subrowPanelId);
                table.bodyPanel.addChild(subrowPanel, subrowPanelId);
            }

            return subrowPanel;
        }

        esui.registerExtension(TableSubrow);
        return TableSubrow;
    }
);
