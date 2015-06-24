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

        var exports = {};

        exports.type = 'selectable';

        exports.constructor = function (options, element) {
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
                    unselecting: null
                },
                options
            );
            this.$super(arguments);
        };

        exports.init = function () {
            this.$super(arguments);

            var me = this;
            this.addClass();
            this.dragged = false;

            var selectees;
            // 缓存每个可选择元素
            this.refresh = function () {
                selectees = $(me.options.filter, me.element[0]);
                selectees.addClass('ui-selectee');
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
                                selected: $this.hasClass('ui-selected'),
                                selecting: $this.hasClass('ui-selecting'),
                                unselecting: $this.hasClass('ui-unselecting')
                            }
                        );
                    }
                );
            };
            this.refresh();

            this.selectees = selectees.addClass('ui-selectee');
            this.helper = $('<div class="ui-selectable-helper"></div>');
        };

        exports.dispose = function () {
            this.$super(arguments);
            this.selectees
                .removeClass('ui-selectee')
                .removeData('selectable-item');
            this.element.removeClass('ui-selectable ui-selectable-disabled');
        };

        exports.mouseStart = function (event) {
            var me = this;
            var options = this.options;

            this.mousePosition = [event.pageX, event.pageY];

            if (this.options.disabled) {
                return;
            }

            this.selectees = $(options.filter, this.element[0]);

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
            this.selectees.filter('.ui-selected').each(
                function () {
                    var selectee = $.data(this, 'selectable-item');
                    selectee.startselected = true;
                    if (!event.metaKey && !event.ctrlKey) {
                        selectee.$element.removeClass('ui-selected');
                        selectee.selected = false;
                        selectee.$element.addClass('ui-unselecting');
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
                        var doSelect = (!event.metaKey && !event.ctrlKey)
                            || !selectee.$element.hasClass('ui-selected');
                        selectee.$element
                            .removeClass(doSelect ? 'ui-unselecting' : 'ui-selected')
                            .addClass(doSelect ? 'ui-selecting' : 'ui-unselecting');
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
            return this.$super(arguments);
        };

        exports.mouseDrag = function (event) {
            this.dragged = true;

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
                            selectee.$element.removeClass('ui-selected');
                            selectee.selected = false;
                        }
                        if (selectee.unselecting) {
                            selectee.$element.removeClass('ui-unselecting');
                            selectee.unselecting = false;
                        }
                        if (!selectee.selecting) {
                            selectee.$element.addClass('ui-selecting');
                            selectee.selecting = true;
                            me.trigger('selecting', event, {selecting: selectee.element});
                        }
                    }
                    // 未选中处理,拖拽结束前，置状态为unselecting
                    else {
                        if (selectee.selecting) {
                            if ((event.metaKey || event.ctrlKey) && selectee.startselected) {
                                selectee.$element.removeClass('ui-selecting');
                                selectee.selecting = false;
                                selectee.$element.addClass('ui-selected');
                                selectee.selected = true;
                            }
                            else {
                                selectee.$element.removeClass('ui-selecting');
                                selectee.selecting = false;
                                if (selectee.startselected) {
                                    selectee.$element.addClass('ui-unselecting');
                                    selectee.unselecting = true;
                                }
                                me.trigger('unselecting', event, {unselecting: selectee.element});
                            }
                        }
                        if (selectee.selected) {
                            if (!event.metaKey && !event.ctrlKey && !selectee.startselected) {
                                selectee.$element.removeClass('ui-selected');
                                selectee.selected = false;

                                selectee.$element.addClass('ui-unselecting');
                                selectee.unselecting = true;
                                me.trigger('unselecting', event, {unselecting: selectee.element});
                            }
                        }
                    }
                }
            );
            return false;
        };

        exports.mouseStop = function (event) {
            var me = this;

            this.dragged = false;

            // 选择结束后处理
            // unselecting --> unselected
            // selecting --> selected
            $('.ui-unselecting', this.element[0]).each(
                function () {
                    var selectee = $.data(this, 'selectable-item');
                    selectee.$element.removeClass('ui-unselecting');
                    selectee.unselecting = false;
                    selectee.startselected = false;
                    me.trigger('unselected', event, {unselected: selectee.element});
                }
            );

            $('.ui-selecting', this.element[0]).each(
                function () {
                    var selectee = $.data(this, 'selectable-item');
                    selectee.$element.removeClass('ui-selecting').addClass('ui-selected');
                    selectee.selecting = false;
                    selectee.selected = true;
                    selectee.startselected = true;

                    me.trigger('selected', event, {selected: selectee.element});
                }
            );
            this.$super(arguments);
            this.helper.remove();
            return false;
        };



        var Selectable = require('eoo').create(Mouse, exports);

        require('./bridge')('selectable', Selectable);

        return Selectable;
    }
);
