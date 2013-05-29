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
        // css
        require('css!./css/MonthView.css');

        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var ui = require('./main');

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
            var range = monthView.range;
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
            var range = monthView.range;
            var ds = [];
            var len = 11;

            var i = 0;

            if (year == range.begin.getFullYear()) {
                i = range.begin.getMonth();
            } else if (year == range.end.getFullYear()) {
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
                        '<div class="${monthBackClass}" data-ui="type:Button;',
                        'childName:monthBack;id:${monthBackId};"></div>',
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
                        '<div class="${monthForClass}" data-ui="type:Button;',
                        'childName:monthForward;id:${monthForwardId};"></div>',
                    '</td>',
                '</tr></table></div>',
                '<div id="${monthMainId}" class="${monthMainClass}"></div>'
            ];
            tpl = tpl.join('');

            return lib.format(
                tpl,
                {
                    headClass:
                        helper.getPartClasses(monthView, 'head').join(' '),
                    monthBackId: helper.getId(monthView, 'monthBack'),
                    monthForwardId: helper.getId(monthView, 'monthForward'),
                    yearSelId: helper.getId(monthView, 'yearSel'),
                    monthSelId: helper.getId(monthView, 'monthSel'),
                    monthMainId: helper.getId(monthView, 'monthMain'),
                    monthMainClass:
                        helper.getPartClasses(monthView, 'month').join(' '),
                    monthBackClass:
                        helper.getPartClasses(
                            monthView, 'month-back'
                        ).join(' '),
                    monthForClass:
                        helper.getPartClasses(
                            monthView, 'month-forward'
                        ).join(' ')
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
                            helper.getPartClasses(
                                monthView, 'month-main'
                            ).join(' ')
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
                                helper.getPartClasses(
                                    monthView,
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
                + '<td data-year="${year}" data-month="${month}" '
                + 'data-date="${date}" class="${className}" '
                + 'id="${id}">${date}</td>';

            var index = 0;
            var year = monthView.year;
            var month = monthView.month;
            var repeater = new Date(year, month, 1);
            var nextMonth = new Date(year, month + 1, 1);
            var begin = 1 - (repeater.getDay() + 6) % 7;
            repeater.setDate(begin);

            var itemClass =
                helper.getPartClasses(monthView, 'month-item').join(' ');
            var virClass =
                helper.getPartClasses(
                    monthView, 'month-item-virtual'
                ).join(' ');
            var disabledClass =
                helper.getPartClasses(
                    monthView, 'month-item-disabled'
                ).join(' ');
            var range = monthView.range;

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
            return helper.getId(
                monthView,
                date.getFullYear()
                    + '-' + date.getMonth()
                    + '-' + date.getDate()
            );
        }


        /**
         * 日历元素点击事件
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Event} 触发事件的事件对象
         */
        function monthViewClick(monthView, e) {
            var tar = e.target || e.srcElement;
            var classes = helper.getPartClasses(monthView, 'month-item');

            var virClasses =
                helper.getPartClasses(monthView, 'month-item-virtual');
            var disabledClasses =
                helper.getPartClasses(monthView, 'month-item-disabled');
            while (tar && tar != document.body) {
                if (lib.hasClass(tar, classes[0])
                    && !lib.hasClass(tar, virClasses[0])
                    && !lib.hasClass(tar, disabledClasses[0])) {
                    selectByItem(monthView, tar);
                    return;
                }
                tar = tar.parentNode;
            }
        }

        /**
         * 通过item的dom元素选择日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Element} item dom元素td.
         */
        function selectByItem(monthView, item) {
            var date = item.getAttribute('data-date');
            var month = item.getAttribute('data-month');
            var year = item.getAttribute('data-year');
            change(monthView, new Date(year, month, date));
        }

        /**
         * 选择当前日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Date} date 当前日期.
         */
        function change(monthView, date) {
            if (!date) {
                return;
            }
            var oldDate = monthView.rawValue;
            monthView.rawValue = date;
            updateSelectState(monthView, oldDate);
            monthView.fire('change');
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
            var range = me.range;
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

            yearSelect.setProperties({
                datasource: getYearOptions(me),
                value: me.year
            });


            // 如果year选择的数据没改变，
            // 但可能还是需要重回日历，
            // 因此要手动触发year的change
            if (lastYear == me.year) {
                yearSelect.fire('change');
            }

        }

        /**
         * 选择日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Date} oldValue 旧日期.
         */
        function updateSelectState(monthView, oldValue) {
            var me = monthView;
            if (oldValue) {
                resetSelected(me, oldValue);
            }
            paintSelected(me);
        }

        /**
         * 清空选中的日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         * @param {Date} date 旧日期.
         */
        function resetSelected(monthView, date) {
            var me = monthView;
            if (date) {
                var item = lib.g(getItemId(me, date));
                item && lib.removeClasses(
                    item,
                    helper.getPartClasses(me, 'month-item-selected')
                );
            }
        }

        /**
         * 绘制选中的日期
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function paintSelected(monthView) {
            var me = monthView;
            if (me.rawValue) {
                var item = lib.g(getItemId(me, me.rawValue));
                item && helper.addPartClasses(
                    me,
                    'month-item-selected',
                    item
                );
            }
        }

        /**
         * “下一个月”按钮点击的handler
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function goToNextMonth(monthView) {
            repaintMonthView(monthView, monthView.year, monthView.month + 1);
        }

        /**
         * 获取“上一个月”按钮点击的handler
         *
         * @inner
         * @param {MonthView} monthView MonthView控件实例
         */
        function goToPrevMonth(monthView) {
            repaintMonthView(monthView, monthView.year, monthView.month - 1);
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

            //选择日期 
            updateSelectState(monthView);
        }

        /**
         * range适配器，将string型range适配为Object
         *
         * @inner
         * @param {Object | string} range
         */
         function rangeAdapter(range) {            
            // range类型如果是string
            if (typeof range === 'string') {
                var beginAndEnd = range.split(',');
                var begin = parseToDate(beginAndEnd[0]);
                var end = parseToDate(beginAndEnd[1]);
                return {
                    begin: begin,
                    end: end
                };
            }
            else {
                return range;
            }
         }

        /**
         * 字符串日期转换为Date对象
         *
         * @inner
         * @param {string} dateStr 字符串日期
         */
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
                        begin: new Date(1983, 8, 3),
                        end: new Date(2046, 10, 4)
                    },
                    dateFormat: 'yyyy-MM-dd',
                    paramFormat: 'yyyy-MM-dd',
                    rawValue: new Date()
                };
                lib.extend(properties, options);
                if (properties.value) {
                    properties.rawValue = parseToDate(properties.value);
                }

                properties.range = rangeAdapter(properties.range);

                this.setProperties(properties);

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
                // 如果主元素不是包裹元素，替换成`<div>`
                if (!lib.isBlock(this.main)) {
                    helper.replaceMain(this);
                }

                this.main.innerHTML = getMainHTML(this);

                // 创建控件树
                this.initChildren(this.main);

                //向后按钮
                var monthBack = this.getChild('monthBack');
                monthBack.on(
                    'click',
                    lib.curry(goToPrevMonth, this)
                );


                //向前按钮
                var monthForward = this.getChild('monthForward');
                monthForward.on(
                    'click',
                    lib.curry(goToNextMonth, this)
                );

                var monthSel = this.getChild('monthSel');
                monthSel.on(
                    'change',
                    lib.curry(changeMonth, this, monthSel)
                );
                var yearSel = this.getChild('yearSel');
                yearSel.on(
                    'change',
                    lib.curry(changeYear, this, yearSel)
                );

                var monthMainId = helper.getId(this, 'monthMain');
                var monthMain = lib.g(monthMainId);

                //为日期绑定点击事件
                helper.addDOMEvent(
                    this, monthMain, 'click',
                    lib.curry(monthViewClick, this)
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
                Control.prototype.repaint,
                {
                    name: ['rawValue', 'range'],
                    paint: function (monthView, rawValue, range) {
                        if (range) {
                            monthView.range = rangeAdapter(range);
                        }
                        monthView.month = monthView.rawValue.getMonth();
                        monthView.year = monthView.rawValue.getFullYear();
                        repaintMonthView(
                            monthView,
                            monthView.rawValue.getFullYear(),
                            monthView.rawValue.getMonth()
                        );

                    }
                }
            ),

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
             * 将value从原始格式转换成string
             * 
             * @param {*} rawValue 原始值
             * @return {string}
             */
            stringifyValue: function (rawValue) {
                return lib.date.format(this.rawValue, this.paramFormat) || '';
            }

        };

        lib.inherits(MonthView, Control);
        ui.register(MonthView);

        return MonthView;
    }
);
