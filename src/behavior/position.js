/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 元素 / 鼠标定位
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {

        var $ = require('jquery');
        var u = require('underscore');

        var max = Math.max;
        var abs = Math.abs;
        var round = Math.round;
        // 缓存jquery原position函数
        var jqPosition = $.fn.position;

        /**
         * offset是否支持小数
         * Support: IE <=9 only
         * @return {boolean}
         */
        var supportsOffsetFractions = function () {
            var element = $('<div>')
                    .css('position', 'absolute')
                    .appendTo('body')
                    .offset(
                        {
                            top: 1.5,
                            left: 1.5
                        }
                    );
            var support = element.offset().top === 1.5;

            element.remove();

            supportsOffsetFractions = function () {
                return support;
            };

            return support;
        };

        var rpercent = /%$/;

        /**
         * 计算offset值，offset可以为百分数
         * @param {Array} offsets 原始offset
         * @param {number} width 如果是百分数，则相对父元素宽度
         * @param {number} height 如果是百分数，则相对父元素高度
         * @return {Array}
         */
        function getOffsets(offsets, width, height) {
            return [
                parseFloat(offsets[0]) * (rpercent.test(offsets[0]) ? width / 100 : 1),
                parseFloat(offsets[1]) * (rpercent.test(offsets[1]) ? height / 100 : 1)
            ];
        }

        /**
         * 获取css值，并去掉单位
         * @param {Element} element 目标元素
         * @param {string} property 属性
         *
         * @return {number}
         */
        function parseCss(element, property) {
            return parseInt($.css(element, property), 10) || 0;
        }

        /**
         * @typedef {Object} Offset  描述元素位置
         * @property {Number} left - 水平偏移
         * @property {Number} top - 垂直偏移
         */

        /**
         * @typedef {Object} Dimension  描述元素尺寸、位置
         * @property {Number} width - 元素宽度
         * @property {Number} height - 元素高
         * @property {Offset} offset - 元素位置
         */

        /**
         * 获取元素dimensions
         * @param {Element} elem 目标元素
         * @param {string} property 属性
         *
         * @return {Dimension}
         */
        function getDimensions(elem) {
            var raw = elem[0];
            if (raw.nodeType === 9) {
                return {
                    width: elem.width(),
                    height: elem.height(),
                    offset: {
                        top: 0,
                        left: 0
                    }
                };
            }
            if ($.isWindow(raw)) {
                return {
                    width: elem.width(),
                    height: elem.height(),
                    offset: {
                        top: elem.scrollTop(),
                        left: elem.scrollLeft()
                    }
                };
            }
            if (raw.preventDefault) {
                return {
                    width: 0,
                    height: 0,
                    offset: {
                        top: raw.pageY,
                        left: raw.pageX
                    }
                };
            }
            return {
                width: elem.outerWidth(),
                height: elem.outerHeight(),
                offset: elem.offset()
            };
        }

        // 滚动条的尺寸,即横向滚动条的高度、纵向滚动条的宽度
        var cachedScrollbarWidth;

        /**
         * 获取滚动条尺寸
         *
         * @return {number}
         */
        function scrollbarWidth() {
            if (cachedScrollbarWidth !== undefined) {
                return cachedScrollbarWidth;
            }
            var div = $(
                [
                    '<div style="display:block;position:absolute;width:50px;height:50px;overflow:hidden;">',
                    '   <div style="height:100px;width:auto;"></div>',
                    '</div>'
                ].join('')
            );
            $('body').append(div);

            var innerDiv = div.children()[0];
            var w1 = innerDiv.offsetWidth;
            div.css('overflow', 'scroll');
            var w2 = innerDiv.offsetWidth;

            if (w1 === w2) {
                w2 = div[0].clientWidth;
            }
            div.remove();
            return (cachedScrollbarWidth = w1 - w2);
        }

        /**
         * 获取容器的滚动条信息
         * @param {Element} within 容器元素
         *
         * @return {Object}
         */
        function getScrollInfo(within) {
            var overflowX = within.isWindow || within.isDocument ? '' :
                    within.element.css('overflow-x');
            var overflowY = within.isWindow || within.isDocument ? '' :
                    within.element.css('overflow-y');
            var hasOverflowX = overflowX === 'scroll'
                    || (overflowX === 'auto' && within.width < within.element[0].scrollWidth);
            var hasOverflowY = overflowY === 'scroll'
                    || (overflowY === 'auto' && within.height < within.element[0].scrollHeight);
            return {
                width: hasOverflowY ? scrollbarWidth() : 0,
                height: hasOverflowX ? scrollbarWidth() : 0
            };
        }

        /**
         * 获取容器相关信息
         * @param {Element} element 容器元素
         *
         * @return {Object}
         */
        function getWithinInfo(element) {
            var withinElement = $(element || window);
            var isWindow = $.isWindow(withinElement[0]);
            var isDocument = !!withinElement[0] && withinElement[0].nodeType === 9;
            return {
                element: withinElement,
                isWindow: isWindow,
                isDocument: isDocument,
                offset: withinElement.offset() || {left: 0, top: 0},
                scrollLeft: withinElement.scrollLeft(),
                scrollTop: withinElement.scrollTop(),
                width: withinElement.outerWidth(),
                height: withinElement.outerHeight()
            };
        }

        /**
         * 元素在其容器中定位时如果越界，则需要进行处理：
         * 1. flip: 翻转,以边界为中心线翻转到另一侧
         * 2. fit: 自动适应，紧贴边界
         * 3. flipfit: 分别应用flip和fit策略
         */
        var collisionFunctionMap = {
            fitleft: function (position, data) {
                var within = data.within;
                var withinOffset = within.isWindow ? within.scrollLeft : within.offset.left;
                var outerWidth = within.width;
                var collisionPosLeft = position.left - data.collisionPosition.marginLeft;
                var overLeft = withinOffset - collisionPosLeft;
                var overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset;

                // 定位元素比容器宽
                if (data.collisionWidth > outerWidth) {
                    // 定位元素左边界在within左边界的左侧，
                    // 定位元素右边界在within右边界的右侧
                    if (overLeft > 0 && overRight <= 0) {
                        var newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
                        position.left += overLeft - newOverRight;
                    }
                    // 定位元素左边界在within左边界的右侧，
                    // 定位元素右边界在within右边界的右侧
                    else if (overRight > 0 && overLeft <= 0) {
                        position.left = withinOffset;
                    }
                    else {
                        // 定位元素中心点在within中心点左侧
                        if (overLeft > overRight) {
                            position.left = withinOffset + outerWidth - data.collisionWidth;
                        }
                        // 定位元素中心点在within中心点右侧
                        else {
                            position.left = withinOffset;
                        }
                    }
                }
                // 如果定位元素左侧越过of元素左侧边界，则与左侧边界对齐
                else if (overLeft > 0) {
                    position.left += overLeft;
                }
                // 如果定位元素右侧越过of元素右侧边界，则与右侧边界对齐
                else if (overRight > 0) {
                    position.left -= overRight;
                }
                else {
                    position.left = max(position.left - collisionPosLeft, position.left);
                }
            },
            fittop: function (position, data) {
                var within = data.within;
                var withinOffset = within.isWindow ? within.scrollTop : within.offset.top;
                var outerHeight = data.within.height;
                var collisionPosTop = position.top - data.collisionPosition.marginTop;
                var overTop = withinOffset - collisionPosTop;
                var overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset;

                // 定位元素比容器高
                if (data.collisionHeight > outerHeight) {
                    // 定位元素上边界在within上边界的上边，
                    // 定位元素下边界在within下边界的下边
                    if (overTop > 0 && overBottom <= 0) {
                        var newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
                        position.top += overTop - newOverBottom;
                    }
                    // 与上边的if相反
                    else if (overBottom > 0 && overTop <= 0) {
                        position.top = withinOffset;
                    }
                    else {
                        // 中心点比较
                        if (overTop > overBottom) {
                            position.top = withinOffset + outerHeight - data.collisionHeight;
                        }
                        else {
                            position.top = withinOffset;
                        }
                    }
                }
                // 定位元素上侧在of元素上侧的上侧,则紧贴上侧边界
                else if (overTop > 0) {
                    position.top += overTop;
                }
                // 同理，下侧
                else if (overBottom > 0) {
                    position.top -= overBottom;
                }
                else {
                    position.top = max(position.top - collisionPosTop, position.top);
                }
            },
            flipleft: function (position, data) {
                var within = data.within;
                var withinOffset = within.offset.left + within.scrollLeft;
                var outerWidth = within.width;
                var offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left;
                var collisionPosLeft = position.left - data.collisionPosition.marginLeft;
                var overLeft = collisionPosLeft - offsetLeft;
                var overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft;
                var myOffset = data.my[0] === 'left'
                    ? -data.elemWidth : data.my[0] === 'right' ?  data.elemWidth : 0;
                var atOffset = data.at[0] === 'left'
                    ? data.targetWidth : data.at[0] === 'right' ?  -data.targetWidth : 0;
                var offset = -2 * data.offset[0];

                if (overLeft < 0) {
                    var newOverRight = position.left + myOffset + atOffset + offset
                        + data.collisionWidth - outerWidth - withinOffset;
                    if (newOverRight < 0 || newOverRight < abs(overLeft)) {
                        position.left += myOffset + atOffset + offset;
                    }
                }
                else if (overRight > 0) {
                    var newOverLeft = position.left - data.collisionPosition.marginLeft
                        + myOffset + atOffset + offset - offsetLeft;
                    if (newOverLeft > 0 || abs(newOverLeft) < overRight) {
                        position.left += myOffset + atOffset + offset;
                    }
                }
            },
            fliptop: function (position, data) {
                var within = data.within;
                var withinOffset = within.offset.top + within.scrollTop;
                var outerHeight = within.height;
                var offsetTop = within.isWindow ? within.scrollTop : within.offset.top;
                var collisionPosTop = position.top - data.collisionPosition.marginTop;
                var overTop = collisionPosTop - offsetTop;
                var overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop;
                var top = data.my[1] === 'top';
                var myOffset = top ? -data.elemHeight : data.my[1] === 'bottom' ? data.elemHeight : 0;
                var atOffset = data.at[1] === 'top'
                    ? data.targetHeight : data.at[1] === 'bottom' ?  -data.targetHeight : 0;
                var offset = -2 * data.offset[1];
                if (overTop < 0) {
                    var newOverBottom = position.top + myOffset + atOffset + offset
                        + data.collisionHeight - outerHeight - withinOffset;
                    if (newOverBottom < 0 || newOverBottom < abs(overTop)) {
                        position.top += myOffset + atOffset + offset;
                    }
                }
                else if (overBottom > 0) {
                    var newOverTop = position.top - data.collisionPosition.marginTop
                        + myOffset + atOffset + offset - offsetTop;
                    if (newOverTop > 0 || abs(newOverTop) < overBottom) {
                        position.top += myOffset + atOffset + offset;
                    }
                }
            },
            flipfitleft: function () {
                collisionFunctionMap.flipleft.apply(this, arguments);
                collisionFunctionMap.fitleft.apply(this, arguments);
            },
            flipfittop: function () {
                collisionFunctionMap.fliptop.apply(this, arguments);
                collisionFunctionMap.fittop.apply(this, arguments);
            }
        };

        /**
         * @param {Object} options 定位选项
         * @param {Element} option.of 定位要参考的目标元素
         * @param {Element} option.within 定位元素只能在witnin内移动，默认`window`
         * @param {string} option.my 定义元素自身位置，需指定水平、垂直两个方向，如'left center'
         * @param {string} option.at 定义元素相对于目标元素的位置，取值参考my
         * @param {string} option.collision 元素越界后，要采取的处理策略,有`flip` / `fit` / `flipfit`
         * @param {Element=} element 要定位的元素，如果作为插件方法，则不需要这个参数
         *
         * @return {jQuery}
         */
        $.fn.position = function (options, element) {
            // 如果是原生jquery position接口
            if (!options || !options.of) {
                return jqPosition.apply(this, arguments);
            }

            // 如果是普通函数调用
            if (!this instanceof $ && element) {
                return $(element).position(options);
            }

            options = $.extend({}, options);

            var target = $(options.of);
            var dimensions = getDimensions(target);
            if (target[0].preventDefault) {
                // 如果是鼠标，则强制定位在左上角
                options.at = 'left top';
            }
            var targetWidth = dimensions.width;
            var targetHeight = dimensions.height;
            var targetOffset = dimensions.offset;
            var basePosition = $.extend({}, targetOffset);

            var rhorizontal = /left|center|right/;
            var rvertical = /top|center|bottom/;
            var roffset = /[\+\-]\d+(\.[\d]+)?%?/;
            var rposition = /^\w+/;

            var offsets = {};

            // my / at如果未指定则默认为`center`
            u.each(
                ['my', 'at'],
                function (item) {
                    var pos = (options[item] || '').split(' ');
                    if (pos.length === 1) {
                        pos = rhorizontal.test(pos[0]) ?
                            pos.concat(['center']) :
                            rvertical.test(pos[0]) ?
                                ['center'].concat(pos) :
                                ['center', 'center'];
                    }
                    pos[0] = rhorizontal.test(pos[0]) ? pos[0] : 'center';
                    pos[1] = rvertical.test(pos[1]) ? pos[1] : 'center';

                    // my / at值可以是`center-10`, `top+25%`这种混合值
                    var horizontalOffset = roffset.exec(pos[0]);
                    var verticalOffset = roffset.exec(pos[1]);
                    offsets[item] = [
                        horizontalOffset ? horizontalOffset[0] : 0,
                        verticalOffset ? verticalOffset[0] : 0
                    ];

                    // 去掉偏移值offset, offset已经存在offsets里了
                    options[item] = [
                        rposition.exec(pos[0])[0],
                        rposition.exec(pos[1])[0]
                    ];
                }
            );

            // 解析collision选项
            var collision = (options.collision || 'flip').split(' ');
            if (collision.length === 1) {
                collision[1] = collision[0];
            }

            if (options.at[0] === 'right') {
                basePosition.left += targetWidth;
            }
            else if (options.at[0] === 'center') {
                basePosition.left += targetWidth / 2;
            }

            if (options.at[1] === 'bottom') {
                basePosition.top += targetHeight;
            }
            else if (options.at[1] === 'center') {
                basePosition.top += targetHeight / 2;
            }

            var atOffset = getOffsets(offsets.at, targetWidth, targetHeight);
            basePosition.left += atOffset[0];
            basePosition.top += atOffset[1];

            var within = getWithinInfo(options.within);
            var scrollInfo = getScrollInfo(within);

            return this.each(
                function () {
                    var elem = $(this);
                    var elemWidth = elem.outerWidth();
                    var elemHeight = elem.outerHeight();

                    var position = $.extend({}, basePosition);
                    if (options.my[0] === 'right') {
                        position.left -= elemWidth;
                    }
                    else if (options.my[0] === 'center') {
                        position.left -= elemWidth / 2;
                    }

                    if (options.my[1] === 'bottom') {
                        position.top -= elemHeight;
                    }
                    else if (options.my[1] === 'center') {
                        position.top -= elemHeight / 2;
                    }

                    var myOffset = getOffsets(offsets.my, elem.outerWidth(), elem.outerHeight());
                    position.left += myOffset[0];
                    position.top += myOffset[1];

                    // 如果不支持小数，就四舍五入
                    if (!supportsOffsetFractions()) {
                        position.left = round(position.left);
                        position.top = round(position.top);
                    }

                    var marginLeft = parseCss(this, 'marginLeft');
                    var marginTop = parseCss(this, 'marginTop');
                    var collisionPosition = {
                        marginLeft: marginLeft,
                        marginTop: marginTop
                    };

                    var collisionWidth = elemWidth + marginLeft
                        + parseCss(this, 'marginRight') + scrollInfo.width;
                    var collisionHeight = elemHeight + marginTop
                        + parseCss(this, 'marginBottom') + scrollInfo.height;
                    u.each(
                        ['left', 'top'],
                        function (dir, index) {
                            var func = collisionFunctionMap[collision[index] + dir];
                            func && func(
                                position,
                                {
                                    targetWidth: targetWidth,
                                    targetHeight: targetHeight,
                                    elemWidth: elemWidth,
                                    elemHeight: elemHeight,
                                    collisionPosition: collisionPosition,
                                    collisionWidth: collisionWidth,
                                    collisionHeight: collisionHeight,
                                    offset: [atOffset[0] + myOffset[0], atOffset [1] + myOffset[1]],
                                    my: options.my,
                                    at: options.at,
                                    within: within,
                                    elem: elem
                                }
                            );
                        }
                    );

                    if (options.using) {
                        // adds feedback as second argument to using callback, if present
                        var using = function (props) {
                            var left = targetOffset.left - position.left;
                            var right = left + targetWidth - elemWidth;
                            var top = targetOffset.top - position.top;
                            var bottom = top + targetHeight - elemHeight;
                            var feedback = {
                                    target: {
                                        element: target,
                                        left: targetOffset.left,
                                        top: targetOffset.top,
                                        width: targetWidth,
                                        height: targetHeight
                                    },
                                    element: {
                                        element: elem,
                                        left: position.left,
                                        top: position.top,
                                        width: elemWidth,
                                        height: elemHeight
                                    },
                                    horizontal: right < 0 ? 'left' : left > 0 ? 'right' : 'center',
                                    vertical: bottom < 0 ? 'top' : top > 0 ? 'bottom' : 'middle'
                                };
                            if (targetWidth < elemWidth && abs(left + right) < targetWidth) {
                                feedback.horizontal = 'center';
                            }
                            if (targetHeight < elemHeight && abs(top + bottom) < targetHeight) {
                                feedback.vertical = 'middle';
                            }
                            if (max(abs(left), abs(right)) > max(abs(top), abs(bottom))) {
                                feedback.important = 'horizontal';
                            }
                            else {
                                feedback.important = 'vertical';
                            }
                            options.using.call(this, props, feedback);
                        };
                    }

                    elem.offset($.extend(position, {using: using}));
                }
            );
        };
        return $.fn.position;
    }
);
