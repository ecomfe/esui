/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 鼠标滚轮事件
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {

        var $ = require('jquery');

        // 最小delta值，即滚轮滚动的最小单位
        var lowestDelta;

        var toFix = ['wheel', 'mousewheel'];
        if ($.event.fixHooks) {
            for (var i = toFix.length; i;) {
                $.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
            }
        }

        var special = $.event.special.mousewheel = {

            setup: function () {
                if (this.addEventListener) {
                    this.addEventListener('wheel', handler, false);
                }
                else if (this.attachEvent) {
                    this.attachEvent('mousewheel', handler);
                }
                else {
                    this.onmousewheel = handler;
                }
                // 缓存line-height 和 page-height
                $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
                $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
            },

            teardown: function () {
                if (this.removeEventListener) {
                    this.removeEventListener('wheel', handler, false);
                }
                else if (this.detachEvent) {
                    this.detachEvent('mousewheel', handler);
                }
                else {
                    this.onmousewheel = null;
                }
                // 清除缓存在元素上面的相关数据
                $.removeData(this, 'mousewheel-line-height');
                $.removeData(this, 'mousewheel-page-height');
            },

            getLineHeight: function (elem) {
                var $elem = $(elem);
                var $parent = $elem.offsetParent();
                return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
            },

            getPageHeight: function (elem) {
                return $(elem).height();
            }
        };

        $.fn.extend({
            mousewheel: function (fn) {
                return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
            },

            unmousewheel: function (fn) {
                return this.unbind('mousewheel', fn);
            }
        });

        function normalize(delta) {
            return Math[delta >= 1 ? 'floor' : 'ceil'](delta  / lowestDelta);
        }


        function handler(event) {
            var orgEvent = event || window.event;
            event = $.event.fix(orgEvent);
            event.type = 'mousewheel';

            var deltaY = 0;
            var deltaX = 0;
            // detail只在opera中有效, 负数表示页面向右下方向
            if ('detail' in orgEvent) {
                deltaY = orgEvent.detail * -1;
            }

            // for IE8
            if ('wheelDelta' in orgEvent) {
                deltaY = orgEvent.wheelDelta;
            }
            if ('wheelDeltaY' in orgEvent) {
                deltaY = orgEvent.wheelDeltaY;
            }
            if ('wheelDeltaX' in orgEvent) {
                deltaX = orgEvent.wheelDeltaX * -1;
            }

            var delta = deltaY === 0 ? deltaX : deltaY;

            if ('deltaY' in orgEvent) {
                deltaY = orgEvent.deltaY * -1;
                delta = deltaY;
            }
            if ('deltaX' in orgEvent) {
                deltaX = orgEvent.deltaX;
                if (deltaY === 0) {
                    delta = deltaX * -1;
                }
            }

            if (deltaY === 0 && deltaX === 0) {
                return;
            }

            // deltaMode由外部操作系统和浏览器决定，有3种：
            //     0: px
            //     1: line height
            //     2: page height
            // 其中line height和page height要转成px
            if (orgEvent.deltaMode === 1) {
                var lineHeight = $.data(this, 'mousewheel-line-height');
                delta *= lineHeight;
                deltaY *= lineHeight;
                deltaX *= lineHeight;
            }
            else if (orgEvent.deltaMode === 2) {
                var pageHeight = $.data(this, 'mousewheel-page-height');
                delta *= pageHeight;
                deltaY *= pageHeight;
                deltaX *= pageHeight;
            }

            // 缓存lowestDelta, 用于normalize delta
            var absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));
            if (!lowestDelta || absDelta < lowestDelta) {
                lowestDelta = absDelta;
            }

            // normalize
            delta = normalize(delta);
            deltaX = normalize(deltaX);
            deltaY = normalize(deltaY);

            event.deltaX = deltaX;
            event.deltaY = deltaY;
            event.deltaFactor = lowestDelta;
            // 已经将line-height和page-height模式
            event.deltaMode = 0;

            var args = Array.prototype.slice.call(arguments, 1);
            args.unshift(event, delta, deltaX, deltaY);

            return ($.event.dispatch || $.event.handle).apply(this, args);
        }
    }
);
