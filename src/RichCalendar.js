/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 无限区间日历
 * @author dbear
 */

define(
    function (require) {
        require('./Button');
        require('./MonthView');
        require('./TextBox');


        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');
        var ui = require('./main');
        var m = require('moment');

        /**
         * 控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function RichCalendar(options) {
            InputControl.apply(this, arguments);
        }

        /**
         * 搭建弹出层内容
         *
         * @param {RichCalendar} calendar RichCalendar控件实例
         * @return {string}
         */
        function getLayerHtml(calendar) {
            var displayNum = calendar.displayNum;
            var monthViewContainerTpl = ''
                + '<div id="${id}" class="${className}">${monthView}</div>';
            var monthViews = [];
            for (var i = 0; i < displayNum; i++) {
                monthViews.push(
                    lib.format(
                        monthViewContainerTpl,
                        {
                            id: helper.getId(calendar, 'month-' + i),
                            className:
                                helper.getPartClasses(
                                    calendar, 'month-container'
                                ),
                            monthView: getCalendarHtml(calendar, i)
                        }
                    )
                );
            }
            return monthViews.join('');
        }



        /**
         * 搭建单个日历
         *
         * @param {RichCalendar} calendar RichCalendar控件实例
         * @param {string} type 日历类型 begin|end
         * @return {string}
         */
        function getCalendarHtml(calendar, index) {
            var tpl = ''
                + '<div'
                + ' data-ui-type="MonthView"'
                + ' data-ui-child-name="${calName}"'
                + ' data-ui-mode="multi">'
                + '</div>';

            return lib.format(tpl, {
                calName: 'monthView' + index
            });
        }

        /**
         * 显示下拉弹层
         *
         * @param {RichCalendar} calendar RichCalendar控件实例
         */
        function showLayer(calendar) {
            var layer = calendar.layer;
            layer.style.zIndex = helper.layer.getZIndex(calendar.main);
            helper.layer.attachTo(
                layer,
                calendar.main,
                { top: 'bottom', left: 'left', spaceDetection: 'both' }
            );
            helper.removePartClasses(calendar, 'layer-hidden', calendar.layer);
            calendar.addState('active');
        }

        /**
         * 隐藏下拉弹层
         *
         * @param {RichCalendar} calendar RichCalendar控件实例
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
         * @inner
         * @param {RichCalendar} calendar RichCalendar控件实例
         * @param {Event} 触发事件的事件对象
         */
        function closeLayer(e) {
            var tar = e.target || e.srcElement;
            while (tar && tar != document.body) {
                if (tar == this.layer) {
                    return;
                }
                var button = this.getChild('modifyBtn').main;
                if (tar == button) {
                    return;
                }
                tar = tar.parentNode;
            }
            hideLayer(this);
        }


        /**
         * 打开下拉弹层
         *
         * @inner
         * @param {RichCalendar} calendar RichCalendar控件实例
         */
        function openLayer(calendar) {
            var layer = calendar.layer;
            if (!layer) {
                layer = helper.layer.create('div');
                helper.addPartClasses(calendar, 'layer', layer);
                layer.innerHTML = getLayerHtml(calendar);
                calendar.layer = layer;
                hideLayer(calendar);
                document.body.appendChild(layer);
                // 创建控件树
                calendar.initChildren(layer);
            }
            // 渲染日历集
            paintCals(calendar, true);
            showLayer(calendar);
        }

        function syncValueOfMonthViews(calendar, index) {
            // 要把其他的日历也同步为相同的值
            var rawValue = this.getRawValue();
            var displayNum = calendar.displayNum;
            for (var i = 0; i < displayNum; i++) {
                if (i !== index) {
                    var monthView = calendar.getChild('monthView' + i);
                    // 这里直接赋值是因为不想触发这些日历的change事件
                    // 而且因为只是同步rawValue，不需要重绘页面
                    monthView.setRawValueWithoutFireChange(rawValue);

                }
            }
            calendar.rawValue = rawValue;
            updateMain(calendar, rawValue);
        }

        function updateMonthOrYear(calendar, index) {
            // 要把其他的日历也同步为相同的值
            var displayNum = calendar.displayNum;
            var syncDate = new Date(this.year, this.month, 1);
            for (var i = 0; i < displayNum; i++) {
                if (i !== index) {
                    var monthView = calendar.getChild('monthView' + i);
                    // 这里要先解绑那些yearchange事件，防止死循环
                    monthView.un('changemonth');
                    monthView.un('changeyear');
                    var scope = (index - i);
                    var newDate;
                    if (scope > 0) {
                        newDate = m(syncDate).subtract('month', scope);
                    }
                    else {
                        newDate = m(syncDate).add('month', -scope);
                    }
                    monthView.setProperties({
                        month: newDate.month() + 1,
                        year: newDate.year()
                    });

                    // 再绑回来
                    monthView.on(
                        'changeyear',
                        lib.curry(updateMonthOrYear, calendar, i)
                    );
                    monthView.on(
                        'changemonth',
                        lib.curry(updateMonthOrYear, calendar, i)
                    );
                }
            }
        }


        function paintCals(calendar, bindEvent) {
            var displayNum = calendar.displayNum;
            var startMonth = calendar.startMonth;
            var startYear = calendar.startYear;
            for (var i = 0; i < displayNum; i++) {
                // 第n个日历的range的开始时间是实际开始时间加n个月
                // 第n个日历的range的结束时间是实际结束时间减n个月
                var rangeBegin = calendar.range.begin;
                var rangeEnd = calendar.range.end;
                var rangeBeginYear = rangeBegin.getFullYear();
                var rangeBeginMonth = rangeBegin.getMonth();
                var rangeEndYear = rangeEnd.getFullYear();
                var rangeEndMonth = rangeEnd.getMonth();
                var trueRange;
                var realEnd;
                var realBegin;
                if (i === 0) {
                    realEnd = new Date(
                        rangeEndYear, rangeEndMonth - displayNum + 2, 0
                    );
                    trueRange = {
                        begin: calendar.range.begin,
                        end: realEnd
                    };
                }
                else if (i == (displayNum - 1)) {
                    realBegin = new Date(
                        rangeBeginYear, rangeBeginMonth + displayNum - 1, 1
                    );
                    trueRange = {
                        begin: realBegin,
                        end: calendar.range.end
                    };
                }
                else {
                    realBegin = new Date(
                        rangeBeginYear, rangeBeginMonth + i, 1
                    );

                    realEnd = new Date(
                        rangeEndYear, rangeEndMonth - displayNum - i + 2, 0
                    );
                    trueRange = {
                        begin: realBegin,
                        end: realEnd
                    };
                }
                var options = {
                    year: startYear,
                    month: startMonth + i,
                    rawValue: calendar.rawValue,
                    range: calendar.range,
                    viewRange: trueRange
                };
                paintCal(calendar, options, i, bindEvent);
            }
        }

        /**
         * 初始化开始和结束日历
         *
         * @inner
         * @param {RichCalendar} calendar RichCalendar控件实例
         * @param {string} type 日历类型
         * @param {Date} value 日期
         * @param {boolean} bindEvent 是否需要绑定事件
         */
        function paintCal(calendar, options, index, bindEvent) {
            var monthView = calendar.getChild('monthView' + index);
            monthView.setProperties(options);
            if (bindEvent === true) {
                monthView.on(
                    'change',
                    lib.curry(syncValueOfMonthViews, calendar, index)
                );
                monthView.on(
                    'changeyear',
                    lib.curry(updateMonthOrYear, calendar, index)
                );
                monthView.on(
                    'changemonth',
                    lib.curry(updateMonthOrYear, calendar, index)
                );
            }
        }

        /**
         * 更新主显示
         *
         * @inner
         * @param {RichCalendar} calendar RichCalendar控件实例
         * @param {Array} value 外部设置的日期
         */
        function updateMain(calendar, value) {
            var inputId = helper.getId(calendar, 'param-value');
            lib.g(inputId).value = calendar.stringifyValue(value);
            var textInput = calendar.getChild('textInput');
            var textValue = getValueText(calendar, value);
            textInput.setProperties({
                rawValue: textValue
            });
            // 更新总日期数信息
            updateTotalInfo(calendar, value);
            calendar.fire('change');
        }

        function updateTotalInfo(calendar, rawValue) {
            var totalNum = lib.g(helper.getId(calendar, 'total-num'));
            totalNum.innerHTML = rawValue.length;
        }

        /**
         * 清空数据
         *
         * @inner
         * @param {RichCalendar} calendar RichCalendar控件实例
         */
        function deleteAll(calendar) {
            calendar.set('rawValue', []);
        }

        /**
         * 根据下拉弹层当前状态打开或关闭之
         *
         * @inner
         * @param {RichCalendar} calendar RichCalendar控件实例
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
                    openLayer(calendar);
                }
                else {
                    hideLayer(calendar);
                }
            }
        }

        /**
         * 将字符串转换成对象型rawValue
         *
         * @inner
         * @param {string} value 20110301222222,20110401235959
         * @return {{begin:Date,end:Date}=}
         */
        function convertToRaw(value) {
            var strDates = value.split(',');
            // 可能会只输入一个，默认是begin
            if (strDates.length === 1) {
                strDates.push('2046-11-04');
            }
            // 第一个是空的
            else if (strDates[0] === ''){
                strDates[0] = '1983-09-03';
            }
            // 第二个是空的
            else if (strDates[1] === ''){
                strDates[1] = '2046-11-04';
            }

            return {
                begin: parseToDate(strDates[0]),
                end: parseToDate(strDates[1])
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

            if (!dateStr) {
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
         * 获取当前选中日期区间的最终显示字符（含概要展示）
         *
         * @param {RichCalendar} calendar RichCalendar控件实例
         * @param {Array} rawValue 外部设置的日期
         * @return {string}
         */
        function getValueText(calendar, rawValue) {
            var dateStrs = [];
            var tempDate = [];
            var tempIndex = 0;
            var oneDay = 86400000;
            for (var i = 0; i < rawValue.length; i ++) {
                if (i === 0) {
                    dateStrs.push(
                        lib.date.format(rawValue[i], calendar.paramFormat)
                    );
                    tempDate.push(rawValue[i]);
                    tempIndex++;
                }
                else {
                    // 已跨越
                    if ((rawValue[i] - rawValue[i-1]) > oneDay) {
                        // 只一天
                        if ((rawValue[i-1] - tempDate[tempIndex-1]) !== 0) {
                            dateStrs.push('至');
                            dateStrs.push(
                                lib.date.format(
                                    rawValue[i-1], calendar.paramFormat
                                )
                            );
                            tempDate.push(rawValue[i-1]);
                            tempIndex++;
                        }
                        dateStrs.push('\n');
                        dateStrs.push(
                            lib.date.format(
                                rawValue[i], calendar.paramFormat
                            )
                        );
                        tempDate.push(rawValue[i]);
                        tempIndex++;
                    }
                    else if (i == (rawValue.length - 1)) {
                        dateStrs.push('至');
                        dateStrs.push(
                            lib.date.format(
                                rawValue[i], calendar.paramFormat
                            )
                        );
                    }
                    else {
                        continue;
                    }
                }
            }
            return dateStrs.join('');
        }

        /**
         * 实时同步键盘输入与Raw数据
         *
         * @param {RichCalendar} calendar RichCalendar控件实例
         * @return {string}
         */
        function updateRawValueByTyping(calendar) {
            var textInputValue = this.getValue();
            var items = textInputValue.replace(/\n{2,}/g, '\n').split('\n');
            var result = [];
            var container = {};
            var invalid = false;
            for (var i = 0, len = items.length; i < len; i++) {
                var item = lib.trim(items[i]);
                if (item.length === 0 || container[item]) {
                    continue;
                }
                container[item] = 1;
                var beginEnd = item.split('至');
                var begin = beginEnd[0];
                var end = begin;
                if (beginEnd.length > 1) {
                    end = beginEnd[1];
                }
                // 需要判断合法性
                if (isDate(begin) && isDate(end)) {
                    result.push(begin);
                    result.push(end);
                }
                else {
                    invalid = true;
                }
            }
            var value = result.join(',');
            calendar.rawValue = calendar.parseValue(value);
            // 有可能有需要合并或修正的
            this.setProperties({
                rawValue: getValueText(calendar, calendar.rawValue)
            });
            calendar.fire('change');
        }

        /**
         * 是否是合法格式时间
         *
         * @param {string} date 待校验时间串
         * @return {boolean}
         */
        function isDate(date) {
            var reg = /^(\d{4})(-)(\d{2})\2(\d{2})$/;
            var r = date.match(reg);
            if (r == null) {
                return false;
            }
            var d= new Date(r[1], r[3]-1, r[4]);
            var newStr = ''
                + d.getFullYear()
                + r[2]
                + (d.getMonth() + 1)
                + r[2]
                + d.getDate();
            date = r[1] + r[2] + ((r[3] - 1) + 1) + r[2] + ((r[4] - 1) + 1);
            return newStr==date;
        }

        RichCalendar.prototype = {
            /**
             * 控件类型
             *
             * @type {string}
             */
            type: 'RichCalendar',

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                var now = new Date();
                /**
                 * 默认选项配置
                 */
                var properties = {
                    now: now,
                    range: {
                        begin: new Date(1983, 8, 3),
                        end: new Date(2046, 10, 4)
                    },
                    paramFormat: 'YYYY-MM-DD',
                    rawValue: [],
                    displayNum: 2,
                    startYear: now.getFullYear(),
                    startMonth: now.getMonth() + 1
                };

                helper.extractValueFromInput(this, options);

                if (options.range && typeof options.range === 'string') {
                    options.range = convertToRaw(options.range);
                }

                lib.extend(properties, options);
                this.setProperties(properties);
            },


            setProperties: function (properties) {
                // 如果么设置rawValue
                if (properties.rawValue == null
                    || properties.rawValue.length === 0) {
                    // 从value转
                    if (properties.value) {
                        properties.rawValue = this.parseValue(properties.value);
                    }
                }

                // 初始化显示年月
                // 如果设置rawValue，则取rawValue的第一个为起始年月
                if (properties.rawValue && properties.rawValue.length) {
                    var startDate = properties.rawValue[0];
                    properties.startYear = startDate.getFullYear();
                    properties.startMonth = startDate.getMonth() + 1;
                }

                var changes =
                    InputControl.prototype.setProperties.apply(this, arguments);

                return changes;
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             */
            initStructure: function () {
                // 如果主元素是输入元素，替换成`<div>`
                // 如果输入了非块级元素，则不负责
                if (lib.isInput(this.main)) {
                    helper.replaceMain(this);
                }

                var tpl = [
                    '<div class="${className}" id="${id}">',
                      '<textarea data-ui-type="TextBox"',
                      ' data-ui-mode="textarea"',
                      ' data-ui-height="100"',
                      ' data-ui-child-name="textInput"></textarea>',
                      '<div data-ui-type="Panel" class="${generalPanelClass}"',
                      ' data-ui-child-name="generalPanel">',
                          '共<span id="${totalNumId}" ',
                          'class="${totalNumClass}"></span>天,',
                          '<span data-ui-type="Button" data-ui-skin="link"',
                          ' data-ui-child-name="deleteBtn">全部删除</span>',
                      '</div>',
                      '<div data-ui-type="Button" data-ui-skin="calendar"',
                      ' data-ui-child-name="modifyBtn">修改时间</div>',
                    '</div>',
                    '<input type="hidden" id="${inputId}" name="${name}"',
                    ' value="" />'
                ];

                var getClass = helper.getPartClasses;
                this.main.innerHTML = lib.format(
                    tpl.join('\n'),
                    {
                        className: getClass(this, 'text').join(' '),
                        id: helper.getId(this, 'text'),
                        name: this.name,
                        inputId: helper.getId(this, 'param-value'),
                        generalPanelClass:
                            getClass(this, 'general-info').join(' '),
                        totalNumId: helper.getId(this, 'total-num'),
                        totalNumClass: getClass(this, 'total-num').join(' ')
                    }
                );

                this.initChildren(this.main);
            },

            /**
             * 初始化事件交互
             *
             * @protected
             * @override
             */
            initEvents: function () {
                var modifyBtn = this.getChild('modifyBtn');
                modifyBtn.on('click', lib.curry(toggleLayer, this));

                var deleteAllBtn = this.getChild('generalPanel').getChild('deleteBtn');
                deleteAllBtn.on('click', lib.curry(deleteAll, this));

                var textInput = this.getChild('textInput');
                textInput.on('blur', lib.curry(updateRawValueByTyping, this));

                helper.addDOMEvent(this, document, 'mousedown', closeLayer);
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: helper.createRepaint(
                InputControl.prototype.repaint,
                {
                    name: ['rawValue', 'range'],
                    paint: function (calendar, rawValue, range) {
                        if (range) {
                            if (typeof range === 'string') {
                                range = convertToRaw(range);
                            }
                            // 还要支持只设置begin或只设置end的情况
                            if (!range.begin) {
                                // 设置一个特别远古的年
                                range.begin = new Date(1983, 8, 3);
                            }
                            else if (!range.end) {
                                // 设置一个特别未来的年
                                range.end = new Date(2046, 10, 4);
                            }
                            calendar.range = range;
                        }
                        if (rawValue) {
                            updateMain(calendar, rawValue);
                        }
                        if (calendar.layer) {
                            paintCals(calendar);
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
             * @param {*} rawValue 原始值，就是包含了区段中的所有日期的数组
             * @return {string}
             */
            stringifyValue: function (rawValue) {
                var dateStrs = [];
                var oneDay = 86400000;
                for (var i = 0; i < rawValue.length; i ++) {
                    // 开个头
                    if (i === 0) {
                        dateStrs.push(
                            lib.date.format(rawValue[i], this.paramFormat)
                        );
                    }
                    else {
                        // 间隔超过1天，说明已中断，则
                        if ((rawValue[i] - rawValue[i-1]) > oneDay) {
                            // 1. 为前一段时间画结尾
                            dateStrs.push(
                                lib.date.format(
                                    rawValue[i-1], this.paramFormat
                                )
                            );
                            // 2. 为下一段开头
                            dateStrs.push(
                                lib.date.format(
                                    rawValue[i], this.paramFormat
                                )
                            );
                        }
                    }
                    // 已到最后一个数据，无论如何都要收尾了
                    if (i === (rawValue.length - 1)) {
                        dateStrs.push(
                            lib.date.format(
                                rawValue[i], this.paramFormat
                            )
                        );
                    }
                }
                return dateStrs.join(',');
            },

            /**
             * 获得
             * [{ begin: xxx, end: xxx }, { begin: xxx, end: xxx }]
             * 形式的数据
             *
             * @return {array}
             */
            getRanges: function () {
                var rawValue = this.rawValue;
                var dateStrs = this.stringifyValue(rawValue).split(',');
                var range = [];
                for (var i = 0; i < dateStrs.length - 1; i += 2) {
                    var begin = parseToDate(dateStrs[i]);
                    var end = parseToDate(dateStrs[i + 1]);
                    range.push({
                        begin: begin,
                        end: end
                    });
                }
                return range;
            },

            /**
             * 将
             * [{ begin: xxx, end: xxx }, { begin: xxx, end: xxx }]
             * 型值转成raw形式
             * @param {Array} rangeValue
             */
            setRanges: function (rangeValue) {
                var dates = {};
                for (var i = 0; i < rangeValue.length; i ++) {
                    var begin = rangeValue[i].begin;
                    var end = rangeValue[i].end;
                    var temp;
                    if (!begin || !end) {
                        continue;
                    }
                    if (begin - end === 0) {
                        dates[begin] = begin;
                    } else {
                        temp = begin;
                        while (temp <= end) {
                            dates[temp] = temp;
                            temp = new Date(
                                temp.getFullYear(),
                                temp.getMonth(),
                                temp.getDate() + 1
                            );
                        }
                    }
                }
                var rawDates = [];
                for(var key in dates) {
                    rawDates.push(dates[key]);
                }
                rawDates.sort(function (a, b) {
                    return a - b;
                });

                this.set('rawValue', rawDates);
            },

            /**
             * 将string类型的value转换成原始格式
             *
             * @param {string} value 字符串值
             * @return {Array}
             */
            parseValue: function (value) {
                var dateStrs = value.split(',');
                var dates = {};
                for (var i = 0; i < dateStrs.length - 1; i += 2) {
                    var begin = parseToDate(dateStrs[i]);
                    var end = parseToDate(dateStrs[i + 1]);
                    var temp;
                    if (!begin || !end) {
                        continue;
                    }
                    if (begin - end === 0) {
                        dates[begin] = begin;
                    } else {
                        temp = begin;
                        while (temp <= end) {
                            dates[temp] = temp;
                            temp = new Date(
                                temp.getFullYear(),
                                temp.getMonth(),
                                temp.getDate() + 1
                            );
                        }
                    }
                }
                var rawDates = [];
                for(var key in dates) {
                    rawDates.push(dates[key]);
                }
                rawDates.sort(function (a, b) {
                    return a - b;
                });
                return rawDates;
            },

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

        lib.inherits(RichCalendar, InputControl);
        ui.register(RichCalendar);

        return RichCalendar;
    }
);
