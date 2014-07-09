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
        var ui = require('./main');
        var InputControl = require('./InputControl');
        var Layer = require('./Layer');

        /**
         * 日历用浮层
         *
         * @extends Layer
         * @ignore
         * @constructor
         */
        function CalendarLayer() {
            Layer.apply(this, arguments);
        }

        lib.inherits(CalendarLayer, Layer);

        CalendarLayer.prototype.render = function (element) {
            document.body.appendChild(element);
            element.innerHTML = '<div data-ui-type="MonthView" '
                + 'data-ui-child-name="monthView"></div>';

            var calendar = this.control;
            calendar.helper.initChildren(element);

            var monthView = calendar.getChild('monthView');
            monthView.setProperties(
                { 'rawValue': calendar.rawValue, 'range': calendar.range });
            monthView.on('change', syncMonthViewValue, calendar);


            if (calendar.autoHideLayer) {
                monthView.on(
                    'itemclick',
                    u.bind(calendar.layer.toggle, calendar.layer)
                );
            }
        };

        CalendarLayer.prototype.toggle = function () {
            var element = this.getElement();
            if (!element
                || this.control.helper.isPart(element, 'layer-hidden')
            ) {
                // 展示之前先跟main同步
                var calendar = this.control;
                var monthView = calendar.getChild('monthView');
                monthView.setProperties(
                    { 'rawValue': calendar.rawValue, 'range': calendar.range }
                );
                this.show();
            }
            else {
                this.hide();
            }
        };

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
        function Calendar() {
            InputControl.apply(this, arguments);
            this.layer = new CalendarLayer(this);
        }

        /**
         * 更新显示
         *
         * @param {MonthView} monthView MonthView控件实例
         * @ignore
         */
        function syncMonthViewValue() {
            var monthView = this.getChild('monthView');
            var date = monthView.getRawValue();

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
             * @member Calendar
             */
            this.fire('change');
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
            textHolder.innerHTML = u.escape(calendar.getValue());
        }

        Calendar.prototype = {
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
                     * @property {Date} [rawValue]
                     *
                     * 控件的原始值，为`Date`类型，默认为当天
                     *
                     * @override
                     */
                    rawValue: now,
                    // 是否点击自动关闭弹层
                    autoHideLayer: false
                };

                if (options.autoHideLayer === 'false') {
                    options.autoHideLayer = false;
                }

                u.extend(properties, options);

                if (lib.isInput(this.main)) {
                    this.helper.extractOptionsFromInput(this.main, properties);
                }

                // parseValue 需要用到 paramFormat
                this.paramFormat = properties.paramFormat;

                if (properties.value) {
                    properties.rawValue = this.parseValue(properties.value);
                }

                // 类型如果是string
                var range = properties.range;
                if (typeof range === 'string') {
                    var beginAndEnd = range.split(',');
                    var begin = this.parseValue(beginAndEnd[0]);
                    var end = this.parseValue(beginAndEnd[1]);
                    properties.range = { begin: begin, end: end };

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
                if (lib.isInput(this.main)) {
                    this.helper.replaceMain();
                }

                var template = [
                    '<div class="${classes}" id="${id}">${value}</div>',
                    '<div class="${arrow}"></div>'
                ];

                this.main.innerHTML = lib.format(
                    template.join(''),
                    {
                        classes: this.helper.getPartClassName('text'),
                        id: this.helper.getId('text'),
                        arrow: this.helper.getPartClassName('arrow')
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
            repaint: require('./painters').createRepaint(
                InputControl.prototype.repaint,
                {
                    /**
                     * @property {meta.DateRange} range
                     *
                     * 指定控件可选的时间段
                     */
                    name: ['rawValue', 'range'],
                    paint: function (calendar, rawValue, range) {
                        if (calendar.disabled || calendar.readOnly) {
                            return;
                        }

                        updateDisplayText(calendar);

                        // if (calendar.layer) {
                        // 更新日历
                        var monthView = calendar.getChild('monthView');
                        if (monthView) {
                            monthView.setProperties({
                                rawValue: rawValue,
                                range: range
                            });
                        }
                        // }

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
                this.setProperties({ 'range': range });
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

                if (this.layer) {
                    this.layer.dispose();
                    this.layer = null;
                }

                InputControl.prototype.dispose.apply(this, arguments);
            }
        };

        lib.inherits(Calendar, InputControl);
        ui.register(Calendar);

        return Calendar;
    }
);
