/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 日历
 * @author dbear
 */
define(
    function (require) {
        require('./MonthView');

        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');
        var ui = require('./main');

        /**
         * 日历控件
         *
         * 日历控件是由一个按钮和一个浮层组成的，如果你只需要显示一个月日期的效果，
         * 请使用{@link MonthView}控件
         *
         * @extends InputControl
         * @constructor
         */
        function Calendar() {
            InputControl.apply(this, arguments);
        }

               
        /**
         * 显示下拉弹层
         *
         * @param {Calendar} calendar 控件实例
         * @ignore
         */
        function showLayer(calendar) {
            var layer = calendar.layer;
            layer.style.zIndex = helper.layer.getZIndex(calendar.main);
            helper.layer.attachTo(
                layer, 
                calendar.main, 
                { 
                    top: 'bottom',
                    left: 'left',
                    right: 'right',
                    spaceDetection: 'vertical'
                }
            );
            helper.removePartClasses(calendar, 'layer-hidden', layer);
            calendar.addState('active');
        }

        /**
         * 隐藏下拉弹层
         *
         * @param {Calendar} calendar Calendar控件实例
         * @ignore
         */
        function hideLayer(calendar) {
            if (calendar.layer) {
                helper.addPartClasses(calendar, 'layer-hidden', calendar.layer);
                calendar.removeState('active');
            }

        }

        /**
         * 点击自动隐藏的处理
         *
         * @param {Event} 触发事件的事件对象
         * @ignore
         */
        function closeLayer(e) {
            if (this.isHidePrevent) {
                this.isHidePrevent = 0;
                return;
            }
            var tar = lib.event.getTarget(e);
            while (tar && tar != document.body) {
                if (tar == this.layer) {
                    return;
                }
                tar = tar.parentNode;
            }
            hideLayer(this);
        }


        /**
         * 打开下拉弹层
         *
         * @param {Calendar} calendar Calendar控件实例
         * @ignore
         */
        function openLayer(calendar) {
            var layer = calendar.layer;
            if (!layer) {
                layer = helper.layer.create('div');
                layer.className = 
                    helper.getPartClasses(calendar, 'layer').join(' ');
                layer.innerHTML =
                    '<div data-ui="type:MonthView;childName:monthView;"/>';
                calendar.layer = layer;
                hideLayer(calendar);
                document.body.appendChild(layer);

                // 创建控件树
                calendar.initChildren(layer);

                var monthView = calendar.getChild('monthView');
                monthView.setProperties({
                    'rawValue': calendar.rawValue,
                    'range': calendar.range
                });
                monthView.on(
                    'change',
                    lib.bind(updateDisplay, null, calendar, monthView)
                );
            }
            showLayer(calendar);
        }

        /**
         * 主元素点击事件
         *
         * @param {Calendar} this Calendar控件实例
         * @param {Event} e 触发事件的事件对象
         * @ignore
         */
        function mainClick(e) {
            if (!this.disabled) {
                this.isHidePrevent = 1;
                toggleLayer(this);
            }
        }


        /**
         * 更新显示
         *
         * @param {Calendar} calendar 控件实例
         * @param {MonthView} monthView MonthView控件实例
         * @ignore
         */
        function updateDisplay(calendar, monthView) {
            var date = monthView.getRawValue();
            if (!date) {
                return;
            }
            calendar.rawValue = date;
            updateMain(calendar);
            /**
             * @event change
             *
             * 值发生变化时触发
             *
             * @member Calendar
             */
            calendar.fire('change', date); // 以后别传值出去
        }

        /**
         * 更新主显示
         *
         * @param {Calendar} calendar Calendar控件实例
         * @ignore
         */
        function updateMain(calendar) {
            var date = calendar.rawValue;
            var textId = helper.getId(calendar, 'text');
            var inputId = helper.getId(calendar, 'param-value');
            lib.g(textId).innerHTML =
                lib.date.format(date, calendar.dateFormat);
            lib.g(inputId).value =
                lib.date.format(date, calendar.paramFormat);
        }

        /**
         * 根据下拉弹层当前状态打开或关闭之
         *
         * @param {Calendar} calendar Calendar控件实例
         * @ignore
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
         * 字符串日期转换为Date对象
         *
         * @param {string} dateStr 字符串日期
         * @ignore
         */
        function parseToDate(dateStr) {
            // 2011-11-04
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
                    rawValue: now
                };

                helper.extractValueFromInput(this, options);

                lib.extend(properties, options);

                if (properties.value) {
                    properties.rawValue = parseToDate(properties.value);
                }

                // 类型如果是string
                var range = properties.range;
                if (typeof range === 'string') {
                    var beginAndEnd = range.split(',');
                    var begin = parseToDate(beginAndEnd[0]);
                    var end = parseToDate(beginAndEnd[1]);
                    properties.range = {
                        begin: begin,
                        end: end
                    };

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
                    helper.replaceMain(this);
                }
                
                var date = this.getRawValue();
                var tpl = [
                    '<div class="${className}" id="${id}">${value}</div>',
                    '<div class="${arrow}"></div>',
                    '<input type="hidden" id="${inputId}" name="${name}"',
                    ' value="${paramValue}" />'
                ];

                this.main.innerHTML = lib.format(
                    tpl.join('\n'),
                    {
                        className:
                            helper.getPartClasses(this, 'text').join(' '),
                        id: helper.getId(this, 'text'),
                        value: lib.date.format(date, this.dateFormat),
                        arrow: helper.getPartClasses(this, 'arrow').join(' '),
                        name: this.name,
                        paramValue: lib.date.format(date, this.paramFormat),
                        inputId: helper.getId(this, 'param-value')
                    }
                );

                helper.addDOMEvent(this, this.main, 'mousedown', mainClick);

                helper.addDOMEvent(this, document, 'mousedown', closeLayer);
            },

            /**
             * 创建控件主元素，默认使用`<div>`元素
             *
             * @return {HTMLElement}
             * @protected
             * @override
             */
            createMain: function (options) {
                return document.createElement('div');
            },

            /**
             * 重渲染
             *
             * @method
             * @protected
             * @override
             */
            repaint: helper.createRepaint(
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
                        // 更新主显示
                        updateMain(calendar);
                        if (calendar.layer) {
                            // 更新日历
                            var monthView = calendar.getChild('monthView');
                            monthView.setProperties({
                                rawValue: rawValue,
                                range: range
                            });
                        }

                    }
                },
                {
                    name: ['disabled', 'hidden', 'readOnly'],
                    paint: function (calendar, disabled, hidden, readOnly) {
                        if (disabled || hidden || readOnly) {
                            hideLayer(calendar);
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
                return lib.date.format(rawValue, this.paramFormat) || null;
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
                return parseToDate(value);
            },

            /**
             * 销毁
             *
             * @override
             */
            dispose: function () {
                if (helper.isInStage(this, 'DISPOSED')) {
                    return;
                }
                
                var layer = this.layer;
                if (layer) {
                    layer.parentNode.removeChild(layer);
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
