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
        require('./CheckBox');
        require('./Label');

        var lib = require('./lib');
        var InputControl = require('./InputControl');
        var helper = require('./controlHelper');
        var Layer = require('./Layer');
        var ui = require('./main');
        var m = require('moment');
        var u = require('underscore');

        /**
         * 日历用浮层
         *
         * @extends Layer
         * @ignore
         * @constructor
         */
        function RangeCalendarLayer() {
            Layer.apply(this, arguments);
        }

        lib.inherits(RangeCalendarLayer, Layer);

        RangeCalendarLayer.prototype.render = function (element) {
            var calendar = this.control;
            document.body.appendChild(element);
            element.innerHTML = getLayerHtml(calendar);
            calendar.helper.initChildren(element);

            // 为mini日历绑定点击事件
            var shortcutDom = calendar.helper.getPart('shortcut');
            helper.addDOMEvent(
                calendar, shortcutDom, 'click', shortcutClick);
            // 渲染开始结束日历
            paintCal(calendar, 'begin', calendar.view.begin, true);
            paintCal(calendar, 'end', calendar.view.end, true);


            // 渲染mini日历
            var selectedIndex = getSelectedIndex(calendar, calendar.view);
            paintMiniCal(calendar, selectedIndex);

            // 绑定“无限结束”勾选事件
            var endlessCheck = calendar.getChild('endlessCheck');
            if (endlessCheck) {
                endlessCheck.on(
                    'change',
                    lib.curry(makeCalendarEndless, calendar)
                );
                // 设置endless
                if (calendar.isEndless) {
                    endlessCheck.setChecked(true);
                    calendar.helper.addPartClasses(
                        'shortcut-disabled',
                        calendar.helper.getPart(calendar)
                    );
                }
            }

            // 绑定提交和取消按钮
            var okBtn = calendar.getChild('okBtn');
            okBtn.on('click', lib.curry(commitValue, calendar));

            var cancelBtn = calendar.getChild('cancelBtn');
            cancelBtn.on(
                'click',
                u.bind(calendar.layer.hide, calendar.layer)
            );
            // 关闭按钮
            var closeBtn = calendar.getChild('closeBtn');
            closeBtn.on(
                'click',
                u.bind(calendar.layer.hide, calendar.layer)
            );
        };

        RangeCalendarLayer.prototype.toggle = function () {
            var element = this.getElement();
            if (!element
                || this.control.helper.isPart(element, 'layer-hidden')
            ) {
                // 展示之前先跟main同步
                var calendar = this.control;
                paintLayer(calendar, calendar.rawValue);
                this.show();
            }
            else {
                this.hide();
            }
        };

        /**
         * 重绘弹出层数据
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {{begin:Date,end:Date}=} value 显示的日期
         */
        function paintLayer(calendar, value) {
            calendar.view.begin = value.begin;
            calendar.view.end = value.end;
            calendar.value = calendar.convertToParam(value);

            paintCal(calendar, 'begin', value.begin);
            paintCal(calendar, 'end', value.end);

            var selectedIndex = getSelectedIndex(calendar, calendar.view);
            paintMiniCal(calendar, selectedIndex);

            var isEndless;
            if (!value.end) {
                isEndless = true;
            }
            else {
                isEndless = false;
            }
            calendar.setProperties({ isEndless: isEndless });
        }

        /**
         * 控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function RangeCalendar(options) {
            this.now = new Date();
            InputControl.apply(this, arguments);
            this.layer = new RangeCalendarLayer(this);
        }

        /**
         * 搭建弹出层内容
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @return {string}
         */
        function getLayerHtml(calendar) {
            var tpl = ''
                + '<div class="${shortCutClass}" id="${shortcutId}">'
                + '${shortCut}</div>'
                + '<div class="${bodyClass}">'
                +   '${beginCalendar}${endCalendar}'
                + '</div>'
                + '<div class="${footClass}">'
                +   '<div class="${okBtnClass}"'
                +   ' data-ui="type:Button;childName:okBtn;">确定</div>'
                +   '<div class="${cancelBtnClass}"'
                +   ' data-ui="type:Button;childName:cancelBtn;">取消</div>'
                + '</div>'
                + '<div data-ui="type:Button;childName:'
                + 'closeBtn;skin:layerClose;height:12;"></div>';

            return lib.format(tpl, {
                bodyClass: calendar.helper.getPartClassName('body'),
                shortcutId: calendar.helper.getId('shortcut'),
                shortCutClass: calendar.helper.getPartClassName('shortcut'),
                shortCut: getMiniCalendarHtml(calendar),
                beginCalendar: getCalendarHtml(calendar, 'begin'),
                endCalendar: getCalendarHtml(calendar, 'end'),
                footClass: calendar.helper.getPartClassName('foot'),
                okBtnClass: calendar.helper.getPartClassName('okBtn'),
                cancelBtnClass: calendar.helper.getPartClassName('cancelBtn')
            });
        }

        /**
         * 获取某日开始时刻
         *
         * @param {Date} day 某日
         * @return {Date}
         */
        function startOfDay(day) {
            return m(day).startOf('day').toDate();
        }

        /**
         * 获取某日结束时刻
         *
         * @param {Date} day 某日
         * @return {Date}
         */
        function endOfDay(day) {
            return m(day).endOf('day').toDate();
        }

        /**
         * 判断是否不在可选范围内
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {object} shortItem 快捷对象
         * @return {boolean}
         */
        function isOutOfRange(calendar, shortItem) {
            var range = calendar.range;
            var itemValue = shortItem.getValue.call(calendar);

            // 得先格式化一下，去掉时间
            if (startOfDay(range.begin) > startOfDay(range.begin)
                || endOfDay(itemValue.end) < endOfDay(itemValue.end)) {
                return true;
            }

            return false;
        }

        /**
         * 搭建快捷迷你日历
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @return {string}
         */
        function getMiniCalendarHtml(calendar) {
            var shownShortCut = calendar.shownShortCut.split(',');
            var shownShortCutHash = {};
            for (var k = 0; k < shownShortCut.length; k++) {
                shownShortCutHash[shownShortCut[k]] = true;
            }

            var tplItem = ''
                + '<span data-index="${shortIndex}" class="'
                + calendar.helper.getPartClassName('shortcut-item')
                + ' ${shortClass}"'
                + ' id="${shortId}">${shortName}</span>';
            var shortItems = calendar.shortCutItems;
            var len = shortItems.length;
            var html = [];
            for (var i = 0; i < len; i++) {
                var shortItem = shortItems[i];
                if (shownShortCutHash[shortItem.name]) {
                    var shortName = shortItem.name;
                    var shortClasses = [];
                    if (i === 0) {
                        shortClasses = shortClasses.concat(
                            calendar.helper.getPartClasses(
                                'shortcut-item-first'
                            )
                        );
                    }
                    // 超出范围或者日历是无限结束
                    var disabled = isOutOfRange(calendar, shortItem);
                    if (disabled) {
                        shortClasses = shortClasses.concat(
                            calendar.helper.getPartClasses(
                                'shortcut-item-disabled'
                            )
                        );
                    }
                    var shortId = calendar.helper.getId('shortcut-item' + i);

                    html.push(
                        lib.format(
                            tplItem,
                            {
                                shortIndex: i,
                                shortClass: shortClasses.join(' '),
                                shortId: shortId,
                                shortName: shortName
                            }
                        )
                    );
                }
            }
            return html.join('');
        }

        /**
         * 搭建单个日历
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {string} type 日历类型 begin|end
         * @return {string}
         */
        function getCalendarHtml(calendar, type) {
            var endlessCheckDOM = '';
            // 可以无限
            if (calendar.endlessCheck && type === 'end') {
                endlessCheckDOM = ''
                    + '<input type="checkbox" title="不限结束" '
                    + 'data-ui-type="CheckBox" '
                    + 'data-ui-child-name="endlessCheck" />';
            }
            var tpl = ''
                + '<div class="${frameClass}">'
                +   '<div class="${labelClass}">'
                +     '<h3>${labelTitle}</h3>'
                +     endlessCheckDOM
                +   '</div>'
                +   '<div class="${calClass}">'
                +     '<div data-ui="type:MonthView;'
                +     'childName:${calName}"></div>'
                +   '</div>'
                + '</div>';

            return lib.format(tpl, {
                frameClass: calendar.helper.getPartClassName(type),
                labelClass: calendar.helper.getPartClassName('label'),
                labelTitle: type == 'begin' ? '开始日期' : '结束日期',
                titleId: calendar.helper.getId(type + 'Label'),
                calClass: calendar.helper.getPartClassName(type + '-cal'),
                calName: type + 'Cal'
            });
        }

        /**
         * 将日历置为无结束时间
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {CheckBox} checkbox CheckBox控件实例
         */
        function makeCalendarEndless(calendar) {
            var endCalendar = calendar.getChild('endCal');
            var shortCutItems = calendar.helper.getPart('shortcut');
            var selectedIndex;
            if (this.isChecked()) {
                calendar.isEndless = true;
                endCalendar.disable();
                selectedIndex = -1;
                calendar.view.end = null;
                calendar.helper.addPartClasses(
                    'shortcut-disabled', shortCutItems
                );
            }
            else {
                calendar.isEndless = false;
                endCalendar.enable();
                // 恢复结束日历的选择值
                updateView.apply(calendar, [endCalendar, 'end']);
                calendar.helper.removePartClasses(
                    'shortcut-disabled', shortCutItems
                );
            }
        }

        /**
         * 比较两个日期是否同一天(忽略时分秒)
         *
         * @inner
         * @param {Date} date1 日期.
         * @param {Date} date2 日期.
         * @return {boolean}
         */
        function isSameDate(date1, date2) {
            if ((!date1 && date2) || (date1 && !date2)) {
                return false;
            }
            else if (!date1 && !date2) {
                return true;
            }
            return m(date1).isSame(date2, 'day');
        }

        /**
         * 获取mini日历中应该选中的索引值
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {{begin:Date,end:Date}} value 日期区间对象.
         * @return {number}
         */
        function getSelectedIndex(calendar, value) {
            var shortcutItems = calendar.shortCutItems;
            var len = shortcutItems.length;

            for (var i = 0; i < len; i++) {
                var item = shortcutItems[i];
                var itemValue = item.getValue.call(calendar);

                if (isSameDate(value.begin, itemValue.begin)
                    && isSameDate(value.end, itemValue.end)) {
                    return i;
                }
            }

            return -1;
        }

        /**
         * 根据索引选取日期
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {number} index
         */
        function selectIndex(calendar, index) {
            var me = calendar;
            var shortcutItems = calendar.shortCutItems;

            if (index < 0 || index >= shortcutItems.length) {
                return;
            }

            var value = shortcutItems[index].getValue.call(me);
            var begin = value.begin;
            var end = value.end;

            calendar.view = { begin: begin, end: end };
            paintCal(calendar, 'begin', begin);
            paintCal(calendar, 'end', end);

            // 更新样式
            paintMiniCal(me, index);

        }

        /**
         * 渲染mini日历
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {number} index 选择的索引
         */
        function paintMiniCal(calendar, index) {
            var shortcutItems = calendar.shortCutItems;
            var miniMode = calendar.miniMode;
            // 重置选择状态
            if (miniMode !== null && miniMode !== index) {
                calendar.helper.removePartClasses(
                    'shortcut-item-selected',
                    calendar.helper.getPart('shortcut-item' + miniMode)
                );
            }
            calendar.miniMode = index;
            if (index >= 0) {
                calendar.helper.addPartClasses(
                    'shortcut-item-selected',
                    calendar.helper.getPart('shortcut-item' + index)
                );
                calendar.curMiniName = shortcutItems[index].name;
            }
            else {
                calendar.curMiniName = null;
            }
        }

        /**
         * 初始化开始和结束日历
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {string} type 日历类型
         * @param {Date} value 日期
         * @param {boolean} bindEvent 是否需要绑定事件
         */
        function paintCal(calendar, type, value, bindEvent) {
            var monthView = calendar.getChild(type + 'Cal');
            if (!monthView) {
                return;
            }
            monthView.setProperties({
                rawValue: value,
                range: calendar.range
            });
            if (bindEvent === true) {
                monthView.on(
                    'change',
                    u.bind(updateView, calendar, monthView, type)
                );
            }
        }

        /**
         * mini日历点击事件
         *
         * @inner
         * @param {RangeCalendar} this RangeCalendar控件实例
         * @param {Event} 触发事件的事件对象
         */
        function shortcutClick(e) {
            if (this.isEndless) {
                return;
            }

            var tar = e.target || e.srcElement;
            var classes = this.helper.getPartClasses('shortcut-item');
            var disableClasses =
                this.helper.getPartClasses('shortcut-item-disabled');

            while (tar && tar != document.body) {
                if (lib.hasClass(tar, classes[0])
                    && !lib.hasClass(tar, disableClasses[0])) {
                    var index = tar.getAttribute('data-index');
                    selectIndex(this, index);
                    return;
                }
                tar = tar.parentNode;
            }
        }

        /**
         * 更新显示数据
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {MonthView} monthView MonthView控件实例
         * @param {String} type 日历类型 begin | end
         */
        function updateView(monthView, type) {
            var date = monthView.getRawValue();
            if (!date) {
                return;
            }
            this.view[type] = date;
            // 更新shortcut
            var selectedIndex = getSelectedIndex(this, this.view);
            paintMiniCal(this, selectedIndex);
        }

        /**
         * 确定按钮的点击处理
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         */
        function commitValue(calendar) {
            var me = calendar;
            var view = calendar.view;

            var begin = view.begin;
            var end = view.end;
            if (calendar.isEndless) {
                end = null;
            }
            var dvalue = end - begin;
            if (!end) {
                dvalue = begin;
            }
            var value;
            if (dvalue > 0) {
                value = {
                    'begin': begin,
                    'end': end
                };
            }
            else if (end !== null) {
                value = {
                    'begin': end,
                    'end': begin
                };
            }

            var event = me.fire('beforechange', { value: value });

            // 阻止事件，则不继续运行
            if (event.isDefaultPrevented()) {
                return false;
            }

            me.rawValue = value;
            me.value = me.convertToParam(value);
            updateMain(me, value);
            me.layer.hide();
            me.fire('change', value);
        }

        /**
         * 更新主显示
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {{begin:Date,end:Date}=} range 外部设置的日期
         */
        function updateMain(calendar, range) {
            var text = calendar.helper.getPart('text');
            text.innerHTML = getValueText(calendar, range);
        }


        /**
         * 将对象型rawValue转换成字符串
         *
         * @inner
         * @param {{begin:Date,end:Date}=} rawValue 外部设置的日期
         * @return {string} 2011-03-01,2011-04-01
         */
        RangeCalendar.prototype.convertToParam = function (rawValue) {
            var beginTime = rawValue.begin;
            var endTime = rawValue.end;

            var timeResult = [];
            timeResult.push(m(beginTime).format('YYYY-MM-DD'));
            if (endTime) {
                timeResult.push(m(endTime).format('YYYY-MM-DD'));
            }
            return timeResult.join(',');
        };

        /**
         * 将字符串转换成对象型rawValue
         * 可重写
         *
         * @inner
         * @param {string} value 目标日期字符串 ‘YYYY-MM-DD,YYYY-MM-DD’
         * @return {{begin:Date,end:Date}=}
         */
        RangeCalendar.prototype.convertToRaw = function(value) {
            var strDates = value.split(',');
            // 可能会只输入一个，默认当做begin，再塞一个默认的end
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
                begin: m(strDates[0], 'YYYY-MM-DD').toDate(),
                end: m(strDates[1], 'YYYY-MM-DD').toDate()
            };
        };

        /**
         * 获取当前选中日期区间的最终显示字符（含快捷日历展示）
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {{begin:Date,end:Date}=} rawValue 外部设置的日期
         * @return {string}
         */
        function getValueText(calendar, rawValue) {
            // 日期部分 2008-01-01至2009-09-30
            var dateText = getDateValueText(calendar, rawValue);
            // 无结束时间日历，直接返回，无需增加快捷日历描述
            if (calendar.isEndless && dateText) {
                return dateText;
            }
            // 快捷日历
            var shortcut = '';
            if (!calendar.curMiniName
                && calendar.miniMode !== null
                && calendar.miniMode >= 0
                && calendar.miniMode < calendar.shortCutItems.length) {
                calendar.curMiniName =
                    calendar.shortCutItems[calendar.miniMode].name;
            }
            if (calendar.curMiniName) {
                shortcut = calendar.curMiniName + '&nbsp;&nbsp;';
            }

            if (dateText) {
                return shortcut + dateText;
            }

            return '';
        }

        /**
         * 获取当前选中的日期区间的显示字符
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {{begin:Date,end:Date}=} rawValue 外部设置的日期
         * @return {string}
         */
        function getDateValueText(calendar, rawValue) {
            rawValue = rawValue || calendar.getRawValue();
            var begin = rawValue.begin;
            var end = rawValue.end;
            var pattern = calendar.dateFormat;

            if (begin && end) {
                return m(begin).format(pattern)
                    + ' 至 '
                    + m(end).format(pattern);
            }
            else if (!end) {
                return m(begin).format(pattern) + ' 起 ';
            }
            return '';
        }

        RangeCalendar.defaultProperties = {
            dateFormat: 'YYYY-MM-DD',
            endlessCheck: false,
            /**
             * 日期区间快捷选项列表配置
             */
            shortCutItems: [
                {
                    name: '昨天',
                    value: 0,
                    getValue: function () {
                        var yesterday = new Date(this.now.getTime());
                        yesterday.setDate(yesterday.getDate() - 1);
                        return {
                            begin: yesterday,
                            end: yesterday
                        };
                    }
                },
                {
                    name: '最近7天',
                    value: 1,
                    getValue: function () {
                        var mDate = m(this.now);
                        return {
                            begin: mDate.clone().subtract('day', 7).toDate(),
                            end: mDate.clone().subtract('day', 1).toDate()
                        };
                    }
                },
                {
                    name: '上周',
                    value: 2,
                    getValue: function () {
                        var now = this.now;
                        var begin = new Date(now.getTime());
                        var end = new Date(now.getTime());
                        var startOfWeek = 1; // 周一为第一天;

                        if (begin.getDay() < startOfWeek % 7) {
                            begin.setDate(
                                begin.getDate() - 14 + startOfWeek - begin.getDay()
                            );
                        } else {
                            begin.setDate(
                                begin.getDate() - 7 - begin.getDay() + startOfWeek % 7
                            );
                        }
                        begin.setHours(0, 0, 0, 0);
                        end.setFullYear(
                            begin.getFullYear(),
                            begin.getMonth(),
                            begin.getDate() + 6
                        );
                        end.setHours(0, 0, 0, 0);

                        return {
                            begin: begin,
                            end: end
                        };
                    }
                },
                {
                    name: '本月',
                    value: 3,
                    getValue: function () {
                        return {
                            begin: m(this.now).startOf('month').toDate(),
                            end: m(this.now).toDate()
                        };
                    }
                },
                {
                    name: '上个月',
                    value: 4,
                    getValue: function () {
                        var begin =
                            m(this.now).subtract('month', 1)
                            .startOf('month').toDate();
                        var end =
                            m(this.now).startOf('month')
                            .subtract('day', 1).toDate();
                        return {
                            begin: begin,
                            end: end
                        };
                    }
                },
                {
                    name: '上个季度',
                    value: 5,
                    getValue: function () {
                        var now = this.now;
                        var begin = m(now)
                            .subtract('month', now.getMonth() % 3 + 3)
                            .startOf('month').toDate();
                        var end = m(now)
                            .subtract('month', now.getMonth() % 3)
                            .startOf('month').subtract('day', 1).toDate();
                        return {
                            begin: begin,
                            end: end
                        };
                    }
                }
            ]
        };

        /**
         * 控件类型
         *
         * @type {string}
         */
        RangeCalendar.prototype.type = 'RangeCalendar';

        /**
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        RangeCalendar.prototype.initOptions = function (options) {
            var now = this.now;
            var defaultRaw = { begin: now, end: now };
            /**
             * 默认选项配置
             */
            var properties = {
                range: {
                    begin: new Date(1983, 8, 3),
                    end: new Date(2046, 10, 4)
                },
                // 默认今天
                rawValue: defaultRaw,
                // 默认今天
                view: u.clone(defaultRaw),
                value: this.convertToParam(defaultRaw),
                shownShortCut: '昨天,最近7天,上周,本月,上个月,上个季度'
            };
            lib.extend(properties, RangeCalendar.defaultProperties);

            helper.extractValueFromInput(this, options);

            // 设置了value，以value为准
            if (options.value) {
                options.rawValue = this.convertToRaw(options.value);
                options.view = {
                    begin: options.rawValue.begin,
                    end: options.rawValue.end
                };
                options.miniMode = null;
            }
            // 设置了rawValue，以rawValue为准，外部设置的miniMode先清空
            else if (options.rawValue) {
                options.miniMode = null;
            }
            // 没有设置rawValue，设置了‘miniMode’，rawValue按照miniMode计算
            else if (!options.rawValue && options.miniMode != null) {
                var shortcutItem =
                    properties.shortCutItems[options.miniMode];
                if (shortcutItem) {
                    options.rawValue =
                        shortcutItem.getValue.call(this);
                    options.miniMode = parseInt(options.miniMode, 10);
                }
                else {
                    options.miniMode = null;
                }
            }

            lib.extend(properties, options);

            if (properties.range && typeof properties.range === 'string') {
                properties.range = this.convertToRaw(properties.range);
            }

            if (properties.endlessCheck === 'false') {
                properties.endlessCheck = false;
            }

            if (properties.endlessCheck) {
                if (properties.isEndless === 'false') {
                    properties.isEndless = false;
                }
            }
            else {
                // 如果值中没有end，则默认日历是无限型的
                if (!properties.rawValue.end) {
                    properties.endlessCheck = true;
                    properties.isEndless = true;
                }
            }
            // 如果是无限的，结束时间无需默认值
            if (properties.isEndless) {
                properties.endlessCheck = true;
                properties.rawValue.end = null;
                properties.view.end = null;
                properties.view.value = this.convertToParam({
                    begin: now,
                    end: null
                });
            }
            this.setProperties(properties);
        };


        /**
         * 初始化DOM结构
         *
         * @protected
         */
        RangeCalendar.prototype.initStructure = function () {
            // 如果主元素是输入元素，替换成`<div>`
            // 如果输入了非块级元素，则不负责
            if (lib.isInput(this.main)) {
                helper.replaceMain(this);
            }

            var tpl = [
                '<div class="${className}" id="${id}"></div>',
                '<div class="${arrow}"></div>'
            ];

            this.main.innerHTML = lib.format(
                tpl.join('\n'),
                {
                    className: this.helper.getPartClassName('text'),
                    id: helper.getId(this, 'text'),
                    arrow: this.helper.getPartClassName('arrow')
                }
            );

        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        RangeCalendar.prototype.initEvents = function () {
            this.helper.addDOMEvent(this.main, 'mousedown', u.bind(this.layer.toggle, this.layer));
        };

        /**
         * 重新渲染视图
         * 仅当生命周期处于RENDER时，该方法才重新渲染
         *
         * @param {Array=} 变更过的属性的集合
         * @override
         */
        RangeCalendar.prototype.repaint = helper.createRepaint(
            InputControl.prototype.repaint,
            {
                name: ['rawValue', 'range'],
                paint: function (calendar, rawValue, range) {
                     if (range) {
                        if (typeof range === 'string') {
                            range = calendar.convertToRaw(range);
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
                        paintLayer(calendar, rawValue);
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
            },
            {
                name: 'isEndless',
                paint: function (calendar, isEndless) {
                    // 不是无限日历，不能置为无限
                    if (!calendar.endlessCheck) {
                        calendar.isEndless = false;
                    }
                    else {
                        var endlessCheck =
                            calendar.getChild('endlessCheck');
                        if (endlessCheck) {
                            endlessCheck.setChecked(isEndless);
                        }
                    }
                }
            }
        );

        /**
         * 设置日期
         *
         * @param {Date} date 选取的日期.
         */
        RangeCalendar.prototype.setRawValue = function (date) {
            this.setProperties({ 'rawValue': date });
        };

        /**
         * 获取选取日期值
         *
         * @return {Date}
         */
        RangeCalendar.prototype.getRawValue = function () {
            return this.rawValue;
        };


        /**
         * 将value从原始格式转换成string
         *
         * @param {*} rawValue 原始值
         * @return {string}
         */
        RangeCalendar.prototype.stringifyValue = function (rawValue) {
            return this.convertToParam(rawValue) || '';
        };

        /**
         * 将string类型的value转换成原始格式
         *
         * @param {string} value 字符串值
         * @return {*}
         */
        RangeCalendar.prototype.parseValue = function (value) {
            return this.convertToRaw(value);
        };

        RangeCalendar.prototype.dispose = function () {
            if (helper.isInStage(this, 'DISPOSED')) {
                return;
            }

            if (this.layer) {
                this.layer.dispose();
                this.layer = null;
            }

            InputControl.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(RangeCalendar, InputControl);
        ui.register(RangeCalendar);

        return RangeCalendar;
    }
);
