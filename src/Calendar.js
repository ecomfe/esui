/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 日历
 * @author dbear
 */

define(
    function (require) {
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
            for (var i = 0; i <= len; i++) {
                ds.push({text: i, value: i});
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
                        'id:${yearSelId};width:55"></div>',
                    '</td>',
                    '<td>',
                        '<div data-ui="type:Select;childName:monthSel;',
                        'id:${monthSelId};width:55"></div>',
                    '</td>',
                    '<td width="40" align="left">',
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
                    headClass: helper.getClasses(calendar, 'layer-head'),
                    monthBackId: helper.getId(calendar, 'monthBack'),
                    monthForwardId: helper.getId(calendar, 'monthForward'),
                    yearSelId: helper.getId(calendar, 'yearSel'),
                    monthSelId: helper.getId(calendar, 'monthSel'),
                    monthViewId: helper.getId(calendar, 'monthView')
                }
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
            var tar = e.target || e.srcElement;
            while (tar && tar != document.body) {
                if (tar == calendar.main) {
                    return;
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

                // 填充年份
                var yearSel = calendar.getChild('yearSel');
                debugger;
                yearSel.setProperties({
                    datasource: getYearOptions(calendar),
                    value: calendar.year
                });

                // 填充月份
                var monthSel = calendar.getChild('monthSel');
                monthSel.setProperties({
                    datasource: getMonthOptions(calendar, calendar.year),
                    value: calendar.month
                });

                //填充日历主体

                var close = lib.bind(closeLayer, null, calendar);
                lib.on(document, 'mousedown', close);
                calendar.on(
                    'afterdispose',
                    function () {
                        lib.un(document, 'mousedown', close);
                    }
                );
            }

            var mainOffset = lib.getOffset(calendar.main);

            layer.style.top = mainOffset.bottom + 'px';
            layer.style.left = mainOffset.left + 'px';
            layer.style.width = '200px';

            showLayer(calendar);
        }

        /**
         * 根据下拉弹层当前状态打开或关闭之
         *
         * @param {Calendar} calendar Calendar控件实例
         * @param {Event} 触发事件的事件对象
         * @inner
         */
        function toggleLayer(calendar, e) {
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
                    hideLayer(calendar);
                }
                else {
                    showLayer(calendar);
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
                    lib.bind(toggleLayer, null, this)
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
                        var textId = helper.getId(calendar, 'text');
                        lib.g(textId).innerHTML =
                            lib.date.format(value, calendar.dateFormat);

                        calendar.month = calendar.rawValue.getMonth();
                        calendar.year = calendar.rawValue.getFullYear();
                        // 更新日历
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
            }
        };

        lib.inherits(Calendar, InputControl);
        ui.register(Calendar);

        return Calendar;
    }
);
