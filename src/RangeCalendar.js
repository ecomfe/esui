/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 区间日历
 * @author dbear
 */

define(
    function (require) {
        require('./Button');
        require('./MonthView');

        // css
        require('css!./css/RangeCalendar.css');

        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');
        var ui = require('./main');

        /**
         * 控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function RangeCalendar(options) {
            InputControl.apply(this, arguments);
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
                +   '<div data-ui="type:Button;childName:okBtn;">确定</div>'
                +   '<div data-ui="type:Button;childName:cancelBtn;">取消</div>'
                + '</div>'
                + '<div data-ui="type:Button;childName:'
                + 'closeBtn;skin:layerClose"></div>';

            return lib.format(tpl, {
                bodyClass:
                    helper.getPartClasses(calendar, 'body').join(' '),
                shortcutId: helper.getId(calendar, 'shortcut'),
                shortCutClass:
                    helper.getPartClasses(calendar, 'shortcut').join(' '),
                shortCut: getMiniCalendarHtml(calendar),
                beginCalendar: getCalendarHtml(calendar, 'begin'),
                endCalendar: getCalendarHtml(calendar, 'end'),
                footClass:
                    helper.getPartClasses(calendar, 'foot').join(' ')
            });
        }

        /**
         * 搭建快捷迷你日历
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @return {string}
         */
        function getMiniCalendarHtml(calendar) {
            var tplItem = ''
                + '<span data-index="${shortIndex}" class="${shortClass}"'
                + ' id="${shortId}">${shortName}</span>';
            var shortItems = RangeCalendar.shortCutItems;
            var len = shortItems.length;
            var html = [];

            for (var i = 0; i < len; i++) {
                var shortItem = shortItems[i];
                var shortName = shortItem.name;
                var shortClass =
                    helper.getPartClasses(calendar, 'shortcut-item').join(' ');
                var shortId = helper.getId(calendar, 'shortcutItem' + i);


                html.push(
                    lib.format(
                        tplItem, 
                        {
                            shortIndex: i,
                            shortClass: shortClass,
                            shortId: shortId,
                            shortName: shortName
                        }
                    )
                );
            }
            return html.join('&nbsp;|&nbsp;');
        }

        /**
         * 搭建单个日历
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {string} type 日历类型 begin|end
         * @return {string}
         */
        function getCalendarHtml(calendar, type) {
            var tpl = ''
                + '<div class="${frameClass}">'
                +   '<div class="${labelClass}">'
                +     '<b>${labelTitle}</b><span id="${titleId}"></span>'
                +   '</div>'
                +   '<div class="${calClass}">'
                +     '<div data-ui="type:MonthView;'
                +     'childName:${calName}"></div>'
                +   '</div>'
                + '</div>';

            return lib.format(tpl, {
                frameClass: helper.getPartClasses(calendar, type).join(' '),
                labelClass:
                    helper.getPartClasses(calendar, 'label').join(' '),
                labelTitle: type == 'begin' ? '开始日期' : '结束日期',
                titleId: helper.getId(calendar, type + 'Label'),
                calClass:
                    helper.getPartClasses(calendar, type + '-cal').join(' '),
                calName: type + 'Cal'
            });
        }

        /**
         * 显示下拉弹层
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         */
        function showLayer(calendar) {
            var layer = calendar.layer;
            helper.layer.attachTo(
                layer, 
                calendar.main, 
                { top: 'bottom', left: 'left' }
            );
            helper.removePartClasses(calendar, 'layer-hidden', calendar.layer);
            calendar.addState('active');
        }

        /**
         * 隐藏下拉弹层
         *
         * @param {RangeCalendar} calendar RangeCalendar控件实例
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
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {Event} 触发事件的事件对象
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
                tar = tar.parentNode;
            }
            hideLayer(calendar);
        }


        /**
         * 打开下拉弹层
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         */
        function openLayer(calendar) {
            var layer = calendar.layer;
            if (!layer) {
                layer = helper.layer.create('div');
                helper.addPartClasses(calendar, 'layer', layer);
                layer.innerHTML = getLayerHtml(calendar);
                document.body.appendChild(layer);
                calendar.layer = layer;
                // 创建控件树
                calendar.initChildren(layer);

                // 渲染mini日历
                var selectedIndex = getSelectedIndex(calendar, calendar.view);
                paintMiniCal(calendar, selectedIndex);

                //为mini日历绑定点击事件
                var shortcutDom = lib.g(helper.getId(calendar, 'shortcut'));
                helper.addDOMEvent(
                    calendar, shortcutDom, 'click',
                    lib.bind(shortcutClick, null, calendar)
                );

                // 渲染开始结束日历
                paintCal(calendar, 'begin', calendar.view.begin, true);
                paintCal(calendar, 'end', calendar.view.begin, true);

                //绑定提交和取消按钮
                var okBtn = calendar.getChild('okBtn');
                okBtn.on('click', lib.bind(commitValue, null, calendar));

                var cancelBtn = calendar.getChild('cancelBtn');
                cancelBtn.on('click', lib.bind(hideLayer, null, calendar));

                //关闭按钮
                var closeBtn = calendar.getChild('closeBtn');
                closeBtn.on('click', lib.bind(hideLayer, null, calendar));
            }

            showLayer(calendar);
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
            if (date2 !== '' && date1 !== '') {
              if (date1.getFullYear() == date2.getFullYear() &&
                  date1.getMonth() == date2.getMonth() &&
                  date1.getDate() == date2.getDate()) {
                    return true;
                }
            }
            return false;
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
            var shortcutItems = RangeCalendar.shortCutItems;
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
            var shortcutItems = RangeCalendar.shortCutItems;

            if (index < 0 || index >= shortcutItems.length) {
                return;
            }

            // 更新样式
            paintMiniCal(me, index);

            var value = shortcutItems[index].getValue.call(me);
            calendar.view = value;
            paintCal(calendar, 'begin', value.begin);
            paintCal(calendar, 'end', value.end);
        }

        /**
         * 渲染mini日历
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {number} index 选择的索引
         */
        function paintMiniCal(calendar, index) {
            var shortcutItems = RangeCalendar.shortCutItems;
            var curMiniIndex = calendar.curMiniIndex;
            // 重置选择状态
            if (curMiniIndex != null && curMiniIndex != index) {
                helper.removePartClasses(
                    calendar,
                    'shortcut-item-selected',
                    lib.g(helper.getId(calendar, 'shortcutItem'+curMiniIndex))
                );
            }
            calendar.curMiniIndex = index;
            if (index >= 0) {
                helper.addPartClasses(
                    calendar,
                    'shortcut-item-selected',
                    lib.g(helper.getId(calendar, 'shortcutItem'+index))
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
            monthView.setProperties({
                rawValue: value,
                range: calendar.range
            });
            if (bindEvent === true) {
                monthView.on(
                    'change',
                    lib.bind(updateView, null, calendar, monthView, type)
                );
            }
        }

        /**
         * 主元素点击事件
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {Event} 触发事件的事件对象
         */
        function mainClick(calendar, e) {
            if (!calendar.disabled) {
                calendar.isHidePrevent = 1;
                toggleLayer(calendar);
            }
        }

        /**
         * mini日历点击事件
         *
         * @inner
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {Event} 触发事件的事件对象
         */
        function shortcutClick(calendar, e) {
            var tar = e.target || e.srcElement;
            var classes = helper.getPartClasses(calendar, 'shortcut-item');

            while (tar && tar != document.body) {
                if (lib.hasClass(tar, classes[0])) {
                    var index = tar.getAttribute('data-index');
                    selectIndex(calendar, index);
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
        function updateView(calendar, monthView, type) {
            var date = monthView.getRawValue();
            if (!date) {
                return;
            }
            calendar['view'][type] = date;
            // 更新shortcut
            var selectedIndex = getSelectedIndex(calendar, calendar.view);
            paintMiniCal(calendar, selectedIndex);
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
            var dvalue = end - begin;
            var value;

            if (dvalue > 0) {
                value = {
                    'begin': begin,
                    'end': end
                };
            } else {
                value = {
                    'begin': end,
                    'end': begin
                };
            }
            me.rawValue = value;
            me.paramValue = convertToParam(value);
            updateMain(me, value);
            hideLayer(me);
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
            var textId = helper.getId(calendar, 'text');
            var inputId = helper.getId(calendar, 'param-value');
            lib.g(textId).innerHTML = getValueText(calendar, range);
            lib.g(inputId).value = convertToParam(range);
        }

        /**
         * 根据下拉弹层当前状态打开或关闭之
         *
         * @inner         
         * @param {RangeCalendar} calendar RangeCalendar控件实例
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
            if (calendar.view != calendar.rawValue) {
                paintLayer(calendar, calendar.rawValue);
            }
        }

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
            calendar.paramValue = convertToParam(value);
            var selectedIndex = getSelectedIndex(calendar, calendar.view);
            paintMiniCal(calendar, selectedIndex);
            paintCal(calendar, 'begin', value.begin);
            paintCal(calendar, 'end', value.end);
        }

        /**
         * 将对象型rawValue转换成字符串
         *
         * @inner
         * @param {{begin:Date,end:Date}=} value 外部设置的日期
         * @return {string} 20110301222222,20110401235959
         */
        function convertToParam(value) {
            var beginTime = value.begin;
            var endTime = value.end;
            var beginTail = ' 00:00:00';
            var endTail = ' 23:59:59';
            return lib.date.format(beginTime, 'yyyy-MM-dd') + beginTail + ',' +
                lib.date.format(endTime, 'yyyy-MM-dd') + endTail;
        }

        /**
         * 将字符串转换成对象型rawValue
         *
         * @inner
         * @param {string} paramValue 20110301222222,20110401235959
         * @return {{begin:Date,end:Date}=}
         */
        function convertToRaw(paramValue) {            
            var strDates = paramValue.split(',');
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
         * @param {RangeCalendar} calendar RangeCalendar控件实例
         * @param {{begin:Date,end:Date}=} value 外部设置的日期
         * @return {string}
         */
        function getValueText(calendar, value) {
            var dateText = getDateValueText(calendar, value);
            var shortcut = '';
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
         * @param {{begin:Date,end:Date}=} value 外部设置的日期
         * @return {string}
         */
        function getDateValueText(calendar, value) {
            value = value || calendar.getRawValue();
            var begin = value.begin;
            var end = value.end;
            var format = calendar.dateFormat;
            var formatter = lib.date.format;

            if (begin && end) {
                return formatter(begin, format)
                    + ' 至 '
                    + formatter(end, format);
            }

            return '';
        }

        RangeCalendar.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'RangeCalendar',

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
                    rawValue: {
                        begin: now,
                        end: now
                    },
                    view: {
                        begin: now,
                        end: now
                    },
                    paramValue: convertToParam({
                        begin: now,
                        end: now
                    }),
                    dateFormat: 'yyyy-MM-dd',
                    paramFormat: 'yyyy-MM-dd'
                };

                if (options.paramvalue) {
                    options.rawValue = convertToRaw(options.paramvalue);
                    options.view = {};
                    options.view.begin = options.rawValue.begin;
                    options.view.end = options.rawValue.end;
                }

                if (options.range && typeof options.range === 'string') {
                    options.range = convertToRaw(options.range);
                }

                lib.extend(properties, options);
                this.setProperties(properties);
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
                
                var tpl = [
                    '<div class="${className}" id="${id}"></div>',
                    '<div class="${arrow}"></div>',
                    '<input type="hidden" id="${inputId}" name="${name}"',
                    ' value="" />'
                ];

                this.main.innerHTML = lib.format(
                    tpl.join('\n'),
                    {
                        className:
                            helper.getPartClasses(this, 'text').join(' '),
                        id: helper.getId(this, 'text'),
                        arrow: helper.getPartClasses(this, 'arrow').join(' '),
                        name: this.name,
                        inputId: helper.getId(this, 'param-value')
                    }
                );

                helper.addDOMEvent(
                    this, this.main, 'mousedown',
                    lib.bind(mainClick, null, this)
                );

                var close = lib.bind(closeLayer, null, this);
                lib.on(document, 'mousedown', close);
                this.on(
                    'afterdispose',
                    function () {
                        lib.un(document, 'mousedown', close);
                    }
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
                return document.createElement('div');
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
                    name: ['rawValue', 'range'],
                    paint: function (calendar, rawValue, range) {
                        if (calendar.disabled || calendar.readOnly) {
                            return;
                        }
                        if (range && typeof range === 'string') {
                            calendar.range = convertToRaw(range);
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
             * @param {*} rawValue 原始值
             * @return {string}
             */
            stringifyValue: function (rawValue) {
                return convertToParam(rawValue) || '';
            }
        };

        /**
         * 日期区间快捷选项列表配置
         */
        RangeCalendar.shortCutItems = [
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
                    var begin = new Date(this.now.getTime());
                    var end = new Date(this.now.getTime());

                    end.setDate(end.getDate() - 1);
                    begin.setDate(begin.getDate() - 7);

                    return {
                        begin: begin,
                        end: end
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
                    var _wd = 1; //周一为第一天;

                    if (begin.getDay() < _wd % 7) {
                        begin.setDate(
                            begin.getDate() - 14 + _wd - begin.getDay()
                        );
                    } else {
                        begin.setDate(
                            begin.getDate() - 7 - begin.getDay() + _wd % 7
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
                    var now = this.now;
                    var begin = new Date(now.getTime());
                    var end = new Date(now.getTime());
                    begin.setDate(1);
                    return {
                        begin: begin,
                        end: end
                    };
                }
            },
            {
                name: '上个月',
                value: 4,
                getValue: function () {
                    var now = this.now;
                    var begin = new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );
                    var end = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                    );
                    end.setDate(end.getDate() - 1);
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
                    var begin = new Date(
                        now.getFullYear(),
                        now.getMonth() - now.getMonth() % 3 - 3,
                        1
                    );
                    var end = new Date(
                        now.getFullYear(),
                        now.getMonth() - now.getMonth() % 3,
                        1
                    );
                    end.setDate(end.getDate() - 1);
                    return {
                        begin: begin,
                        end: end
                    };
                }
            }
        ];

        lib.inherits(RangeCalendar, InputControl);
        ui.register(RangeCalendar);

        return RangeCalendar;
    }
);
