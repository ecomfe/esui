/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 选择
 * @author liwei(liwei@iguzhi.cn)
 */
define(function(require) {
    var Mouse = require('./Mouse');

    var $ = require('jquery');
    var u = require('underscore');

    var exports = {};

    exports.type = 'selectable';

    exports.constructor = function (options, element) {
        if (arguments.length === 1) {
            element = options;
            options = {};
        }
        this.$super([options, element]);
    };

    exports.init = function() {
        this.$super(arguments);
        var selectees,
            that = this;

        this.element.addClass("ui-selectable");

        this.dragged = false;

        // cache selectee children based on filter
        this.refresh = function() {
            selectees = $(that.options.filter, that.element[0]);
            selectees.addClass("ui-selectee");
            selectees.each(function() {
                var $this = $(this),
                    pos = $this.offset();
                $.data(this, "selectable-item", {
                    element: this,
                    $element: $this,
                    left: pos.left,
                    top: pos.top,
                    right: pos.left + $this.outerWidth(),
                    bottom: pos.top + $this.outerHeight(),
                    startselected: false,
                    selected: $this.hasClass("ui-selected"),
                    selecting: $this.hasClass("ui-selecting"),
                    unselecting: $this.hasClass("ui-unselecting")
                });
            });
        };
        this.refresh();

        this.selectees = selectees.addClass("ui-selectee");

        this.helper = $("<div class='ui-selectable-helper'></div>");
    };

    exports.dispose = function() {
        this.$super(arguments);

        this.selectees
            .removeClass("ui-selectee")
            .removeData("selectable-item");
        this.element
            .removeClass("ui-selectable ui-selectable-disabled");
    };

    exports.onmousestart = function(event) {
        var that = this,
            options = this.options;

        this.opos = [event.pageX, event.pageY];

        if (this.options.disabled) {
            return;
        }

        this.selectees = $(options.filter, this.element[0]);

        this.fire("start", event);

        $(options.appendTo).append(this.helper);
        // position helper (lasso)
        this.helper.css({
            "left": event.pageX,
            "top": event.pageY,
            "width": 0,
            "height": 0
        });

        if (options.autoRefresh) {
            this.refresh();
        }

        this.selectees.filter(".ui-selected").each(function() {
            var selectee = $.data(this, "selectable-item");
            selectee.startselected = true;
            if (!event.metaKey && !event.ctrlKey) {
                selectee.$element.removeClass("ui-selected");
                selectee.selected = false;
                selectee.$element.addClass("ui-unselecting");
                selectee.unselecting = true;
                // selectable UNSELECTING callback
                event.unselecting = selectee.element;
                that.fire("unselecting", event);
            }
        });

        $(event.$target).parents().addBack().each(function() {
            var doSelect,
                selectee = $.data(this, "selectable-item");
            if (selectee) {
                doSelect = (!event.metaKey && !event.ctrlKey) || !selectee.$element.hasClass("ui-selected");
                selectee.$element
                    .removeClass(doSelect ? "ui-unselecting" : "ui-selected")
                    .addClass(doSelect ? "ui-selecting" : "ui-unselecting");
                selectee.unselecting = !doSelect;
                selectee.selecting = doSelect;
                selectee.selected = doSelect;
                // selectable (UN)SELECTING callback
                if (doSelect) {
                    event.selecting = selectee.element;
                    that.fire("selecting", event);
                } else {
                    event.unselecting = selectee.element;
                    that.fire("unselecting", event);
                }
                return false;
            }
        });

    };

    exports.onmousedrag = function(event) {
        this.dragged = true;

        if (this.options.disabled) {
            return;
        }

        var tmp,
            that = this,
            options = this.options,
            x1 = this.opos[0],
            y1 = this.opos[1],
            x2 = event.pageX,
            y2 = event.pageY;

        if (x1 > x2) {
            tmp = x2;
            x2 = x1;
            x1 = tmp;
        }
        if (y1 > y2) {
            tmp = y2;
            y2 = y1;
            y1 = tmp;
        }
        this.helper.css({
            left: x1,
            top: y1,
            width: x2 - x1,
            height: y2 - y1
        });

        this.selectees.each(function() {
            var selectee = $.data(this, "selectable-item"),
                hit = false;

            //prevent helper from being selected if appendTo: selectable
            if (!selectee || selectee.element === that.element[0]) {
                return;
            }

            if (options.tolerance === "touch") {
                hit = (!(selectee.left > x2 || selectee.right < x1 || selectee.top > y2 || selectee.bottom < y1));
            } else if (options.tolerance === "fit") {
                hit = (selectee.left > x1 && selectee.right < x2 && selectee.top > y1 && selectee.bottom < y2);
            }

            if (hit) {
                // SELECT
                if (selectee.selected) {
                    selectee.$element.removeClass("ui-selected");
                    selectee.selected = false;
                }
                if (selectee.unselecting) {
                    selectee.$element.removeClass("ui-unselecting");
                    selectee.unselecting = false;
                }
                if (!selectee.selecting) {
                    selectee.$element.addClass("ui-selecting");
                    selectee.selecting = true;
                    // selectable SELECTING callback
                    event.selecting = selectee.element;
                    that.fire("selecting", event);
                }
            } else {
                // UNSELECT
                if (selectee.selecting) {
                    if ((event.metaKey || event.ctrlKey) && selectee.startselected) {
                        selectee.$element.removeClass("ui-selecting");
                        selectee.selecting = false;
                        selectee.$element.addClass("ui-selected");
                        selectee.selected = true;
                    } else {
                        selectee.$element.removeClass("ui-selecting");
                        selectee.selecting = false;
                        if (selectee.startselected) {
                            selectee.$element.addClass("ui-unselecting");
                            selectee.unselecting = true;
                        }
                        // selectable UNSELECTING callback
                        event.unselecting = selectee.element;
                        that.fire("unselecting", event);
                    }
                }
                if (selectee.selected) {
                    if (!event.metaKey && !event.ctrlKey && !selectee.startselected) {
                        selectee.$element.removeClass("ui-selected");
                        selectee.selected = false;

                        selectee.$element.addClass("ui-unselecting");
                        selectee.unselecting = true;
                        // selectable UNSELECTING callback
                        event.unselecting = selectee.element;
                        that.fire("unselecting", event);
                    }
                }
            }
        });

        return false;
    };

    exports.onmousestop = function(event) {
        var that = this;

        this.dragged = false;

        $(".ui-unselecting", this.element[0]).each(function() {
            var selectee = $.data(this, "selectable-item");
            selectee.$element.removeClass("ui-unselecting");
            selectee.unselecting = false;
            selectee.startselected = false;
            event.unselected = selectee.element;
            that.fire("unselected", event);
        });
        $(".ui-selecting", this.element[0]).each(function() {
            var selectee = $.data(this, "selectable-item");
            selectee.$element.removeClass("ui-selecting").addClass("ui-selected");
            selectee.selecting = false;
            selectee.selected = true;
            selectee.startselected = true;

            event.selected = selectee.element;
            that.fire("selected", event);
        });
        this.fire("stop", event);

        this.helper.remove();

        return false;
    };



    var Selectable = require('eoo').create(Mouse, exports);

    var defaultProperties = {
        appendTo: "body",
        autoRefresh: true,
        distance: 0,
        filter: "*",
        tolerance: "touch",

        // callbacks
        selected: null,
        selecting: null,
        start: null,
        stop: null,
        unselected: null,
        unselecting: null
    };

    Selectable.defaultProperties = u.extend({}, Mouse.defaultProperties, defaultProperties);

    require('./bridge')('selectable', Selectable);

    return Selectable;
});