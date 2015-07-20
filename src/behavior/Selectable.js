/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Selectable, 类似windows桌面上鼠标拖拽批量选中多个目标
 * @author maoquan(3610cn@gmail.com), liwei(liwei@iguzhi.cn)
 */
define(
    function (require) {
        var Mouse = require('./Mouse');

        var $ = require('jquery');
        var u = require('underscore');
        var eoo = require('eoo');

        var Selectable = eoo.create(
            Mouse,
            {
                type: 'selectable',

                constructor: function (options, element) {
                    options = u.extend(
                        {
                            // 指定helper父元素
                            appendTo: 'body',
                            // 是否自动刷新
                            autoRefresh: true,
                            // 可以选择的元素
                            filter: '*',
                            // 是否选中的策略
                            // touch --> helper覆盖任意部分
                            // fit --> helper覆盖全部
                            tolerance: 'touch',

                            // callbacks
                            // 拖拽结束后触发，每个选中元素触发一次
                            selected: null,
                            // 拖拽结束后触发，每个未选中元素触发一次
                            unselected: null,
                            // 鼠标拖拽过程中触发，每个选中元素触发一次
                            selecting: null,
                            // 拖拽过程中触发，每个取消选中元素触发一次
                            unselecting: null,
                            // distance设为0,支持单点选中
                            distance: 0
                        },
                        options
                    );
                    this.$super(arguments);
                },

                init: function () {
                    this.$super(arguments);

                    var me = this;
                    this.addClass();

                    var selectees;
                    // 缓存每个可选择元素
                    this.refresh = function () {
                        selectees = $(me.options.filter, me.element[0]);
                        this.addClass(selectees, 'selectee');
                        selectees.each(
                            function () {
                                var $this = $(this);
                                var pos = $this.offset();
                                $.data(
                                    this,
                                    'selectable-item',
                                    {
                                        element: this,
                                        $element: $this,
                                        left: pos.left,
                                        top: pos.top,
                                        right: pos.left + $this.outerWidth(),
                                        bottom: pos.top + $this.outerHeight(),
                                        startselected: false,
                                        selected: me.hasClass('selected'),
                                        selecting: me.hasClass('selecting'),
                                        unselecting: me.hasClass('unselecting')
                                    }
                                );
                            }
                        );
                    };
                    this.refresh();

                    this.selectees = selectees;
                    var helperClass = this.getClassName('helper');
                    this.helper = $('<div class="' + helperClass + '"></div>');
                },

                mouseStart: function (event) {
                    var me = this;
                    var options = this.options;

                    this.mousePosition = [event.pageX, event.pageY];

                    if (this.options.disabled) {
                        return;
                    }

                    this.selectees = $(options.filter, this.element[0]);
                    // fire start event
                    this.$super(arguments);

                    $(options.appendTo).append(this.helper);
                    this.helper.css(
                        {
                            left: event.pageX,
                            top: event.pageY,
                            width: 0,
                            height: 0
                        }
                    );

                    if (options.autoRefresh) {
                        this.refresh();
                    }

                    // 将已选中元素取消选择
                    var selectedClass = this.getClassName(true, 'selected');
                    this.selectees.filter(selectedClass).each(
                        function () {
                            var selectee = $.data(this, 'selectable-item');
                            var $element = selectee.$element;
                            selectee.startselected = true;
                            if (!event.metaKey && !event.ctrlKey) {
                                me.removeClass($element, 'selected');
                                me.addClass($element, 'unselecting');
                                selectee.selected = false;
                                selectee.unselecting = true;
                                // selectable UNSELECTING callback
                                me.trigger('unselecting', event, {unselecting: selectee.element});
                            }
                        }
                    );

                    $(event.target).parents().addBack().each(
                        function () {
                            var selectee = $.data(this, 'selectable-item');
                            if (selectee) {
                                var $element = selectee.$element;
                                var doSelect = (!event.metaKey && !event.ctrlKey)
                                    || !me.hasClass($element, 'selected');
                                me.removeClass($element, doSelect ? 'unselecting' : 'selected');
                                me.addClass($element, doSelect ? 'selecting' : 'unselecting');

                                selectee.unselecting = !doSelect;
                                selectee.selecting = doSelect;
                                selectee.selected = doSelect;
                                // selectable (UN)SELECTING callback
                                if (doSelect) {
                                    me.trigger('selecting', event, {selecting: selectee.element});
                                }
                                else {
                                    me.trigger('unselecting', event, {unselecting: selectee.element});
                                }
                                return false;
                            }
                        }
                    );
                    return true;
                },

                mouseDrag: function (event) {

                    if (this.options.disabled) {
                        return;
                    }

                    // 计算helper的位置和尺寸
                    var x1 = this.mousePosition[0];
                    var x2 = event.pageX;
                    var minX = Math.min(x1, x2);
                    var maxX = Math.max(x1, x2);

                    var y1 = this.mousePosition[1];
                    var y2 = event.pageY;
                    var minY = Math.min(y1, y2);
                    var maxY = Math.max(y1, y2);

                    this.helper.css(
                        {
                            left: minX,
                            top: minY,
                            width: maxX - minX,
                            height: maxY - minY
                        }
                    );

                    var me = this;
                    var options = this.options;
                    this.selectees.each(
                        function () {
                            var selectee = $.data(this, 'selectable-item');
                            var $element = selectee.$element;
                            var hit = false;

                            // prevent helper from being selected if appendTo: selectable
                            if (!selectee || selectee.element === me.element[0]) {
                                return;
                            }

                            // 计算是否选中
                            if (options.tolerance === 'touch') {
                                hit = !(
                                    selectee.left > maxX || selectee.right < minX
                                        || selectee.top > maxY || selectee.bottom < minY
                                );
                            }
                            else if (options.tolerance === 'fit') {
                                hit = selectee.left > minX && selectee.right < maxX
                                        && selectee.top > minY && selectee.bottom < maxY;
                            }

                            // 选中处理,拖拽结束前，置状态为selecting
                            if (hit) {
                                if (selectee.selected) {
                                    me.removeClass($element, 'selected');
                                    selectee.selected = false;
                                }
                                if (selectee.unselecting) {
                                    me.removeClass($element, 'unselecting');
                                    selectee.unselecting = false;
                                }
                                if (!selectee.selecting) {
                                    me.addClass($element, 'selecting');
                                    selectee.selecting = true;
                                    me.trigger('selecting', event, {selecting: selectee.element});
                                }
                            }
                            // 未选中处理,拖拽结束前，置状态为unselecting
                            else {
                                if (selectee.selecting) {
                                    if ((event.metaKey || event.ctrlKey) && selectee.startselected) {
                                        me.removeClass($element, 'selecting');
                                        selectee.selecting = false;
                                        me.addClass($element, 'selected');
                                        selectee.selected = true;
                                    }
                                    else {
                                        me.removeClass($element, 'selecting');
                                        selectee.selecting = false;
                                        if (selectee.startselected) {
                                            me.addClass($element, 'unselecting');
                                            selectee.unselecting = true;
                                        }
                                        me.trigger('unselecting', event, {unselecting: selectee.element});
                                    }
                                }
                                if (selectee.selected) {
                                    if (!event.metaKey && !event.ctrlKey && !selectee.startselected) {
                                        me.removeClass($element, 'selected');
                                        selectee.selected = false;
                                        me.addClass($element, 'unselecting');
                                        selectee.unselecting = true;
                                        me.trigger('unselecting', event, {unselecting: selectee.element});
                                    }
                                }
                            }
                        }
                    );
                    return false;
                },

                mouseStop: function (event) {
                    var me = this;

                    // 选择结束后处理
                    // unselecting --> unselected
                    // selecting --> selected
                    $(this.getClassName(true, 'unselecting'), this.element[0]).each(
                        function () {
                            var selectee = $.data(this, 'selectable-item');
                            me.removeClass(selectee.$element, 'unselecting');
                            selectee.unselecting = false;
                            selectee.startselected = false;
                            me.trigger('unselected', event, {unselected: selectee.element});
                        }
                    );

                    $(this.getClassName(true, 'selecting'), this.element[0]).each(
                        function () {
                            var selectee = $.data(this, 'selectable-item');
                            var $element = selectee.$element;
                            me.removeClass($element, 'selecting');
                            me.addClass($element, 'selected');
                            selectee.selecting = false;
                            selectee.selected = true;
                            selectee.startselected = true;

                            me.trigger('selected', event, {selected: selectee.element});
                        }
                    );
                    this.$super(arguments);
                    this.helper.remove();
                    return false;
                },

                dispose: function () {
                    this.$super(arguments);
                    var me = this;
                    this.selectees.each(
                        function () {
                            var selectee = $.data(this, 'selectable-item');
                            me.removeClass(selectee, 'selectee');
                        }
                    );
                    this.removeClass('selectable, selectable-disabled');
                    this.selectees.removeData('selectable-item');
                }
            }
        );

        require('./bridge')('selectable', Selectable);
        return Selectable;
    }
);
