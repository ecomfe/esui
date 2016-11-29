/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 日历
 * @author dbear, otakustay
 */

define(
    function (require) {
        require('./MonthView');

        var u = require('underscore');
        var moment = require('moment');
        var lib = require('./lib');
        var esui = require('./main');
        var InputControl = require('./InputControl');
        var Layer = require('./Layer');
        var eoo = require('eoo');
        var $ = require('jquery');
        var painters = require('./painters');

        var CalendarLayer = eoo.create(
            Layer,
            {
                create: function () {
                    var ele = this.$super(arguments);
                    $(this.control.main).after(ele);
                    return ele;
                },

                render: function (element) {
                    var html = '<div data-ui-type="MonthView" '
                        + 'data-ui-child-name="prevMonthView"></div>';

                    var calendar = this.control;
                    var twoMonths = calendar.twoMonths;
                    if (twoMonths) {
                        html += ' <div data-ui-type="MonthView" '
                        + 'data-ui-child-name="nextMonthView"></div>';
                    }
                    element.innerHTML = html;
                    calendar.helper.initChildren(element);
                    paintLayer(calendar, calendar.rawValue);
                },

                initBehavior: function () {
                    var calendar = this.control;
                    var prevMonthView = calendar.getChild('prevMonthView');
                    var nextMonthView = calendar.getChild('nextMonthView');
                    prevMonthView.on('change', u.bind(syncMonthView, calendar));
                    prevMonthView.on('changemonth', u.bind(changePrevMonth, calendar));
                    nextMonthView && nextMonthView.on('change', u.bind(syncMonthView, calendar));
                    nextMonthView && nextMonthView.on('changemonth', u.bind(changeNextMonth, calendar));

                    if (calendar.autoHideLayer) {
                        prevMonthView.on(
                            'itemclick',
                            u.bind(calendar.layer.toggle, calendar.layer)
                        );

                        nextMonthView && nextMonthView.on(
                            'itemclick',
                            u.bind(calendar.layer.toggle, calendar.layer)
                        );
                    }
                    this.on('show', function () {
                        prevMonthView.setProperties(
                            {
                                rawValue: calendar.rawValue,
                                range: calendar.range
                            }
                        );
                    });
                }
            }
        );

        /**
         * 日历控件
         *
         * 日历控件是由一个按钮和一个浮层组成的，如果你只需要显示一个月日期的效果，
         * 请使用{@link MonthView}控件
         *
         * @extends InputControl
         * @requires MonthView
         * @constructor
         */
        var Calendar = eoo.create(
            InputControl,
            {
                constructor: function () {
                    this.$super(arguments);
                    this.layer = new CalendarLayer(this);
                },

                /**
                 * 控件类型，始终为`"Calendar"`
                 *
                 * @type {string}
                 * @readonly
                 * @override
                 */
                type: 'Calendar',

                /**
                 * 初始化参数
                 *
                 * @param {Object} [options] 构造函数传入的参数
                 * @protected
                 * @override
                 */
                initOptions: function (options) {
                    var now = new Date();
                    var properties = {
                        /**
                         * @property {Date} [rawValue]
                         *
                         * 控件的原始值，为`Date`类型，默认为当天
                         *
                         * @override
                         */
                        rawValue: now,
                        // 是否点击自动关闭弹层
                        autoHideLayer: false,
                        // 是否显示两个MonthView
                        twoMonths: false
                    };

                    u.extend(properties, Calendar.defaultProperties, options);

                    if (lib.isInput(this.main)) {
                        this.helper.extractOptionsFromInput(this.main, properties);
                    }

                    // parseValue 需要用到 paramFormat
                    this.paramFormat = properties.paramFormat;

                    if (options.value) {
                        properties.rawValue = this.parseValue(properties.value);
                    }

                    // 类型如果是string
                    var range = properties.range;
                    if (typeof range === 'string') {
                        var beginAndEnd = range.split(',');
                        var begin = this.parseValue(beginAndEnd[0]);
                        var end = this.parseValue(beginAndEnd[1]);
                        properties.range = {begin: begin, end: end};

                    }
                    this.setProperties(properties);
                },

                /**
                 * 初始化DOM结构
                 *
                 * @protected
                 * @override
                 */
                initStructure: function () {
                    // 如果主元素是输入元素，替换成`<div>`
                    // 如果输入了非块级元素，则不负责
                    var controlHelper = this.helper;
                    if (lib.isInput(this.main)) {
                        controlHelper.replaceMain();
                    }

                    this.layer.autoCloseExcludeElements = [this.main];
                    var template = [
                        '<div class="${classes}" id="${id}">${value}</div>',
                        '<div class="${arrow}"><span class="${iconCalendar}"></span></div>'
                    ];

                    this.main.innerHTML = lib.format(
                        template.join(''),
                        {
                            classes: controlHelper.getPartClassName('text'),
                            id: controlHelper.getId('text'),
                            arrow: controlHelper.getPartClassName('arrow'),
                            iconCalendar: controlHelper.getIconClass()
                        }
                    );
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                initEvents: function () {
                    this.helper.addDOMEvent(this.main, 'click', u.bind(this.layer.toggle, this.layer));
                },

                /**
                 * 重渲染
                 *
                 * @method
                 * @protected
                 * @override
                 */
                repaint: painters.createRepaint(
                    InputControl.prototype.repaint,
                    {
                        /**
                         * @property {meta.DateRange} range
                         *
                         * 指定控件可选的时间段
                         */
                        name: ['rawValue', 'range'],
                        paint: function (calendar, rawValue, range) {
                            if (range) {
                                range = calendar.convertToRaw(range, calendar.range);
                                calendar.range = range;
                            }

                            if (rawValue) {
                                calendar.rawValue = rawValue;
                                updateDisplayText(calendar);
                            }

                            if (calendar.layer) {
                                paintLayer(calendar, calendar.rawValue);
                            }
                        }
                    },
                    {
                        name: ['disabled', 'hidden', 'readOnly'],
                        paint: function (calendar, disabled, hidden, readOnly) {
                            if (disabled || hidden || readOnly) {
                                calendar.layer.hide();
                            }
                        }
                    }
                ),

                /**
                 * 设置日期可选区间
                 *
                 * @param {meta.DateRange} range 日期可选区间
                 */
                setRange: function (range) {
                    this.setProperties({range: range});
                },

                /**
                 * 将值从原始格式转换成字符串，复杂类型的输入控件需要重写此接口
                 *
                 * @param {Date} rawValue 原始值
                 * @return {string}
                 * @protected
                 * @override
                 */
                stringifyValue: function (rawValue) {
                    return moment(rawValue).format(this.dateFormat) || '';
                },

                /**
                 * 将字符串转换成对象型rawValue, * 可重写
                 *
                 * @inner
                 * @param {string} value 目标日期字符串 ‘YYYY-MM-DD,YYYY-MM-DD’
                 * @param {Object} defaultRange 默认标准化range
                 * @return {Object} {begin:Date,end:Date}
                 */
                convertToRaw: function (value, defaultRange) {
                    var format = this.paramFormat;
                    if (u.isString(value)) {
                        var strDates = value.split(',');
                        return {
                            begin: strDates[0] ? moment(strDates[0], format).toDate() : defaultRange.begin,
                            end: strDates[1] ? moment(strDates[1], format).toDate() : defaultRange.end
                        };
                    }
                    return {
                        begin: value.begin ? value.begin : defaultRange.begin,
                        end: value.end ? value.end : defaultRange.end
                    };
                },

                /**
                 * 将字符串类型的值转换成原始格式，复杂类型的输入控件需要重写此接口
                 *
                 * @param {string} value 字符串值
                 * @return {Date}
                 * @protected
                 * @override
                 */
                parseValue: function (value) {
                    var date = moment(value, this.paramFormat).toDate();
                    return date;
                },

                /**
                 * 销毁
                 *
                 * @override
                 */
                dispose: function () {
                    if (this.helper.isInStage('DISPOSED')) {
                        return;
                    }
                    // 先调用parent的的dispose方法以方便layer上的组件销毁
                    // 因为monthview是注册在当前组件下的
                    this.$super(arguments);
                    // 最后清空layer
                    if (this.layer) {
                        this.layer.dispose();
                        this.layer = null;
                    }
                }
            }
        );

        Calendar.defaultProperties = {
            range: {
                begin: new Date(1983, 8, 3),
                end: new Date(2046, 10, 4)
            },

            /**
             * @property {string} [dateFormat="YYYY-MM-DD"]
             *
             * 输出的日期格式，用于{@link Calendar#getValue}返回时格式化
             *
             * 具体的日期格式参考
             * [moment文档](http://momentjs.com/docs/#/displaying/format/)
             */
            dateFormat: 'YYYY-MM-DD',

            /**
             * @property {string} [paramFormat="YYYY-MM-DD"]
             *
             * 输入的日期格式，用于{@link Calendar#setValue}时格式化
             *
             * 具体的日期格式参考
             * [moment文档](http://momentjs.com/docs/#/displaying/format/)
             */
            paramFormat: 'YYYY-MM-DD',

            /**
             * @property {string} [displayFormat="YYYY-MM-DD"]
             *
             * 展示使用的日期格式，用于updateDisplayText时格式化
             *
             * 具体的日期格式参考
             * [moment文档](http://momentjs.com/docs/#/displaying/format/)
             */
            displayFormat: 'YYYY-MM-DD'
        };

        /**
         * 更新显示
         *
         * @event
         * @fires MultiCalendar#change
         * @param {Object} e 事件对象
         * @param {MonthView} e.target 当前改变值的MonthView控件
         * @ignore
         */
        function syncMonthView(e) {
            var currMonthView = e.target;
            var date = currMonthView.getRawValue();

            if (!date) {
                return;
            }

            this.rawValue = date;
            updateDisplayText(this);

            /**
             * @event change
             *
             * 值发生变化时触发
             *
             * @member MultiCalendar
             */
            this.fire('change');
            this.fire('changed');
        }

        /**
         * 重绘双日历浮层
         *
         * @param  {MultiCalendar} calendar 控件实例
         * @param  {Date} rawValue 控件当前选取日期
         * @inner
         */
        function paintLayer(calendar, rawValue) {

            var prevMonthView = calendar.getChild('prevMonthView');
            var nextMonthView = calendar.getChild('nextMonthView');
            var range = calendar.range;
            var monthViewRanges = getMonthViewRange(range);

            var nextMonthRawValue = moment(calendar.rawValue).add(1, 'month');
            var nextMonth = nextMonthRawValue.month() + 1;
            var nextYear = nextMonthRawValue.year();

            // 当前值是否在日历范围最后一个月
            var inLastMonth = moment(rawValue).format('YYYY-MM')
                              === moment(monthViewRanges.nextRange.end).format('YYYY-MM');

            if (!inLastMonth) {
                // 如果不在，那么左边日历赋当前值，右边日历需要加一个月

                nextMonthView && nextMonthView.setProperties({
                    range: monthViewRanges.nextRange,
                    month: nextMonth,
                    year: nextYear
                });

                prevMonthView && prevMonthView.setProperties({
                    rawValue: rawValue,
                    range: monthViewRanges.prevRange
                });
            }
            else {
                // 如果在，那么左边日历保持不变，右边日历赋当前值

                nextMonthView && nextMonthView.setProperties({
                    range: monthViewRanges.nextRange,
                    rawValue: rawValue
                });

                prevMonthView && prevMonthView.setProperties({
                    rawValue: rawValue,
                    year: moment(calendar.rawValue).year(),
                    month: moment(calendar.rawValue).month()
                });
            }

        }

        /**
         * 获取双日历两个日历的日历范围
         *
         * @param  {{begin:Date,end:Date}} range 初始日历范围
         * @return {{prevRange:Object,nextRange:Object}} 包含两个日历范围的对象
         * @inner
         */
        function getMonthViewRange(range) {
            var ranges = {};
            var startDate = moment(range.begin).endOf('month').toDate();
            startDate.setDate(startDate.getDate() + 1);

            var endDate = moment(range.end).startOf('month').toDate();
            endDate.setDate(endDate.getDate() - 1);

            var prevRange = {
                begin: range.begin,
                end: endDate
            };

            var nextRange = {
                begin: startDate,
                end: range.end
            };

            ranges.prevRange = prevRange;
            ranges.nextRange = nextRange;
            return ranges;
        }

        /**
         * 改变左侧日历的月份
         *
         * @event
         * @param {Object} e 事件对象
         * @param {MonthView} e.target 当前改变月份MonthView对象
         * @ignore
         */
        function changePrevMonth(e) {

            var multiCalendar = this;
            var prevMonthView = e.target;
            var nextMonthView = multiCalendar.getChild('nextMonthView');

            var year = prevMonthView.year;
            var month = prevMonthView.month + 1;
            var m = moment(year + '-' + month, 'YYYY-MM').add(1, 'month');

            nextMonthView && nextMonthView.setProperties({
                year: m.year(),
                month: m.month() + 1
            });
        }

        /**
         * 改变右侧日历的月份
         *
         * @event
         * @param {Object} e 事件对象
         * @param {MonthView} e.target 当前改变月份MonthView对象
         * @ignore
         */
        function changeNextMonth(e) {

            var multiCalendar = this;
            var nextMonthView = e.target;
            var prevMonthView = multiCalendar.getChild('prevMonthView');
            var m = moment(nextMonthView.year + '-' + nextMonthView.month, 'YYYY-MM');

            prevMonthView.setProperties({
                year: m.year(),
                month: m.month() + 1
            });
        }

        /**
         * 更新显示的文字
         *
         * @param {Calendar} calendar 控件实例
         * @ignore
         */
        function updateDisplayText(calendar) {
            // 更新主显示
            var textHolder = calendar.helper.getPart('text');
            if (textHolder) {
                textHolder.innerHTML = u.escape(
                    moment(calendar.getRawValue()).format(calendar.displayFormat)
                );
            }
        }

        esui.register(Calendar);
        return Calendar;
    }
);
