/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 日历
 * @author dbear
 */

define(
    function (require) {
        require('./MonthView');

        // css
        require('css!./css/Calendar.css');

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
         * 显示下拉弹层
         *
         * @param {Calendar} calendar Calendar控件实例
         */
        function showLayer(calendar) {
            var layer = calendar.layer;
            helper.layer.attachTo(
                layer, 
                calendar.main, 
                { top: 'bottom', left: 'left', right: 'right' }
            );
            helper.removePartClasses(calendar, 'layer-hidden', layer);
            calendar.addState('active');
        }

        /**
         * 隐藏下拉弹层
         *
         * @param {Calendar} calendar Calendar控件实例
         */
        function hideLayer(calendar) {
            if (calendar.layer) {
                helper.addPartClasses(calendar, 'layer-hidden', calendar.layer);
                calendar.removeState('active');
                calendar.fire('hide');
            }

        }

        /**
         * 点击自动隐藏的处理
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
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
         * @param {Calendar} calendar Calendar控件实例
         * @inner
         */
        function openLayer(calendar) {
            var layer = calendar.layer;
            if (!layer) {
                layer = helper.layer.create('div');
                layer.className = 
                    helper.getPartClasses(calendar, 'layer').join(' ');
                layer.innerHTML = ''
                    + '<div data-ui="type:MonthView;childName:monthView;"/>';

                document.body.appendChild(layer);
                calendar.layer = layer;

                // 创建控件树
                calendar.initChildren(layer);

                var monthView = calendar.getChild('monthView');
                monthView.setRawValue(calendar.rawValue);
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
         * 更新显示
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
         * @param {MonthView} monthView MonthView控件实例
         */
        function updateDisplay(calendar, monthView) {
            var date = monthView.getRawValue();
            if (!date) {
                return;
            }
            calendar.rawValue = date;
            updateMain(calendar);
            calendar.fire('change');
        }

        /**
         * 更新主显示
         *
         * @inner
         * @param {Calendar} calendar Calendar控件实例
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
                    paramFormat: 'yyyyMMdd',
                    rawValue: new Date(),
                    calType: 'sel' // 日历类型，另外还支持'input' 'label'
                };
                lib.extend(properties, options);
                lib.extend(this, properties);
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
                var calType = options.calType;
                if (calType == 'label') {
                    return document.createElement('div');
                }
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
                    name: 'rawValue',
                    paint: function (calendar, value) {
                        if (calendar.disabled || calendar.readOnly) {
                            return;
                        }
                        // 更新主显示
                        updateMain(calendar);
                        if (calendar.layer) {
                            // 更新日历
                            var monthView = calendar.getChild('monthView');
                            monthView.setRawValue(value);
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
             * 将value从原始格式转换成string
             * 
             * @param {*} rawValue 原始值
             * @return {string}
             */
            stringifyValue: function (rawValue) {
                return lib.date.format(rawValue, this.paramFormat) || null;
            }
        };

        lib.inherits(Calendar, InputControl);
        ui.register(Calendar);

        return Calendar;
    }
);
