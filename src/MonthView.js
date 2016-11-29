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
        var $ = require('jquery');
        var lib = require('./lib');
        var Control = require('./Control');
        var esui = require('./main');
        var m = require('moment');
        var eoo = require('eoo');
        var painters = require('./painters');
        var u = require('underscore');

        /**
         * 日历控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        var MonthView = eoo.create(
            Control,
            {
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
                        viewValue: {},
                        mode: 'single',
                        dateItemRender: null
                    };
                    u.extend(properties, MonthView.defaultProperties, options);
                    this.setProperties(properties);
                },

                /**
                 * 设置属性
                 *
                 * @param {Object} properties 属性集合
                 * @override
                 * @protected
                 */
                setProperties: function (properties) {
                    var format = properties.paramFormat || this.paramFormat;
                    if (properties.range) {
                        properties.range = rangeAdapter(
                            properties.range,
                            format
                        );
                    }

                    // 如果么设置rawValue
                    var now = new Date();
                    var mode = properties.mode || this.mode;
                    if (properties.rawValue == null) {
                        // 从value转
                        if (properties.value) {
                            properties.rawValue
                                = parseValueByMode(properties.value, mode, format);
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
                    var changes
                        = Control.prototype.setProperties.apply(this, arguments);

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
                        u.partial(goToPrevMonth, this)
                    );

                    // 向前按钮
                    var monthForward = this.getChild('monthForward');
                    monthForward.on(
                        'click',
                        u.partial(goToNextMonth, this)
                    );

                    // 月份选择
                    var monthSel = this.getChild('monthSel');
                    monthSel.on(
                        'change',
                        u.partial(changeMonth, this, monthSel)
                    );

                    // 给layer人肉增加class命名空间
                    monthSel.on(
                        'layerrendered',
                        u.partial(addCustomClassesForSelectLayer, this, 'month-select')
                    );

                    // 年份选择
                    var yearSel = this.getChild('yearSel');
                    yearSel.on(
                        'change',
                        u.partial(changeYear, this, yearSel)
                    );

                    yearSel.on(
                        'layerrendered',
                        u.partial(addCustomClassesForSelectLayer, this, 'year-select')
                    );

                    var controlHelper = this.helper;
                    var selectors = [
                        '.' + controlHelper.getPartClassName('month-item'),
                        '.' + controlHelper.getPartClassName('month-select-all'),
                        '.' + controlHelper.getPartClassName('month-title'),
                        '.' + controlHelper.getPartClassName('month-row-select')
                    ];

                    controlHelper.addDOMEvent(
                        controlHelper.getPart('monthMain'),
                        'click',
                        selectors.join(','),
                        monthViewClick
                    );
                },

                /**
                 * 重新渲染视图
                 * 仅当生命周期处于RENDER时，该方法才重新渲染
                 *
                 * @param {Array=} 变更过的属性的集合
                 * @override
                 */
                repaint: painters.createRepaint(
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
                    this.setProperties({range: range});
                },

                /**
                 * 设置日期
                 *
                 * @param {Date|Array} date 选取的日期.
                 */
                setRawValue: function (date) {
                    this.setProperties({rawValue: date});
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
                    var paramFormat = this.paramFormat;
                    if (this.mode === 'single') {
                        return m(rawValue).format(this.paramFormat) || '';
                    }

                    var dateStrs = [];
                    var oneDay = 86400000;
                    for (var i = 0; i < rawValue.length; i++) {
                        if (i === 0) {
                            dateStrs.push(
                                m(rawValue[i]).format(paramFormat)
                            );
                        }
                        else {
                            if ((rawValue[i] - rawValue[i - 1]) > oneDay) {
                                dateStrs.push(
                                    m(rawValue[i - 1]).format(paramFormat)
                                );
                                dateStrs.push(
                                    m(rawValue[i]).format(paramFormat)
                                );
                            }
                            else if (i === (rawValue.length - 1)) {
                                dateStrs.push(
                                    m(rawValue[i]).format(paramFormat)
                                );
                            }
                            else {
                                continue;
                            }
                        }
                    }
                    return dateStrs.join(',');
                },

                parseValue: function (value) {
                    return parseValueByMode(value, this.mode, this.paramFormat);
                },

                setRawValueWithoutFireChange: function (value) {
                    this.rawValue = value;
                    parseToCache(this);
                },

                getDateItemHTML: function (date) {
                    return lib.g(getItemId(this, date));
                }
            }
        );

        MonthView.defaultProperties = {
            range: {
                begin: new Date(1982, 10, 4),
                end: new Date(2046, 10, 4)
            },
            paramFormat: 'YYYY-MM-DD',
            dayNamesMin: ['一', '二', '三', '四', '五', '六', '日'],
            monthSelectLabel: '月',
            yearSelectLabel: '年'
        };

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
         * @return {string} HTML string
         */
        function getMainHTML(monthView) {
            var tpl = [
                '<div class="${headClass}"><table><tr>',
                    '<td class="${monthBackTdClass}">',
                        '<div class="${monthBackClass}"',
                        ' data-ui-type="Button"',
                        ' data-ui-child-name="monthBack"',
                        ' data-ui-id="${monthBackId}"',
                        '><span class="${monthBackIcon}"></span></div>',
                    '</td>',
                    '<td class="${yearSelectTdClass}">',
                        '<div class="${yearSelectClass}"',
                        ' data-ui="type:Select;childName:yearSel;variants:compact;',
                        ' id:${yearSelId};"></div>',
                    '</td>',
                    '<td class="${selectLabelClass}">',
                        '<div>${yearSelectLabel}</div>',
                    '</td>',
                    '<td class="${monthSelectTdClass}">',
                        '<div class="${monthSelectClass}"',
                        ' data-ui="type:Select;childName:monthSel;variants:compact;',
                        ' id:${monthSelId};"></div>',
                    '</td>',
                    '<td class="${selectLabelClass}">',
                        '<div>${monthSelectLabel}</div>',
                    '</td>',
                    '<td class="${monthForTdClass}">',
                        '<div class="${monthForClass}"',
                        ' data-ui-type="Button"',
                        ' data-ui-child-name="monthForward"',
                        ' data-ui-id="${monthForwardId}"',
                        '><span class="${monthForwardIcon}"></span></div>',
                    '</td>',
                '</tr></table></div>',
                '<div id="${monthMainId}" class="${monthMainClass}"></div>'
            ];
            tpl = tpl.join('');

            var controlHelper = monthView.helper;
            return lib.format(
                tpl,
                {
                    headClass: controlHelper.getPartClassName('head'),
                    monthBackId: controlHelper.getId('monthBack'),
                    monthBackIcon: controlHelper.getIconClass('caret-left'),
                    monthForwardId: controlHelper.getId('monthForward'),
                    monthForwardIcon: controlHelper.getIconClass('caret-right'),
                    yearSelId: controlHelper.getId('yearSel'),
                    monthSelId: controlHelper.getId('monthSel'),
                    monthMainId: controlHelper.getId('monthMain'),
                    monthMainClass: controlHelper.getPartClassName('month'),
                    monthBackClass:
                        controlHelper.getPartClassName('month-back'),
                    monthForClass:
                        controlHelper.getPartClassName('month-forward'),
                    yearSelectClass:
                        controlHelper.getPartClassName('year-select'),
                    monthSelectClass:
                        controlHelper.getPartClassName('month-select'),
                    monthBackTdClass:
                        controlHelper.getPartClassName('month-back-td'),
                    monthForTdClass:
                        controlHelper.getPartClassName('month-forward-td'),
                    yearSelectTdClass:
                        controlHelper.getPartClassName('year-select-td'),
                    monthSelectTdClass:
                        controlHelper.getPartClassName('month-select-td'),
                    selectLabelClass:
                        controlHelper.getPartClassName('select-label'),
                    yearSelectLabel: monthView.yearSelectLabel,
                    monthSelectLabel: monthView.monthSelectLabel
                }
            );
        }

        function generateMonthViewHead(monthView, html) {
            // 绘制表头
            var controlHelper = monthView.helper;
            var titles = [];
            if (monthView.mode === 'multi') {
                titles.push('');
            }
            titles = titles.concat(monthView.dayNamesMin);

            // 日期表格头的模板
            var tplHead = ''
                + '<table border="0" cellpadding="0" cellspacing="0" '
                + 'class="${className}"><thead><tr>';

            html.push(
                lib.format(
                    tplHead,
                    {
                        className:
                            controlHelper.getPartClassName('month-main')
                    }
                )
            );

            // 日期表格头单元的模板
            var tplHeadItem = ''
                + '<td id="${id}" data-index="${index}" class="${className}">'
                + '${text}</td>';
            var headItemClass
                = controlHelper.getPartClassName('month-title');
            var headItemId = controlHelper.getId('month-title');
            var emptyHeadItemClass
                = controlHelper.getPartClassName('month-select-all');

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
            html.push('</tr></thead>');
        }

        function generateMonthViewBody(monthView, html) {
            var controlHelper = monthView.helper;
            // 绘制表体
            html.push('<tbody><tr>');
            // 日期单元的模板
            var tplItem = ''
                + '<td data-year="${year}" data-month="${month}" '
                + 'data-date="${date}" class="${className}" '
                + 'id="${id}">${date}</td>';

            // 单行全选模板
            var rowSelectClass
                = controlHelper.getPartClassName('month-row-select');
            var tplRowSelectId = controlHelper.getId('row-select');
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

            var itemClass = controlHelper.getPartClassName('month-item');

            var todayClass
                = controlHelper.getPartClassName('month-item-today');

            var virClass
                = controlHelper.getPartClassName('month-item-virtual');
            var disabledClass
                = controlHelper.getPartClassName('month-item-disabled');
            var range = monthView.range;

            if (monthView.mode === 'multi') {
                html.push(lib.format(
                    tplRowSelectTpl,
                    {id: tplRowSelectId + '-' + rowTagIndex++}
                ));
            }
            while (nextMonth - repeater > 0 || index % 7 !== 0) {
                if (begin > 1 && index % 7 === 0) {
                    html.push('</tr><tr>');

                    if (monthView.mode === 'multi') {
                        html.push(lib.format(
                            tplRowSelectTpl,
                            {id: tplRowSelectId + '-' + rowTagIndex++}
                        ));
                    }
                }

                // 不属于当月的日期
                var virtual = (repeater.getMonth() !== month);

                // 不可选的日期
                var disabled = false;

                // range定义的begin之前的日期不可选
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
                var dateData = {
                    year: repeater.getFullYear(),
                    month: repeater.getMonth(),
                    date: repeater.getDate(),
                    className: currentClass,
                    id: getItemId(monthView, repeater)
                };
                if (monthView.dateItemRender) {
                    html.push(
                        monthView.dateItemRender(
                            tplItem,
                            dateData
                        )
                    );
                }
                else {
                    html.push(
                        lib.format(
                            tplItem,
                            dateData
                        )
                    );
                }

                repeater = new Date(year, month, ++begin);
                index++;
            }
            monthView.rowTagNum = rowTagIndex;

            html.push('</tr></tbody></table>');
        }

        /**
         * 日历月份显示单元的HTML
         *
         * @param {MonthView} monthView MonthView控件实例
         * @inner
         * @return {string} html string
         */
        function getMonthMainHTML(monthView) {
            var html = [];

            generateMonthViewHead(monthView, html);
            generateMonthViewBody(monthView, html);
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
         * @param {Event} e 触发事件的事件对象
         */
        function monthViewClick(e) {
            var tar = e.currentTarget;
            var $tar = $(tar);
            var controlHelper = this.helper;
            var allSelectClass
                = controlHelper.getPartClassName('month-select-all');
            var headClass
                = controlHelper.getPartClassName('month-title');
            var itemClass
                = controlHelper.getPartClassName('month-item');
            var rowSelectClass
                = controlHelper.getPartClassName('month-row-select');
            var virClass
                = controlHelper.getPartClassName('month-item-virtual');
            var disabledClass
                = controlHelper.getPartClassName('month-item-disabled');

            if ($tar.hasClass(itemClass)
                && !$tar.hasClass(virClass)
                && !$tar.hasClass(disabledClass)
            ) {
                selectByItem(this, tar);
                this.fire('itemclick', tar);
            }
            else if (this.mode === 'multi') {
                if ($tar.hasClass(rowSelectClass)) {
                    selectByTagClick(this, tar);
                }
                if ($tar.hasClass(headClass)) {
                    selectByColumn(this, tar);
                }
                if ($tar.hasClass(allSelectClass)) {
                    selectAll(this, $tar);
                }
            }
            this.fire('changed');
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
            var controlHelper = monthView.helper;
            var virtualClass
                = controlHelper.getPartClassName('month-item-virtual');
            var disabledClass
                = controlHelper.getPartClassName('month-item-disabled');
            var $dateItem = $(dateItem);

            // 既不是范围外的，又不是虚拟的
            if (!$dateItem.hasClass(virtualClass)
                && !$dateItem.hasClass(disabledClass)) {
                return 1;
            }
            // 虚拟的但不是范围外的
            else if ($dateItem.hasClass(virtualClass)
                && !$dateItem.hasClass(disabledClass)) {
                return -1;
            }
            return 0;
        }


        /**
         * 批量渲染横向批量选择按钮状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function batchRepaintRowTag(monthView) {
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = monthView.helper.getId('row-select');

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
         * @param {HTMLElement} rowTag 横向批量选择按钮
         */
        function repaintRowTag(monthView, rowTag) {
            var controlHelper = monthView.helper;
            var selectedClass
                = controlHelper.getPartClassName('month-item-selected');
            var dateItem = rowTag.nextSibling;
            var isAllSelected = true;
            var selectableNum = 0;
            while (dateItem) {
                if (isItemSelectable(monthView, dateItem) === 1) {
                    ++selectableNum;
                    if (!$(dateItem).hasClass(selectedClass)) {
                        isAllSelected = false;
                        break;
                    }
                }
                dateItem = dateItem.nextSibling;
            }
            if (selectableNum === 0) {
                isAllSelected = false;
            }
            setTagSelected(
                rowTag,
                isAllSelected,
                controlHelper.getPartClassName('month-row-select-selected')
            );
        }

        /**
         * 整列选中日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Element} columnTag 行箭头元素.
         */
        function selectByColumn(monthView, columnTag) {
            var index = columnTag.getAttribute('data-index');
            var controlHelper = monthView.helper;
            var columnSelectedClass
                = controlHelper.getPartClassName('month-title-selected');

            var selectAll = !$(columnTag).hasClass(columnSelectedClass);

            setTagSelected(
                columnTag,
                selectAll,
                columnSelectedClass
            );

            // 可以通过rowTag寻找节点
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = controlHelper.getId('row-select');

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
         * @param {HTMLElement} tagItem 要操作的tagItem
         * @param {boolean} isSelected 置为已选还是未选
         * @param {string} cls class
         */
        function setTagSelected(tagItem, isSelected, cls) {
            var $tagItem = $(tagItem);

            $tagItem.removeClass(cls);
            if (isSelected) {
                $tagItem.addClass(cls);
            }
        }

        /**
         * 批量渲染纵向批量选择按钮状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function batchRepaintColumnTag(monthView) {
            var headItemId = monthView.helper.getId('month-title');
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
            var controlHelper = monthView.helper;
            var selectedClass
                = controlHelper.getPartClassName('month-item-selected');
            var index = columnTagItem.getAttribute('data-index');
            var isAllSelected = true;
            var selectableNum = 0;

            // 可以通过rowTag寻找节点
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = controlHelper.getId('row-select');

            for (var i = 0; i < rowTagNum; i++) {
                var rowTag = lib.g(rowTagId + '-' + i);
                // 找到第index个节点，置为选择状态
                var sibling = rowTag.parentNode.children[index];
                if (isItemSelectable(monthView, sibling) === 1) {
                    ++selectableNum;
                    if (!$(sibling).hasClass(selectedClass)) {
                        isAllSelected = false;
                        break;
                    }
                }
            }

            if (selectableNum === 0) {
                isAllSelected = false;
            }

            setTagSelected(
                columnTagItem,
                isAllSelected,
                controlHelper.getPartClassName('month-title-selected')
            );
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
            var controlHelper = monthView.helper;
            var rowSelectClass
                = controlHelper.getPartClassName('month-row-select');
            var rowSelectedClass
                = controlHelper.getPartClassName('month-row-select-selected');
            var virtualClass
                = controlHelper.getPartClassName('month-item-virtual');
            var disabledClass
                = controlHelper.getPartClassName('month-item-disabled');

            var selectAll = !$(rowTag).hasClass(rowSelectedClass);
            setTagSelected(
                rowTag,
                selectAll,
                rowSelectedClass
            );

            var viewValue = monthView.viewValue;
            var changedDates = [];

            $(row).children().each(
                function (i, child) {
                    var $child = $(child);
                    if (!$child.hasClass(rowSelectClass)
                        && !$child.hasClass(virtualClass)
                        && !$child.hasClass(disabledClass)) {
                        var date = $child.attr('data-date');
                        var month = $child.attr('data-month');
                        var year = $child.attr('data-year');
                        var id = year + '-' + month + '-' + date;
                        viewValue[id] = {
                            isSelected: selectAll,
                            value: new Date(year, month, date)
                        };
                        changedDates.push(id);
                    }
                }
            );

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
            var controlHelper = monthView.helper;
            var rowTagId = controlHelper.getId('row-select');
            var selectAllTag = lib.g(controlHelper.getId('month-title-0'));
            var rowSelectedClass
                = controlHelper.getPartClassName('month-row-select-selected');
            var selectedRowNum = 0;
            for (var i = 0; i < rowTagNum; i++) {
                var rowTag = lib.g(rowTagId + '-' + i);
                if ($(rowTag).hasClass(rowSelectedClass)) {
                    selectedRowNum++;
                }
            }

            setTagSelected(
                selectAllTag,
                selectedRowNum === rowTagNum,
                rowSelectedClass
            );
        }

        /**
         * 选择全部
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Object} $tar 点击的全选DOM节点的JQuery对象
         */
        function selectAll(monthView, $tar) {
            // 获取横向选择状态
            var controlHelper = monthView.helper;
            var rowTagNum = monthView.rowTagNum;
            var rowTagId = controlHelper.getId('row-select');
            var rowSelctedClass
                = controlHelper.getPartClassName('month-row-select-selected');
            var rowTag;
            var slected = $tar.hasClass(rowSelctedClass);
            for (var i = 0; i < rowTagNum; i++) {
                rowTag = lib.g(rowTagId + '-' + i);
                // 先移除所有的选择
                if (slected) {
                    $(rowTag).addClass(rowSelctedClass);
                }
                else {
                    $(rowTag).removeClass(rowSelctedClass);
                }
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
            selectedDates.sort(
                function (a, b) {
                    return a - b;
                }
            );
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
            var controlHelper = monthView.helper;
            var id;
            var item;
            var dLength = dates.length;

            for (var i = 0; i < dLength; i++) {
                id = controlHelper.getId(dates[i]);
                item = lib.g(id);
                $(item).removeClass(
                    controlHelper.getPartClassName('month-item-selected')
                );
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
            var controlHelper = monthView.helper;
            var id;
            var item;
            var dLength = dates.length;

            for (var i = 0; i < dLength; i++) {
                id = controlHelper.getId(dates[i]);
                item = lib.g(id);
                $(item).addClass(
                    controlHelper.getPartClassName('month-item-selected')
                );
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
            var controlHelper = monthView.helper;
            if (!item) {
                return false;
            }
            var $item = $(item);
            var cls = controlHelper.getPartClassName(className);
            if ($item.hasClass(cls)) {
                $item.removeClass(cls);
                return false;
            }

            $item.addClass(cls);
            return true;
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
                var itemSelectClass
                    = monthView.helper.getPartClassName('month-item-selected');
                if ($(item).hasClass(itemSelectClass)) {
                    return;
                }
                var newDate = new Date(year, month, date);
                updateSingleSelectState(monthView, monthView.rawValue, newDate);
                monthView.rawValue = newDate;
                monthView.fire('change');
            }
        }

        /**
         * 根据range修正year month
         *
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
         *
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
            if (+lastYear === me.year) {
                changeYear(monthView, yearSelect);
            }
        }

        /**
         * 更新单选模式日历选择状态
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Date} oldDate 旧日期.
         * @param {Date} newDate 新日期.
         * @return {Date} 真实有效的新日期
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
            // 填充日历主体
            var controlHelper = monthView.helper;
            var monthMainId = controlHelper.getId('monthMain');
            var monthMain = lib.g(monthMainId);
            monthMain.innerHTML = getMonthMainHTML(monthView);
            // 找到最后一行，增加一个class
            var rowElements = monthMain.getElementsByTagName('tr');
            var lastRow = rowElements[rowElements.length - 1];
            controlHelper.addPartClasses('last-row', lastRow);
            // 更新选择状态
            updateSelectStateByValue(monthView);
        }

        function rangeAdapter(range, format) {
            var begin;
            var end;
            // range类型如果是string
            if (typeof range === 'string') {
                var beginAndEnd = range.split(',');
                begin = m(beginAndEnd[0], format).toDate();
                end = m(beginAndEnd[1], format).toDate();
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
         * 根据不同模式将字符串值解析为rawValue
         *
         * @inner
         * @param {string} value 字符串日期
         * @param {string} mode 日历模式 multi | single
         * @param {string} format 日期格式
         * @return {Date | Array}
         */
        function parseValueByMode(value, mode, format) {
            if (mode === 'single') {
                return m(value, format).toDate();
            }

            var dateStrs = value.split(',');
            var dates = [];
            for (var i = 0; i < dateStrs.length - 1; i += 2) {
                var begin = m(dateStrs[i], format).toDate();
                var end = m(dateStrs[i + 1], format).toDate();
                var temp;
                if (!begin || !end) {
                    continue;
                }
                if (begin - end === 0) {
                    dates.push(begin);
                }
                else {
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

        function updateSelectStateByValue(monthView) {
            // 单选模式
            var controlHelper = monthView.helper;
            if (monthView.mode !== 'multi') {
                updateSingleSelectState(monthView, null, monthView.rawValue);
                return;
            }

            // 多选模式
            var viewValue = monthView.viewValue;
            for (var key in viewValue) {
                if (viewValue.hasOwnProperty(key)) {
                    var item = lib.g(controlHelper.getId(key));
                    if (item) {
                        // 有可能这个item是不可选的
                        var isSelectable = isItemSelectable(monthView, item);
                        if (isSelectable === 1) {
                            if (viewValue[key].isSelected) {
                                controlHelper.addPartClasses(
                                    'month-item-selected', item
                                );
                            }
                            else {
                                controlHelper.removePartClasses(
                                    'month-item-selected', item
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
            }
            batchRepaintRowTag(monthView);
            batchRepaintColumnTag(monthView);
            repaintAllSelectTag(monthView);
        }

        /**
         * 给select的layer人肉增加class命名空间
         *
         * @inner
         * @param {Object} monthView layer渲染事件
         * @param {string} selectClass layer渲染事件
         * @param {Event} e layer渲染事件
         */
        function addCustomClassesForSelectLayer(monthView, selectClass, e) {
            var layerClasses = monthView.helper.getPartClasses(selectClass + '-layer');
            var layer = this.layer;
            layer.addCustomClasses(layerClasses);
            monthView.fire('selectlayerrendered', {layer: layer});
        }

        esui.register(MonthView);
        return MonthView;
    }
);
