/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 单月日历
 * @author dbear
 */

define(
    function (require) {
        require('./Button');
        require('./Select');
        require('./Panel');
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var ui = require('./main');
        var m = require('moment');

        /**
         * 日历控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function MonthView(options) {
            Control.apply(this, arguments);
        }

        /**
         * 获取可选择的年列表
         *
         * @param {MonthView} monthView MonthView控件实例
         * @inner
         * @return {Array}
         */
        function getYearOptions(monthView) {
            var range = monthView.viewRange || monthView.range;
            var ds = [];
            var end = range.end.getFullYear();

            for (var i = range.begin.getFullYear(); i <= end; i++) {
                ds.push({text: i, value: i});
            }

            return ds;
        }

        /**
         * 获取可选择的月列表
         *
         * @param {MonthView} monthView MonthView控件实例
         * @param {number} year 选中的年
         * @inner
         * @return {Array}
         */
        function getMonthOptions(monthView, year) {
            var range = monthView.viewRange || monthView.range;
            var ds = [];
            var len = 11;

            var i = 0;

            if (year === range.begin.getFullYear()) {
                i = range.begin.getMonth();
            }

            if (year === range.end.getFullYear()) {
                len = range.end.getMonth();
            }

            for (; i <= len; i++) {
                ds.push({text: (i + 1), value: i});
            }

            return ds;
        }

        /**
         * 获取日历弹出层的HTML
         *
         * @param {MonthView} monthView MonthView控件实例
         * @inner
         */
        function getMainHTML(monthView) {
            var tpl = [
                '<div class="${headClass}"><table><tr>',
                    '<td width="40" align="left">',
                        '<div class="${monthBackClass}"',
                        ' data-ui-type="Button"',
                        ' data-ui-child-name="monthBack"',
                        ' data-ui-id="${monthBackId}"',
                        '></div>',
                    '</td>',
                    '<td>',
                        '<div class="${yearSelectClass}"',
                        ' data-ui="type:Select;childName:yearSel;',
                        ' id:${yearSelId};"></div>',
                    '</td>',
                    '<td>',
                        '<div class="${monthSelectClass}"',
                        ' data-ui="type:Select;childName:monthSel;',
                        ' id:${monthSelId};"></div>',
                    '</td>',
                    '<td width="40" align="right">',
                        '<div class="${monthForClass}"',
                        ' data-ui-type="Button"',
                        ' data-ui-child-name="monthForward"',
                        ' data-ui-id="${monthForwardId}"',
                        '></div>',
                    '</td>',
                '</tr></table></div>',
                '<div id="${monthMainId}" class="${monthMainClass}"></div>'
            ];
            tpl = tpl.join('');

            return lib.format(
                tpl,
                {
                    headClass: monthView.helper.getPartClassName('head'),
                    monthBackId: monthView.helper.getId('monthBack'),
                    monthForwardId: monthView.helper.getId('monthForward'),
                    yearSelId: monthView.helper.getId('yearSel'),
                    monthSelId: monthView.helper.getId('monthSel'),
                    monthMainId: monthView.helper.getId('monthMain'),
                    monthMainClass: monthView.helper.getPartClassName('month'),
                    monthBackClass:
                        monthView.helper.getPartClassName('month-back'),
                    monthForClass:
                        monthView.helper.getPartClassName('month-forward'),
                    yearSelectClass:
                        monthView.helper.getPartClassName('year-select'),
                    monthSelectClass:
                        monthView.helper.getPartClassName('month-select')
                }
            );
        }

        /**
         * 日历月份显示单元的HTML
         *
         * @param {MonthView} monthView MonthView控件实例
         * @inner
         */
        function getMonthMainHTML(monthView) {

            /** 绘制表头 */
            // 标题显示配置
            var titles = [];
            if (monthView.mode === 'multi') {
                titles.push('');
            }
            titles = titles.concat(['一', '二', '三', '四', '五', '六', '日']);

            // 日期表格头的模板
            var tplHead = ''
                + '<table border="0" cellpadding="0" cellspacing="0" '
                + 'class="${className}"><thead><tr>';

            var html = [];
            html.push(
                lib.format(
                    tplHead,
                    {
                        className:
                            monthView.helper.getPartClassName('month-main')
                    }
                )
            );

            // 日期表格头单元的模板
            var tplHeadItem = ''
                + '<td id="${id}" data-index="${index}" class="${className}">'
                + '${text}</td>';
            var headItemClass =
                monthView.helper.getPartClassName('month-title');
            var headItemId = monthView.helper.getId('month-title');
            var emptyHeadItemClass =
                monthView.helper.getPartClassName('month-select-all');

            var tLen = titles.length;
            for (var tIndex = 0; tIndex < tLen; tIndex++) {
                html.push(
                    lib.format(
                        tplHeadItem,
                        {
                            className: titles[tIndex] === ''
                                ? emptyHeadItemClass : headItemClass,
                            text: titles[tIndex],
                            index: tIndex,
                            id: headItemId + '-' + tIndex
                        }
                    )
                );
            }
            html.push('</tr></thead><tbody><tr>');

            /** 绘制表体 */
            // 日期单元的模板
            var tplItem = ''
                + '<td data-year="${year}" data-month="${month}" '
                + 'data-date="${date}" class="${className}" '
                + 'id="${id}">${date}</td>';

            // 单行全选模板
            var rowSelectClass =
                monthView.helper.getPartClassName('month-row-select');
            var tplRowSelectId = monthView.helper.getId('row-select');
            var rowTagIndex = 0;
            var tplRowSelectTpl = ''
                + '<td id="${id}" class="' + rowSelectClass + '">&gt;</td>';

            var index = 0;
            var year = monthView.year;
            var month = monthView.month;
            var repeater = new Date(year, month, 1);
            var nextMonth = new Date(year, month + 1, 1);
            var begin = 1 - (repeater.getDay() + 6) % 7;
            repeater.setDate(begin);

            var itemClass = monthView.helper.getPartClassName('month-item');

            var todayClass =
                monthView.helper.getPartClassName('month-item-today');

            var virClass =
                monthView.helper.getPartClassName('month-item-virtual');
            var disabledClass =
                monthView.helper.getPartClassName('month-item-disabled');
            var range = monthView.range;

            if (monthView.mode === 'multi') {
                html.push(lib.format(
                    tplRowSelectTpl,
                    {'id': tplRowSelectId + '-' + rowTagIndex++}
                ));
            }
            while (nextMonth - repeater > 0 || index % 7 !== 0) {
                if (begin > 1 && index % 7 === 0) {
                    html.push('</tr><tr>');

                    if (monthView.mode === 'multi') {
                        html.push(lib.format(
                            tplRowSelectTpl,
                            {'id': tplRowSelectId + '-' + rowTagIndex++}
                        ));
                    }
                }

                // 不属于当月的日期
                var virtual = (repeater.getMonth() !== month);

                // 不可选的日期
                var disabled = false;

                //range定义的begin之前的日期不可选
                if (repeater < range.begin) {
                    disabled = true;
                }
                else if (repeater > range.end) {
                    disabled = true;
                }
                // 构建date的css class
                var currentClass = itemClass;
                if (virtual) {
                    currentClass += ' ' + virClass;
                }
                else if (m().isSame(repeater, 'day')) {
                    currentClass += ' ' + todayClass;
                }
                if (disabled) {
                    currentClass += ' ' + disabledClass;
                }

                html.push(
                    lib.format(
                        tplItem,
                        {
                            year: repeater.getFullYear(),
                            month: repeater.getMonth(),
                            date: repeater.getDate(),
                            className: currentClass,
                            id: getItemId(monthView, repeater)
                        }
                    )
                );

                repeater = new Date(year, month, ++begin);
                index++;
            }
            monthView.rowTagNum = rowTagIndex;

            html.push('</tr></tbody></table>');
            return html.join('');
        }

        /**
         * 获取日期对应的dom元素item的id
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Date} date 日期.
         * @return {string}
         */
        function getItemId(monthView, date) {
            return monthView.helper.getId(
                date.getFullYear()
                + '-' + date.getMonth()
                + '-' + date.getDate()
            );
        }


        /**
         * 日历元素点击事件
         *
         * @inner
         * @param {MonthView} this MonthView控件实例
         * @param {Event} 触发事件的事件对象
         */
        function monthViewClick(e) {
            var tar = e.target || e.srcElement;
            var allSelectClasses =
                helper.getPartClasses(this, 'month-select-all');
            var headClasses = helper.getPartClasses(this, 'month-title');
            var itemClasses = helper.getPartClasses(this, 'month-item');
            var rowSelectClasses =
                helper.getPartClasses(this, 'month-row-select');
            var virClasses =
                helper.getPartClasses(this, 'month-item-virtual');
            var disabledClasses =
                helper.getPartClasses(this, 'month-item-disabled');
            while (tar && tar !== document.body) {
                if (lib.hasClass(tar, itemClasses[0])
                    && !lib.hasClass(tar, virClasses[0])
                    && !lib.hasClass(tar, disabledClasses[0])) {
                    selectByItem(this, tar);
                    return;
                }
                // 点击行批量选中
                else if (this.mode === 'multi'){
                    if (lib.hasClass(tar, rowSelectClasses[0])) {
                        selectByTagClick(this, tar);
                        return;
                    }
                    if (lib.hasClass(tar, headClasses[0])) {
                        selectByColumn(this, tar);
                        return;
                    }
                    if (lib.hasClass(tar, allSelectClasses[0])) {
                        selectAll(this);
                        return;
                    }
                }
                tar = tar.parentNode;
            }
        }


        /**
         * 将元数据转换为简单格式
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function parseToCache(monthView) {
            var rawValue = monthView.rawValue;
            monthView.viewValue = {};
            for (var i = 0; i < rawValue.length; i++) {
                var singleDay = rawValue[i];
                var year = singleDay.getFullYear();
                var month = singleDay.getMonth();
                var date = singleDay.getDate();
                var id = year + '-' + month + '-' + date;
                monthView.viewValue[id] = {
                    isSelected: true,
                    value: new Date(year, month, date)
                };
            }

        }

        /**
         * 该元素是否可以选择
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {HTMLElement} dateItem 日期节点
         * @return {number} 1: 可以选择 -1: 虚拟日期 0:
         */
        function isItemSelectable(monthView, dateItem) {
            var virtualClasses =
                helper.getPartClasses(monthView, 'month-item-virtual');
            var disabledClasses =
                helper.getPartClasses(monthView, 'month-item-disabled');
                // 既不是范围外的，又不是虚拟的
                if(!lib.hasClass(dateItem, virtualClasses[0])
                    && !lib.hasClass(dateItem, disabledClasses[0])) {
                    return 1;
                }
                // 虚拟的但不是范围外的
                else if (lib.hasClass(dateItem, virtualClasses[0])
                    && !lib.hasClass(dateItem, disabledClasses[0])) {
                    return -1;
                }
                return 0;
        }

        /**
         * 更新横向批量选择按钮状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {HTMLElement} rowTagItem 横向批量选择按钮
         * @param {boolean} isSelected 置为已选还是未选
         */
        function setRowTagSelected(monthView, rowTagItem, isSelected) {
            helper.removePartClasses(
                monthView, 'month-row-select-selected', rowTagItem
            );
            if (isSelected) {
                helper.addPartClasses(
                    monthView, 'month-row-select-selected', rowTagItem
                );
            }
        }

        /**
         * 批量渲染横向批量选择按钮状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function batchRepaintRowTag(monthView) {
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = helper.getId(monthView, 'row-select');

            for (var i = 0; i < rowTagNum; i++) {
                var rowTag = lib.g(rowTagId + '-' + i);
                // 遍历这一行，如果都选了，则置为选择状态
                repaintRowTag(monthView, rowTag);
            }
        }

        /**
         * 渲染特定横向批量选择按钮状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {HTMLElement} rowTagItem 横向批量选择按钮
         */
        function repaintRowTag(monthView, rowTag) {
            var selectedClasses =
                helper.getPartClasses(monthView, 'month-item-selected');
            var dateItem = rowTag.nextSibling;
            var isAllSelected = true;
            var selectableNum = 0;
            while (dateItem) {
                if (isItemSelectable(monthView, dateItem) === 1) {
                    ++selectableNum;
                    if (!lib.hasClass(dateItem, selectedClasses[0])) {
                        isAllSelected = false;
                        break;
                    }
                }
                dateItem = dateItem.nextSibling;
            }
            if (selectableNum === 0) {
                isAllSelected = false;
            }
            setRowTagSelected(monthView, rowTag, isAllSelected);
        }

        /**
         * 整列选中日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Element} item 行箭头元素.
         */
        function selectByColumn(monthView, columnTag) {
            var index = columnTag.getAttribute('data-index');
            var columnSelectedClasses =
                helper.getPartClasses(monthView, 'month-title-selected');

            var selectAll = true;
            if (lib.hasClass(columnTag, columnSelectedClasses[0])) {
                selectAll = false;
                helper.removePartClasses(
                    monthView, 'month-title-selected', columnTag
                );
            }
            else {
                helper.addPartClasses(
                    monthView, 'month-title-selected', columnTag
                );
            }

            // 可以通过rowTag寻找节点
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = helper.getId(monthView, 'row-select');

            var viewValue = monthView.viewValue;
            var changedDates = [];

            for (var i = 0; i < rowTagNum; i++) {
                var rowTag = lib.g(rowTagId + '-' + i);
                // 找到第index个节点，置为选择状态
                var sibling = rowTag.parentNode.children[index];
                if (isItemSelectable(monthView, sibling) === 1) {
                    var date = sibling.getAttribute('data-date');
                    var month = sibling.getAttribute('data-month');
                    var year = sibling.getAttribute('data-year');
                    var id = year + '-' + month + '-' + date;
                    viewValue[id] = {
                        isSelected: selectAll,
                        value: new Date(year, month, date)
                    };
                    changedDates.push(id);
                }
            }

            if (changedDates && changedDates.length > 0) {
                updateMultiRawValue(monthView);
                updateMultiSelectState(monthView, changedDates, selectAll);
                // 同步横行批量选择状态
                batchRepaintRowTag(monthView);
                repaintAllSelectTag(monthView);
            }
        }

        /**
         * 更新纵向批量选择按钮状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {HTMLElement} columnTagItem 纵向批量选择按钮
         * @param {boolean} isSelected 置为已选还是未选
         */
        function setColumnTagSelected(monthView, columnTagItem, isSelected) {
            helper.removePartClasses(
                monthView, 'month-title-selected', columnTagItem
            );
            if (isSelected) {
                helper.addPartClasses(
                    monthView, 'month-title-selected', columnTagItem
                );
            }
        }

        /**
         * 批量渲染纵向批量选择按钮状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function batchRepaintColumnTag(monthView) {
            var headItemId = helper.getId(monthView, 'month-title');
            for (var i = 1; i <= 7; i++) {
                var columnTag = lib.g(headItemId + '-' + i);
                // 遍历这一行，如果都选了，则置为选择状态
                repaintColumnTag(monthView, columnTag);
            }
        }

        /**
         * 渲染特定纵向批量选择按钮状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {HTMLElement} columnTagItem 纵向批量选择按钮
         */
        function repaintColumnTag(monthView, columnTagItem) {
            var selectedClasses =
                helper.getPartClasses(monthView, 'month-item-selected');
            var index = columnTagItem.getAttribute('data-index');
            var isAllSelected = true;
            var selectableNum = 0;

            // 可以通过rowTag寻找节点
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = helper.getId(monthView, 'row-select');

            for (var i = 0; i < rowTagNum; i++) {
                var rowTag = lib.g(rowTagId + '-' + i);
                // 找到第index个节点，置为选择状态
                var sibling = rowTag.parentNode.children[index];
                if (isItemSelectable(monthView, sibling) === 1) {
                    ++selectableNum;
                    if (!lib.hasClass(sibling, selectedClasses[0])) {
                        isAllSelected = false;
                        break;
                    }
                }
            }

            if (selectableNum === 0) {
                isAllSelected = false;
            }

            setColumnTagSelected(monthView, columnTagItem, isAllSelected);
        }

        /**
         * 整行选中日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Element} rowTag 行箭头元素.
         */
        function selectByTagClick(monthView, rowTag) {
            var row = rowTag.parentNode;
            var rowSelectClasses =
                helper.getPartClasses(monthView, 'month-row-select');
            var rowSelectedClasses =
                helper.getPartClasses(monthView, 'month-row-select-selected');
            var virtualClasses =
                helper.getPartClasses(monthView, 'month-item-virtual');
            var disabledClasses =
                helper.getPartClasses(monthView, 'month-item-disabled');

            var selectAll = true;
            if (lib.hasClass(rowTag, rowSelectedClasses[0])) {
                selectAll = false;
                helper.removePartClasses(
                    monthView, 'month-row-select-selected', rowTag
                );
            }
            else {
                helper.addPartClasses(
                    monthView, 'month-row-select-selected', rowTag
                );
            }

            var children = row.children;
            var viewValue = monthView.viewValue;
            var changedDates = [];

            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.nodeType === 1
                    && !lib.hasClass(child, rowSelectClasses[0])
                    && !lib.hasClass(child, virtualClasses[0])
                    && !lib.hasClass(child, disabledClasses[0])) {
                    var date = child.getAttribute('data-date');
                    var month = child.getAttribute('data-month');
                    var year = child.getAttribute('data-year');
                    var id = year + '-' + month + '-' + date;
                    viewValue[id] = {
                        isSelected: selectAll,
                        value: new Date(year, month, date)
                    };
                    changedDates.push(id);
                }
            }

            if (changedDates && changedDates.length > 0) {
                updateMultiRawValue(monthView);
                updateMultiSelectState(monthView, changedDates, selectAll);
                batchRepaintColumnTag(monthView);
                repaintAllSelectTag(monthView);
            }
        }

        /**
         * 更新全选状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function repaintAllSelectTag(monthView) {
            // 获取横向选择状态
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = helper.getId(monthView, 'row-select');
            var selectAllTag = lib.g(helper.getId(monthView, 'month-title-0'));
            var rowSelectedClasses =
                helper.getPartClasses(monthView, 'month-row-select-selected');
            var selectedRowNum = 0;
            for (var i = 0; i < rowTagNum; i++) {
                var rowTag = lib.g(rowTagId + '-' + i);
                if (lib.hasClass(rowTag, rowSelectedClasses[0])) {
                    selectedRowNum ++;
                }
            }

            if (selectedRowNum === rowTagNum) {
                helper.addPartClasses(
                    monthView, 'month-select-all-selected', selectAllTag);
            }
            else {
                helper.removePartClasses(
                    monthView, 'month-select-all-selected', selectAllTag);
            }
        }


        /**
         * 选择全部
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function selectAll(monthView) {
            // 获取横向选择状态
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = helper.getId(monthView, 'row-select');
            for (var i = 0; i < rowTagNum; i++) {
                var rowTag = lib.g(rowTagId + '-' + i);
                // 先移除所有的选择
                helper.removePartClasses(
                    monthView, 'month-row-select-selected', rowTag
                );
                selectByTagClick(monthView, rowTag);
            }
        }

        /**
         * 选择当前日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Array} dates 日期集合，每个元素的格式：YYYY-MM-DD
         * @param {boolean} selectAll 批量选中还是批量不选.
         */
        function updateMultiRawValue(monthView) {
            // 重排cache
            var selectedDates = [];
            for (var key in monthView.viewValue) {
                if (monthView.viewValue[key].isSelected) {
                    selectedDates.push(monthView.viewValue[key].value);
                }
            }
            selectedDates.sort(function(a, b) { return a - b; });
            monthView.rawValue = selectedDates;
            monthView.fire('change');
        }

        function updateMultiSelectState(monthView, dates, selectAll) {
            if (selectAll) {
                paintMultiSelected(monthView, dates);
            }
            else {
                resetMultiSelected(monthView, dates);
            }
        }

        /**
         * 批量清空多选日历未选中的日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Array} dates 日期集合.
         */
        function resetMultiSelected(monthView, dates) {
            var me = monthView;
            for (var i = 0; i < dates.length; i++) {
                var id = helper.getId(monthView, dates[i]);
                var item = lib.g(id);
                if (item) {
                    lib.removeClasses(
                        item,
                        helper.getPartClasses(me, 'month-item-selected')
                    );
                }
            }
        }

        /**
         * 批量绘制多选日历选中的日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Array} dates 日期集合.
         */
        function paintMultiSelected(monthView, dates) {
            var me = monthView;
            for (var i = 0; i < dates.length; i++) {
                var id = helper.getId(monthView, dates[i]);
                var item = lib.g(id);
                if (item) {
                    lib.addClasses(
                        item,
                        helper.getPartClasses(me, 'month-item-selected')
                    );
                }
            }
        }

        /**
         * 切换节点状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {HTMLElement} item 目标元素
         * @param {string} className 切换的class
         * @return {boolean} 切换后状态 true为选中，false为未选中
         */
        function switchState(monthView, item, className) {
            if (!item) {
                return false;
            }
            var classes = helper.getPartClasses(monthView, className);
            if (lib.hasClass(item, classes[0])) {
                helper.removePartClasses(monthView, className, item);
                return false;
            }
            else {
                helper.addPartClasses(monthView, className, item);
                return true;
            }
        }

        /**
         * 通过点击日期单元dom元素选择日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Element} item dom元素td.
         */
        function selectByItem(monthView, item) {
            var date = item.getAttribute('data-date');
            var month = item.getAttribute('data-month');
            var year = item.getAttribute('data-year');
            var id = year + '-' + month + '-' + date;
            if (monthView.mode === 'multi') {
                // 切换状态
                var state = switchState(monthView, item, 'month-item-selected');

                // 更新cache数据
                monthView.viewValue[id] = {
                    isSelected: state,
                    value: new Date(year, month, date)
                };
                updateMultiRawValue(monthView);
                // 找到这行的rowTag
                var rowTag = item.parentNode.firstChild;
                repaintRowTag(monthView, rowTag);
                batchRepaintColumnTag(monthView);
                repaintAllSelectTag(monthView);
            }
            else {
                var itemSelectClasses =
                    helper.getPartClasses(monthView, 'month-item-selected');
                if (lib.hasClass(item, itemSelectClasses[0])) {
                    return;
                }
                var newDate = new Date(year, month, date);
                updateSingleSelectState(monthView, monthView.rawValue, newDate);
                monthView.rawValue = newDate;
                monthView.fire('change');
                monthView.fire('itemclick');

            }
        }


        /**
         * 根据range修正year month
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {number} year 年.
         * @param {number} month 月.
         * @return {Object}
         */
        function reviseYearMonth(monthView, year, month) {
            var me = monthView;
            // 允许设置的范围
            var range = me.viewRange || me.range;
            var rangeBegin = range.begin.getFullYear() * 12
                + range.begin.getMonth();
            var rangeEnd = range.end.getFullYear() * 12 + range.end.getMonth();
            // 欲设置的年月
            var viewMonth = year * 12 + month;
            var view = new Date(year, month, 1);
            month = view.getMonth();

            // 设置早了，补足
            if (rangeBegin - viewMonth > 0) {
                month += (rangeBegin - viewMonth);
            }
            // 设置晚了，减余
            else if (viewMonth - rangeEnd > 0) {
                month -= (viewMonth - rangeEnd);
            }

            // 重新设置
            view.setMonth(month);
            month = view.getMonth();
            year = view.getFullYear();

            return {
                year: year,
                month: month
            };

        }

        /**
         * 绘制浮动层内的日历部件
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {number} year 年.
         * @param {number} month 月.
         */
        function repaintMonthView(monthView, year, month) {
            // 如果没有指定，则显示rawValue对应月份日期
            if (year == null) {
                year = monthView.year;
            }

            if (month == null) {
                month = monthView.month;
            }

            var me = monthView;
            var revisedYearMonth = reviseYearMonth(me, year, month);
            me.month = revisedYearMonth.month;
            me.year = revisedYearMonth.year;

            var yearSelect = me.getChild('yearSel');
            var lastYear = yearSelect.getValue();

            // 通过year选择框来触发其它部分的重渲染
            yearSelect.setProperties({
                datasource: getYearOptions(me),
                value: me.year
            });


            // 如果year选择的数据没改变，
            // 但可能还是需要重回日历，
            // 因此要手动触发year的change
            if (lastYear === me.year) {
                yearSelect.fire('change');
            }

        }

        /**
         * 更新单选模式日历选择状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Date} oldValue 旧日期.
         * @param {Date} newValue 新日期.
         * @param {Date} 真实有效的新日期
         */
        function updateSingleSelectState(monthView, oldDate, newDate) {
            if (oldDate !== newDate) {
                if (oldDate) {
                    var lastSelectedItem = lib.g(getItemId(monthView, oldDate));
                    if (lastSelectedItem) {
                        switchState(
                            monthView, lastSelectedItem, 'month-item-selected'
                        );
                    }
                }
                var curSelectedItem = lib.g(getItemId(monthView, newDate));
                if (curSelectedItem) {
                    if (isItemSelectable(monthView, curSelectedItem)) {
                        switchState(
                            monthView, curSelectedItem, 'month-item-selected'
                        );
                    }
                    else {
                        monthView.rawValue = null;
                        return null;
                    }
                }
            }
            return newDate;
        }

        /**
         * “下一个月”按钮点击的handler
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function goToNextMonth(monthView) {
            var nowDate = new Date(monthView.year, monthView.month, 1);
            var newDate = m(nowDate).add('month', 1);
            repaintMonthView(monthView, newDate.year(), newDate.month());
        }

        /**
         * 获取“上一个月”按钮点击的handler
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function goToPrevMonth(monthView) {
            var nowDate = new Date(monthView.year, monthView.month, 1);
            var newDate = m(nowDate).subtract('month', 1);
            repaintMonthView(monthView, newDate.year(), newDate.month());
        }

        /**
         * 年份切换
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Select} yearSel Select控件实例
         */
        function changeYear(monthView, yearSel) {
            var year = parseInt(yearSel.getValue(), 10);
            monthView.year = year;

            var month = monthView.month;

            var revisedYearMonth = reviseYearMonth(monthView, year, month);
            month = revisedYearMonth.month;
            monthView.month = month;

            // 年份改变导致月份重绘
            var monthSelect = monthView.getChild('monthSel');
            var changes = monthSelect.setProperties({
                datasource: getMonthOptions(monthView, monthView.year),
                value: monthView.month
            });

            // 如果month选择的数据没改变，则要手动触发变化
            if (!changes.hasOwnProperty('rawValue')) {
                changeMonth(monthView, monthSelect);
            }
            monthView.fire('changeyear');
        }

        /**
         * 月份切换
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Select} monthSel Select控件实例
         */
        function changeMonth(monthView, monthSel) {
            var month = parseInt(monthSel.getValue(), 10);
            monthView.month = month;
            updateMain(monthView);
            monthView.fire('changemonth');
        }

        /**
         * 更新日历主体
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Select} monthSel Select控件实例
         */
        function updateMain(monthView) {
            //填充日历主体
            var monthMainId = helper.getId(monthView, 'monthMain');
            var monthMain = lib.g(monthMainId);
            monthMain.innerHTML = getMonthMainHTML(monthView);
            // 找到最后一行，增加一个class
            var rowElements = monthMain.getElementsByTagName('tr');
            var lastRow = rowElements[rowElements.length - 1];
            helper.addPartClasses(monthView, 'last-row', lastRow);
            // 更新选择状态
            updateSelectStateByValue(monthView);
        }

        /**
         * range适配器，将string型range适配为Object
         *
         * @inner
         * @param {Object | string} range
         */
         function rangeAdapter(range) {
            var begin;
            var end;
            // range类型如果是string
            if (typeof range === 'string') {
                var beginAndEnd = range.split(',');
                begin = parseToDate(beginAndEnd[0]);
                end = parseToDate(beginAndEnd[1]);
            }
            else {
                begin = range.begin;
                end = range.end;
            }

            if (begin > end) {
                return {
                    begin: end,
                    end: begin
                };
            }

            return {
                begin: begin,
                end: end
            };
        }

        /**
         * 字符串日期转换为Date对象
         *
         * @inner
         * @param {string} dateStr 字符串日期
         */
        function parseToDate(dateStr) {
            /** 2011-11-04 */
            function parse(source) {
                var dates = source.split('-');
                if (dates) {
                    return new Date(
                        parseInt(dates[0], 10),
                        parseInt(dates[1], 10) - 1,
                        parseInt(dates[2], 10)
                    );
                }
                return null;
            }

            dateStr = dateStr + '';
            var dateAndHour =  dateStr.split(' ');
            var date = parse(dateAndHour[0]);
            if (dateAndHour[1]) {
                var clock = dateAndHour[1].split(':');
                date.setHours(clock[0]);
                date.setMinutes(clock[1]);
                date.setSeconds(clock[2]);
            }
            return date;
        }

        /**
         * 根据不同模式将字符串值解析为rawValue
         *
         * @inner
         * @param {string} value 字符串日期
         * @param {string} mode 日历模式 multi | single
         * @return {Date | Array}
         */
        function parseValueByMode(value, mode) {
            if (mode === 'single') {
                return parseToDate(value);
            }
            else {
                var dateStrs = value.split(',');
                var dates = [];
                for (var i = 0; i < dateStrs.length - 1; i += 2) {
                    var begin = parseToDate(dateStrs[i]);
                    var end = parseToDate(dateStrs[i + 1]);
                    var temp;
                    if (!begin || !end) {
                        continue;
                    }
                    if (begin - end === 0) {
                        dates.push(begin);
                    } else {
                        temp = begin;
                        while (temp <= end) {
                            dates.push(temp);
                            temp = new Date(
                                temp.getFullYear(),
                                temp.getMonth(),
                                temp.getDate() + 1
                            );
                        }
                    }
                }
                return dates;
            }
        }

        function updateSelectStateByValue(monthView) {
            // 单选模式
            if (monthView.mode !== 'multi') {
                updateSingleSelectState(monthView, null, monthView.rawValue);
                return;
            }

            // 多选模式
            var viewValue = monthView.viewValue;
            for (var key in viewValue) {
                var item = lib.g(helper.getId(monthView, key));
                if (item) {
                    // 有可能这个item是不可选的
                    var isSelectable = isItemSelectable(monthView, item);
                    if (isSelectable === 1) {
                        if (viewValue[key].isSelected) {
                            helper.addPartClasses(
                                monthView, 'month-item-selected', item
                            );
                        }
                        else {
                            helper.removePartClasses(
                                monthView, 'month-item-selected', item
                            );
                        }
                    }
                    // 应该修正了rawValue和viewValue
                    else if (isSelectable === 0) {
                        // 有可能是virtual的，这种不应该更新数据
                        viewValue[key].isSelected = false;
                        updateMultiRawValue(monthView);
                    }
                }
            }
            batchRepaintRowTag(monthView);
            batchRepaintColumnTag(monthView);
            repaintAllSelectTag(monthView);
        }


        /**
         * 给select的layer人肉增加class命名空间
         *
         * @inner
         * @param {Event} e layer渲染事件
         */
        function addCustomClassesForSelectLayer(monthView, selectClass, e) {
            var layerClasses = monthView.helper.getPartClasses(selectClass + '-layer');
            var layer = e.layer;
            layer.addCustomClasses(layerClasses);
            monthView.fire('selectlayerrendered', { layer: layer });
        }

        MonthView.prototype = {
            /**
             * 控件类型
             *
             * @type {string}
             */
            type: 'MonthView',

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                /**
                 * 默认选项配置
                 */
                var properties = {
                    range: {
                        begin: new Date(1982, 10, 4),
                        end: new Date(2046, 10, 4)
                    },
                    dateFormat: 'YYYY-MM-DD',
                    paramFormat: 'YYYY-MM-DD',
                    viewValue: {},
                    mode: 'single'
                };
                lib.extend(properties, options);
                this.setProperties(properties);
            },

            setProperties: function (properties) {
                if (properties.range) {
                    properties.range = rangeAdapter(properties.range);
                }

                // 如果么设置rawValue
                var now = new Date();
                var mode = properties.mode || this.mode;
                if (properties.rawValue == null) {
                    // 从value转
                    if (properties.value) {
                        properties.rawValue =
                            parseValueByMode(properties.value, mode);
                    }
                    // 都没设
                    else {
                        // 来自初始设置
                        if (this.rawValue == null) {
                            // 单模式下rawValue默认当天
                            if (mode === 'single') {
                                properties.rawValue = now;
                            }
                            // 多选模式下rawValue默认空数组
                            else {
                                properties.rawValue = [];
                            }
                        }
                    }
                }

                // 初始化显示年月
                var year = properties.year;
                var month = properties.month;

                // 都没设置
                if ((!year && month == null)) {
                    // 单选模式下，year和month取rawValue的年月
                    if (mode === 'single') {
                        if (properties.rawValue) {
                            year = properties.rawValue.getFullYear();
                            month = properties.rawValue.getMonth() + 1;
                        }
                    }
                    // 多选模式下，year和month取当天的年月
                    else {
                        year = now.getFullYear();
                        month = now.getMonth() + 1;
                    }
                }

                if (year && month) {
                    properties.year = parseInt(year, 10);
                    // 开放给外部的month，为了符合正常思维，计数从1开始
                    // 但是保存时要按照Date的规则从0开始
                    properties.month = parseInt(month, 10) - 1;
                }
                else if (properties.hasOwnProperty('year')) {
                    // 如果此时month还没初始化，为了不混淆，year的设置也是无效的
                    if (this.month == null) {
                        delete properties.year;
                    }
                }
                else if (properties.hasOwnProperty('month')) {
                    // 如果此时year还没初始化，为了不混淆，month的设置也是无效的
                    if (this.year == null) {
                        delete properties.month;
                    }
                    else {
                        properties.month = parseInt(month, 10) - 1;
                    }
                }
                var changes =
                    Control.prototype.setProperties.apply(this, arguments);

                if (changes.hasOwnProperty('rawValue')) {
                    this.fire('change');
                }
                return changes;
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             */
            initStructure: function () {
                this.main.innerHTML = getMainHTML(this);

                // 创建控件树
                this.initChildren(this.main);

                if (this.mode === 'multi') {
                    this.addState('multi-select');
                }
            },

            /**
             * 初始化事件交互
             *
             * @protected
             * @override
             */
            initEvents: function () {
                // 向后按钮
                var monthBack = this.getChild('monthBack');
                monthBack.on(
                    'click',
                    lib.curry(goToPrevMonth, this)
                );

                // 向前按钮
                var monthForward = this.getChild('monthForward');
                monthForward.on(
                    'click',
                    lib.curry(goToNextMonth, this)
                );

                // 月份选择
                var monthSel = this.getChild('monthSel');
                monthSel.on(
                    'change',
                    lib.curry(changeMonth, this, monthSel)
                );

                // 给layer人肉增加class命名空间
                monthSel.on(
                    'layerrendered',
                    lib.curry(addCustomClassesForSelectLayer, this, 'month-select')
                );

                // 年份选择
                var yearSel = this.getChild('yearSel');
                yearSel.on(
                    'change',
                    lib.curry(changeYear, this, yearSel)
                );

                yearSel.on(
                    'layerrendered',
                    lib.curry(addCustomClassesForSelectLayer, this, 'year-select')
                );

                // 为日期绑定点击事件
                var monthMain = this.helper.getPart('monthMain');
                helper.addDOMEvent(this, monthMain, 'click', monthViewClick);
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: helper.createRepaint(
                Control.prototype.repaint,
                {
                    name: ['range', 'rawValue', 'year', 'month'],
                    paint: function (monthView, range, rawValue, year, month) {
                        // 如果只是改变了rawValue，year和month也会跟随更改
                        // 只对单选模式日历有效
                        if (rawValue) {
                            if (monthView.mode === 'multi') {
                                parseToCache(monthView);
                            }
                        }
                        repaintMonthView(
                            monthView,
                            monthView.year,
                            monthView.month
                        );

                    }
                },
                {
                    name: 'disabled',
                    paint: function (monthView, disabled) {
                        // 向后按钮
                        var monthBack = monthView.getChild('monthBack');
                        monthBack.setProperties({disabled: disabled});
                        // 向前按钮
                        var monthForward = monthView.getChild('monthForward');
                        monthForward.setProperties({disabled: disabled});

                        // 月份选择
                        var monthSel = monthView.getChild('monthSel');
                        monthSel.setProperties({disabled: disabled});
                        // 月份选择
                        var yearSel = monthView.getChild('yearSel');
                        yearSel.setProperties({disabled: disabled});
                    }
                }
            ),


            /**
             * 设置控件状态为禁用
             */
            disable: function () {
                this.setProperties({
                    disabled: true
                });
                this.addState('disabled');
            },

            /**
             * 设置控件状态为启用
             */
            enable: function () {
                this.setProperties({
                    disabled: false
                });
                this.removeState('disabled');
            },

            /**
             * 设置可选中的日期区间
             *
             * @param {Object} range 可选中的日期区间
             */
            setRange: function (range) {
                this.setProperties({ 'range': range });
            },


            /**
             * 设置日期
             *
             * @param {Date|Array} date 选取的日期.
             */
            setRawValue: function (date) {
                this.setProperties({ 'rawValue': date });
            },

            /**
             * 获取选取日期值
             *
             * @return {Date|Array}
             */
            getRawValue: function () {
                return this.rawValue;
            },

            getValue: function () {
                return this.stringifyValue(this.rawValue);
            },

            /**
             * 将value从原始格式转换成string
             *
             * @param {*} rawValue 原始值
             * @return {string}
             */
            stringifyValue: function (rawValue) {
                if (this.mode === 'single') {
                    return lib.date.format(rawValue, this.paramFormat) || '';
                }
                else {
                    var dateStrs = [];
                    var oneDay = 86400000;
                    for (var i = 0; i < rawValue.length; i ++) {
                        if (i === 0) {
                            dateStrs.push(
                                lib.date.format(rawValue[i], this.paramFormat)
                            );
                        }
                        else {
                            if ((rawValue[i] - rawValue[i-1]) > oneDay) {
                                dateStrs.push(
                                    lib.date.format(
                                        rawValue[i-1], this.paramFormat
                                    )
                                );
                                dateStrs.push(
                                    lib.date.format(
                                        rawValue[i], this.paramFormat
                                    )
                                );
                            }
                            else if (i === (rawValue.length - 1)) {
                                dateStrs.push(
                                    lib.date.format(
                                        rawValue[i], this.paramFormat
                                    )
                                );
                            }
                            else {
                                continue;
                            }
                        }
                    }
                    return dateStrs.join(',');
                }
            },

            parseValue: function (value) {
                return parseValueByMode(value, this.mode);
            },

            setRawValueWithoutFireChange: function (value) {
                this.rawValue = value;
                parseToCache(this);
            },

            getDateItemHTML: function (date) {
                return lib.g(getItemId(this, date));
            }

        };

        lib.inherits(MonthView, Control);
        ui.register(MonthView);

        return MonthView;
    }
);
