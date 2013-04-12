/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 日历
 * @author dbear
 */

define(
    function (require) {
        require('./Button');
        require('./Panel');
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');
        var ui = require('./main');

        /**
         * 日历控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Calendar(options) {
            InputControl.apply(this, arguments);
        }

        /**
         * 获取可选择的年列表
         *
         * @param {Calendar} calendar Calendar控件实例
         * @inner
         * @return {Array}
         */
        function getYearOptions(calendar) {
            var range = calendar.range;
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
         * @param {Calendar} calendar Calendar控件实例
         * @param {number} year 选中的年
         * @inner
         * @return {Array}
         */
        function getMonthOptions(calendar, year) {
            var range = calendar.range;
            var ds = [];
            var len = 11;

            if (year == range.begin.getFullYear()) {
                i = range.begin.getMonth();
            } else if (year == range.end.getFullYear()) {
                len = range.end.getMonth();
            }

            for (var i = 0; i <= len; i++) {
                ds.push({text: (i + 1), value: i});
            }

            return ds;
        }

        /**
         * 获取日历弹出层的HTML
         *
         * @param {Calendar} calendar Calendar控件实例
         * @inner
         */
        function getLayerHTML(calendar) {
            var tplLayer = [
                '<div class="${headClass}"><table><tr>',
                    '<td width="40" align="left">',
                        '<div data-ui="type:Button;childName:monthBack;',
                        'id:${monthBackId};"></div>',
                    '</td>',
                    '<td>',
                        '<div data-ui="type:Select;childName:yearSel;',
                        'id:${yearSelId};width:45;"></div>',
                    '</td>',
                    '<td>',
                        '<div data-ui="type:Select;childName:monthSel;',
                        'id:${monthSelId};width:35;"></div>',
                    '</td>',
                    '<td width="40" align="right">',
                        '<div data-ui="type:Button;childName:monthForward;',
                        'id:${monthForwardId};"></div>',
                    '</td>',
                '</tr></table></div>',
                '<div data-ui="type:Panel;childName:monthView;',
                'id:${monthViewId}"></div>'
            ];

            tplLayer = tplLayer.join('');

            return lib.format(
                tplLayer,
                {
                    headClass:
                        helper.getClasses(calendar, 'layer-head').join(' '),
                    monthBackId: helper.getId(calendar, 'monthBack'),
                    monthForwardId: helper.getId(calendar, 'monthForward'),
                    yearSelId: helper.getId(calendar, 'yearSel'),
                    monthSelId: helper.getId(calendar, 'monthSel'),
                    monthViewId: helper.getId(calendar, 'monthView')
                }
            );
        }

        /**
         * 日历月份显示单元的HTML
         *
         * @param {Calendar} calendar Calendar控件实例
         * @inner
         */
        function getMonthViewHTML(calendar) {

            /** 绘制表头 */
            // 标题显示配置
            var titles = ['一', '二', '三', '四', '五', '六', '日'];

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
                            helper.getClasses(calendar, 'month-main').join(' ')
                    }
                )
            );

            // 日期表格头单元的模板
            var tplHeadItem = '<td class="${className}">${text}</td>';

            var tLen = titles.length;
            for (var tIndex = 0; tIndex < tLen; tIndex++) {
                html.push(
                    lib.format(
                        tplHeadItem,
                        {
                            className:
                                helper.getClasses(
                                    calendar,
                                    'month-title'
                                ).join(' '),
                            text: titles[tIndex]
                        }
                    )
                );
            }
            html.push('</tr></thead><tbody><tr>');

            /** 绘制表体 */
            // 日期单元的模板
            var tplItem = ''
                + '<td year="${year}" month="${month}" '
                + 'date="${date}" class="${className}" '
                + 'id="${id}">${date}</td>';

            var index = 0;
            var year = calendar.year;
            var month = calendar.month;
            var repeater = new Date(year, month, 1);
            var nextMonth = new Date(year, month + 1, 1);
            var begin = 1 - (repeater.getDay() + 6) % 7;
            repeater.setDate(begin);

            var itemClass = helper.getClasses(calendar, 'month-item').join(' ');
            var virClass =
                helper.getClasses(calendar, 'month-item-virtual').join(' ');
            var disabledClass =
                helper.getClasses(calendar, 'month-item-disabled').join(' ');
            var range = calendar.range;

            while (nextMonth - repeater > 0 || index % 7 !== 0) {
                if (begin > 0 && index % 7 === 0) {
                    html.push('</tr><tr>');
                }

                // 不属于当月的日期
                var virtual = (repeater.getMonth() != month);

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
                virtual && (currentClass += ' ' + virClass);
                disabled && (currentClass += ' ' + disabledClass);

                + '<td year="${year}" month="${month}" '
                + 'date="${date}" class="${className}" '
                + 'id="${id}">${date}</td>';
                html.push(
                    lib.format(
                        tplItem,
                        {
                            year: repeater.getFullYear(),
                            month: repeater.getMonth(),
                            date: repeater.getDate(),
                            className: currentClass,
                            id: getItemId(calendar, repeater)
                        }
                    )
                );

                repeater = new Date(year, month, ++begin);
                index++;
            }

            html.push('</tr></tbody></table>');
            return html.join('');            
        }

        /**
         * 获取日期对应的dom元素item的id
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {Date} date 日期.
         * @return {string}
         */
        function getItemId(calendar, date) {
            return helper.getId(
                calendar,
                date.getFullYear()
                    + '-' + date.getMonth()
                    + '-' + date.getDate()
            );
        }
               
        /**
         * 显示下拉弹层
         *
         * @param {Calendar} calendar Calendar控件实例
         */
        function showLayer(calendar) {
            var classes = helper.getClasses(calendar, 'layer-hidden');
            lib.removeClasses(calendar.layer, classes);
            calendar.addState('active');
        }

        /**
         * 隐藏下拉弹层
         *
         * @param {Calendar} calendar Calendar控件实例
         */
        function hideLayer(calendar) {
            var classes = helper.getClasses(calendar, 'layer-hidden');
            lib.addClasses(calendar.layer, classes);
            calendar.removeState('active');

        }

        /**
         * 获取点击自动隐藏的处理handler
         *
         * @private
         * @return {Function}
         */
        function closeLayer(calendar, e) {
            if (calendar.isHidePrevent) {
                calendar.isHidePrevent = 0;
                return;
            }
            var tar = e.target || e.srcElement;
            while (tar && tar != document.body) {
                if (tar == calendar.layer) {
                    return;
                }
                else if (tar == calendar.layer) {

                }
                tar = tar.parentNode;
            }
            calendar.fire('hide');
            hideLayer(calendar);
        }


        /**
         * 打开下拉弹层
         *
         * @param {Calendar} calendar Calendar控件实例
         * @inner
         */
        function openLayer(calendar) {
            var layer = calendar.layer;
            if (!layer) {
                layer = document.createElement('div');
                layer.className = 
                    helper.getClasses(calendar, 'layer').join(' ');
                layer.innerHTML = getLayerHTML(calendar);
                document.body.appendChild(layer);
                calendar.layer = layer;

                // 创建控件树
                calendar.initChildren(layer);

                //向后按钮
                var monthBack = calendar.getChild('monthBack');
                lib.addClasses(
                    monthBack.main,
                    helper.getClasses(calendar, 'month-back')
                );
                monthBack.onclick = lib.bind(goToPrevMonth, null, calendar);


                //向前按钮
                var monthForward = calendar.getChild('monthForward');
                lib.addClasses(
                    monthForward.main,
                    helper.getClasses(calendar, 'month-forward')
                );
                monthForward.onclick = lib.bind(goToNextMonth, null, calendar);

                // 填充年份
                var yearSel = calendar.getChild('yearSel');
                yearSel.setProperties({
                    datasource: getYearOptions(calendar),
                    value: calendar.year
                });
                yearSel.on(
                    'change',
                    lib.bind(changeYear, null, calendar, yearSel)
                );

                // 填充月份
                var monthSel = calendar.getChild('monthSel');
                monthSel.setProperties({
                    datasource: getMonthOptions(calendar, calendar.year),
                    value: calendar.month
                });
                monthSel.on(
                    'change',
                    lib.bind(changeMonth, null, calendar, monthSel)
                );

                //填充日历主体
                var monthView = calendar.getChild('monthView');
                lib.addClasses(
                    monthView.main,
                    helper.getClasses(calendar, 'month')
                );
                monthView.setContent(getMonthViewHTML(calendar));

                //为日期绑定点击事件
                helper.addDOMEvent(
                    monthView, monthView.main, 'click',
                    lib.bind(monthViewClick, null, calendar)
                );

                var close = lib.bind(closeLayer, null, calendar);
                lib.on(document, 'click', close);
                calendar.on(
                    'afterdispose',
                    function () {
                        lib.un(document, 'mousedown', close);
                    }
                );

                //选择日期 
                selectDate(calendar, calendar.rawValue);
            }

            var mainOffset = lib.getOffset(calendar.main);
            
            layer.style.position = 'absolute';
            layer.style.zIndex = '1001';
            layer.style.top = mainOffset.bottom + 'px';
            layer.style.left = mainOffset.left + 'px';
            layer.style.width = '200px';

            showLayer(calendar);
        }

        /**
         * 主元素点击事件
         *
         * @param {Calendar} calendar Calendar控件实例
         * @param {Event} 触发事件的事件对象
         * @inner
         */
        function mainClick(calendar, e) {
            if (!calendar.disabled) {
                calendar.isHidePrevent = 1;
                toggleLayer(calendar);
            }
        }

        /**
         * 日历元素点击事件
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {Event} 触发事件的事件对象
         */
        function monthViewClick(calendar, e) {
            var tar = e.target || e.srcElement;
            var classes = helper.getClasses(calendar, 'month-item');

            var virClasses = helper.getClasses(calendar, 'month-item-virtual');
            var disabledClasses =
                helper.getClasses(calendar, 'month-item-disabled');
            while (tar && tar != document.body) {
                if (lib.hasClass(tar, classes[0])
                    && !lib.hasClass(tar, virClasses[0])
                    && !lib.hasClass(tar, disabledClasses[0])) {
                    selectByItem(calendar, tar);
                    return;
                }
                tar = tar.parentNode;
            }
        }

        /**
         * 通过item的dom元素选择日期
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {Element} item dom元素td.
         */
        function selectByItem(calendar, item) {
            var date = item.getAttribute('date');
            var month = item.getAttribute('month');
            var year = item.getAttribute('year');
            change(calendar, new Date(year, month, date));
        }

        /**
         * 选择当前日期
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {Date} date 当前日期.
         */
        function change(calendar, date) {
            if (!date) {
                return;
            }

            if (calendar.fire('change') !== false) {
                selectDate(calendar, date);
                updateMain(calendar, date);
            }
        }

        /**
         * 更新主显示
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {Date} date 当前日期.
         */
        function updateMain(calendar, date) {
            var textId = helper.getId(calendar, 'text');
            lib.g(textId).innerHTML =
                lib.date.format(date, calendar.dateFormat);
        }

        /**
         * 根据下拉弹层当前状态打开或关闭之
         *
         * @param {Calendar} calendar Calendar控件实例
         * @inner
         */
        function toggleLayer(calendar) {
            if (calendar.disabled) {
                return;
            }

            if (!calendar.layer) {
                openLayer(calendar);
            }
            else {
                var layer = calendar.layer;
                var classes =
                    helper.getPartClasses(calendar, 'layer-hidden');
                if (lib.hasClass(layer, classes[0])) {
                    showLayer(calendar);
                }
                else {
                    hideLayer(calendar);
                }
            }
        }
        /**
         * 绘制浮动层内的日历部件
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {number} opt_year 年.
         * @param {number} opt_month 月.
         */
        function repaintMonthView(calendar, optYear, optMonth) {
            var year = calendar.year;
            var month = calendar.month;

            if (lib.hasValue(optYear)) {
                year = optYear;
            }
            if (lib.hasValue(optMonth)) {
                month = optMonth;
            }

            var me = calendar;
            var range = me.range;
            var view = new Date(year, month, 1);
            var rangeBegin = range.begin.getFullYear() * 12
                + range.begin.getMonth();
            var rangeEnd = range.end.getFullYear() * 12 + range.end.getMonth();
            var viewMonth = year * 12 + month;

            month = view.getMonth();

            if (rangeBegin - viewMonth > 0) {
                month += (rangeBegin - viewMonth);
            }
            else if (viewMonth - rangeEnd > 0) {
                month -= (viewMonth - rangeEnd);
            }
            view.setMonth(month);
            me.month = view.getMonth();
            me.year = view.getFullYear();

            var monthSelect = me.getChild('monthSel');
            monthSelect.setProperties({
                datasource: getMonthOptions(me, me.year),
                value: me.month
            });

            var yearSelect = me.getChild('yearSel');
            yearSelect.setProperties({
                value: me.year
            });

            // 绘制日历部件
            var monthView = me.getChild('monthView');
            monthView.setContent(getMonthViewHTML(me));

            //选择日期 
            selectDate(me, me.rawValue);
        }

        /**
         * 选择日期
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {Date} date 要选择的日期.
         */
        function selectDate(calendar, date) {
            if (date instanceof Date) {
                var me = calendar;
                resetSelected(me);
                calendar.rawValue = date;
                paintSelected(me);
            }
        }

        /**
         * 清空选中的日期
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         */
        function resetSelected(calendar) {
            var me = calendar;
            if (me.rawValue) {
                var item = lib.g(getItemId(me, me.rawValue));
                item && lib.removeClasses(
                    item,
                    helper.getClasses(me, 'month-item-selected')
                );
                me.value = null;
            }
        }

        /**
         * 绘制选中的日期
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         */
        function paintSelected(calendar) {
            var me = calendar;
            if (me.rawValue) {
                var item = lib.g(getItemId(me, me.rawValue));
                item && lib.addClasses(
                    item,
                    helper.getClasses(me, 'month-item-selected')
                );
            }
        }

        /**
         * “下一个月”按钮点击的handler
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         */
        function goToNextMonth(calendar) {
            repaintMonthView(calendar, calendar.year, calendar.month + 1);
        }

        /**
         * 获取“上一个月”按钮点击的handler
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         */
        function goToPrevMonth(calendar) {
            repaintMonthView(calendar, calendar.year, calendar.month - 1);
        }

        /**
         * 年份切换
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {Select} yearSel Select控件实例
         */
        function changeYear(calendar, yearSel) {
            var year = parseInt(yearSel.getValue(), 10);
            calendar.year = year;
            repaintMonthView(calendar, year, calendar.month);
            calendar.isHidePrevent = 1;

        }

        /**
         * 月份切换
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {Select} monthSel Select控件实例
         */
        function changeMonth(calendar, monthSel) {
            var month = parseInt(monthSel.getValue(), 10);
            calendar.month = month;
            repaintMonthView(calendar, calendar.year, month);
            calendar.isHidePrevent = 1;

        }

        Calendar.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'Calendar',

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
                    now: new Date(),
                    range: {
                        begin: new Date(1983, 8, 3),
                        end: new Date(2046, 10, 4)
                    },
                    dateFormat: 'yyyy-MM-dd',
                    paramFormat: 'yyyy-MM-dd',
                    rawValue: new Date()
                };
                lib.extend(properties, options);
                lib.extend(this, properties);

                this.month = parseInt(this.month, 10)
                    || this.rawValue.getMonth();
                this.year = parseInt(this.year, 10)
                    || this.rawValue.getFullYear();
            },


            /**
             * 初始化DOM结构
             *
             * @protected
             */
            initStructure: function () {
                // 如果主元素不是`<div>`，替换成`<div>`
                if (this.main.nodeName.toLowerCase() !== 'div') {
                    var main = this.createMain();
                    lib.insertBefore(main, this.main);
                    this.main.parentNode.removeChild(this.main);
                    this.main = main;
                }
                
                var date = this.getRawValue();
                var tpl = [
                    '<div class="${className}" id="${id}">${value}</div>',
                    '<div class="${arrow}"></div>',
                    '<input type="hidden" name="${name}" />'
                ];

                this.main.innerHTML = lib.format(
                    tpl.join('\n'),
                    {
                        className: helper.getClasses(this, 'text').join(' '),
                        id: helper.getId(this, 'text'),
                        value: lib.date.format(date, this.dateFormat),
                        arrow: helper.getClasses(this, 'arrow').join(' '),
                        name: this.name
                    }
                );

                helper.addDOMEvent(
                    this, this.main, 'click',
                    lib.bind(mainClick, null, this)
                );
            },

            /**
             * 创建控件主元素
             *
             * @param {Object=} options 构造函数传入的参数
             * @return {HTMLElement}
             * @override
             */
            createMain: function (options) {
                return document.createElement('DIV');
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: helper.createRepaint(
                {
                    name: 'rawValue',
                    paint: function (calendar, value) {
                        // 更新主显示
                        updateMain(calendar, value);
                        calendar.month = calendar.rawValue.getMonth();
                        calendar.year = calendar.rawValue.getFullYear();
                        if (calendar.layer) {
                            // 更新日历
                            selectDate(calendar, value);
                            repaintMonthView(
                                calendar, value.getFullYear(), value.getMonth()
                            );
                        }

                    }
                }
            ),

            /**
             * 鼠标点击事件处理函数
             */
            clickHandler: function () {
                this.fire('click');
            },

            /**
             * 设置日期
             *
             * @param {Date} date 选取的日期.
             */
            setRawValue: function (date) {
                this.setProperties({ 'rawValue': date });
            },

            /**
             * 获取选取日期值
             * 
             * @return {Date} 
             */
            getRawValue: function () {
                return this.rawValue;
            },

            /**
             * 获取日期字符串
             * 
             * @return {string} 
             */
            getValue: function () {
                return lib.date.format(this.rawValue, this.paramFormat) || null;
            }
        };

        lib.inherits(Calendar, InputControl);
        ui.register(Calendar);

        return Calendar;
    }
);
