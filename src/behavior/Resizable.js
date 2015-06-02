/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file resizable
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {

        var $ = require('jquery');
        var u = require('underscore');
        require('./util');

        var Mouse = require('./Mouse');

        var exports = {};

        exports.type = 'resizable';

        /**
         * 构造函数
         * @param {Object} options
         * options属性参考defaultProperties
         */
        exports.constructor = function (options) {
            options = u.extend(
                {
                    // 跟随当前元素进行缩放
                    alsoResize: false,
                    // 动画效果
                    animate: false,
                    animateDuration: 'slow',
                    animateEasing: 'swing',
                    // 按固定比例进行缩放
                    aspectRatio: false,
                    // handler是否自动隐藏
                    autoHide: false,
                    // 缩放区域
                    containment: false,
                    // 按固定步长缩放
                    grid: false,
                    // handle位置
                    handles: 'e,s,se',
                    // 跟随鼠标缩放的元素，缩放完成后，再变换原始元素
                    helper: false,
                    // 长宽限制
                    maxHeight: null,
                    maxWidth: null,
                    minHeight: 10,
                    minWidth: 10,
                    // handle zIndex
                    zIndex: 90,

                    // callbacks
                    resize: null,
                    start: null,
                    stop: null
                },
                options
            );
            this.$super(arguments);

            this.customEventPrefix = 'resizable';
        };

        /**
         * 取整
         * @param {string} value 要取整的值
         * @return {number}
         */
        function num(value) {
            return parseInt(value, 10) || 0;
        }

        /**
         * 元素是否允许滚动条
         * @param {element} element 元素
         * @param {string=} leftOrTop 横向还是纵向
         * @return {boolean}
         */
        function hasScroll(element, leftOrTop) {

            if ($(element).css('overflow') === 'hidden') {
                return false;
            }

            var scroll = (leftOrTop && leftOrTop === 'left') ? 'scrollLeft' : 'scrollTop';
            if (element[scroll] > 0) {
                return true;
            }

            var has = false;
            element[scroll] = 1;
            has = (element[scroll] > 0);
            element[scroll] = 0;
            return has;
        }

        /**
         * 初始化
         */
        exports.init = function () {

            var me = this;
            var options = this.options;
            this.addClass();

            u.extend(
                this,
                {
                    isAspectRatio: !!(options.aspectRatio),
                    aspectRatio: options.aspectRatio,
                    originalElement: this.element,
                    proportionallyResizeElements: [],
                    oHelper: options.helper || options.animate
                        ? options.helper || 'ui-resizable-helper' : null
                }
            );

            // 如果元素不能包裹子元素，则在外层加一个wrapper
            if (this.element[0].nodeName.match(/^(canvas|textarea|input|select|button|img)$/i)) {

                this.element.wrap(
                    $('<div class="ui-wrapper" style="overflow: hidden;"></div>').css(
                        {
                            position: this.element.css('position'),
                            width: this.element.outerWidth(),
                            height: this.element.outerHeight(),
                            top: this.element.css('top'),
                            left: this.element.css('left')
                        }
                    )
                );

                this.element = this.element.parent().data(
                    this.classPrefix,
                    this.element.resizable('instance')
                );

                this.elementIsWrapper = true;

                var originalElement = this.originalElement;
                this.element.css(
                    {
                        marginLeft: originalElement.css('marginLeft'),
                        marginTop: originalElement.css('marginTop'),
                        marginRight: originalElement.css('marginRight'),
                        marginBottom: originalElement.css('marginBottom')
                    }
                );
                originalElement.css(
                    {
                        marginLeft: 0,
                        marginTop: 0,
                        marginRight: 0,
                        marginBottom: 0
                    }
                );
                // support: Safari
                // Prevent Safari textarea resize
                this.originalResizeStyle = originalElement.css('resize');
                originalElement.css('resize', 'none');

                this.proportionallyResizeElements.push(
                    originalElement.css(
                        {
                            position: 'static',
                            zoom: 1,
                            display: 'block'
                        }
                   )
                );

                // support: IE9
                // avoid IE jump (hard set the margin)
                originalElement.css({margin: originalElement.css('margin')});

                proportionallyResize.call(this);
            }

            var directs = 'n,e,s,w,se,sw,ne,nw';
            this.handles = options.handles ||
                (
                    !$('.ui-resizable-handle', this.element).length
                        ? 'e,s,se'
                        : u.map(
                            directs.split(','),
                            function (direct) {
                                return '.' + this.getClassname(direct);
                            }
                        )
                );

            this._handles = $();
            if (u.isString(this.handles)) {

                if (this.handles === 'all') {
                    this.handles = directs;
                }

                var handles = this.handles.split(',');
                this.handles = {};

                for (var i = 0; i < handles.length; i++) {

                    var handle = $.trim(handles[i]);
                    var axis = $('<div>');
                    this.addClass(axis, 'handle');
                    this.addClass(axis, this.getClassName(handle));

                    axis.css({zIndex: options.zIndex});

                    this.handles[handle] = '.' + this.getClassName(handle);
                    this.element.append(axis);
                }

            }

            function renderAxis(target) {

                target = target || this.element;

                for (var i in this.handles) {

                    if (u.isString(this.handles[i])) {
                        this.handles[i] = this.element.children(this.handles[i]).first().show();
                    }
                    else if (this.handles[i].jquery || this.handles[i].nodeType) {
                        this.handles[i] = $(this.handles[i]);
                        this.on(
                            this.handles[i],
                            {
                                mousedown: me.mouseDown
                            }
                        );
                    }

                    if (this.elementIsWrapper
                        && this.originalElement[0].nodeName.match(/^(textarea|input|select|button)$/i)) {

                        var axis = $(this.handles[i], this.element);

                        var padWrapper = /sw|ne|nw|se|n|s/.test(i) ? axis.outerHeight() : axis.outerWidth();

                        var padPos = ['padding',
                            /ne|nw|n/.test(i) ? 'Top' :
                            /se|sw|s/.test(i) ? 'Bottom' :
                            /^e$/.test(i) ? 'Right' : 'Left'].join('');

                        target.css(padPos, padWrapper);

                        proportionallyResize.call(this);
                    }

                    this._handles = this._handles.add(this.handles[i]);
                }
            }

            // TODO: make renderAxis a prototype function
            renderAxis.call(this, this.element);

            this._handles = this._handles.add(
                this.element.find('.' + this.getClassName('handle'))
            );
            this._handles.disableSelection();

            this._handles.mouseover(
                function () {
                    if (!me.resizing) {
                        var axis;
                        if (this.className) {
                            var regex = new RegExp(this.classPrefix + '-(se|sw|ne|nw|n|e|s|w)', 'i');
                            axis = this.className.match(regex);
                        }
                        me.axis = axis && axis[1] ? axis[1] : 'se';
                    }
                }
            );

            // 自动隐藏handle
            if (options.autoHide) {
                this._handles.hide();
                this.addClass('autohide');
                $(this.element)
                    .mouseenter(
                        function () {
                            if (options.disabled) {
                                return;
                            }
                            me.removeClass('autohide');
                            me._handles.show();
                        }
                    )
                    .mouseleave(
                        function () {
                            if (options.disabled) {
                                return;
                            }
                            if (!me.resizing) {
                                me.addClass('autohide');
                                me._handles.hide();
                            }
                        }
                    );
            }
            this.$super(arguments);
        };

        exports.dispose = function () {

            var _destroy = function (exp) {
                $(exp)
                    .removeData('resizable')
                    .removeData('ui-resizable')
                    .unbind('.resizable')
                    .find('.' + this.getClassName('handle'))
                    .remove();
            };

            // TODO: Unwrap at same DOM position
            if (this.elementIsWrapper) {
                _destroy(this.element);
                var wrapper = this.element;
                this.originalElement.css({
                    position: wrapper.css('position'),
                    width: wrapper.outerWidth(),
                    height: wrapper.outerHeight(),
                    top: wrapper.css('top'),
                    left: wrapper.css('left')
                }).insertAfter(wrapper);
                wrapper.remove();
            }

            this.originalElement.css('resize', this.originalResizeStyle);
            _destroy(this.originalElement);
            this.$super(arguments);
        };

        exports.mouseCapture = function (event) {
            var capture = false;

            u.each(
                this.handles,
                function (handle) {
                    handle = $(handle)[0];
                    if (handle === event.target || $.contains(handle, event.target)) {
                        capture = true;
                    }
                }
            );

            return !this.options.disabled && capture;
        };

        exports.mouseStart = function (event) {

            this.resizing = true;

            renderProxy.call(this);

            var curleft = num.call(this, this.helper.css('left'));
            var curtop = num.call(this, this.helper.css('top'));

            var options = this.options;
            if (options.containment) {
                curleft += $(options.containment).scrollLeft() || 0;
                curtop += $(options.containment).scrollTop() || 0;
            }

            this.offset = this.helper.offset();
            this.position = {left: curleft, top: curtop};

            var el = this.element;
            this.size = this.oHelper
                ? {
                    width: this.helper.width(),
                    height: this.helper.height()
                }
                : {
                    width: el.width(),
                    height: el.height()
                };

            this.originalSize = this.oHelper ? {
                    width: el.outerWidth(),
                    height: el.outerHeight()
                } : {
                    width: el.width(),
                    height: el.height()
                };

            this.sizeDiff = {
                width: el.outerWidth() - el.width(),
                height: el.outerHeight() - el.height()
            };

            this.originalPosition = {left: curleft, top: curtop};
            this.originalMousePosition = {left: event.pageX, top: event.pageY};

            this.aspectRatio = (typeof options.aspectRatio === 'number') ?
                options.aspectRatio :
                ((this.originalSize.width / this.originalSize.height) || 1);

            var cursor = $('.ui-resizable-' + this.axis).css('cursor');
            $('body').css('cursor', cursor === 'auto' ? this.axis + '-resize' : cursor);

            this.addClass('resizing');
            propagate.call(this, 'start', event);
            return true;
        };

        var change = {
            e: function (event, dx) {
                return {width: this.originalSize.width + dx};
            },
            w: function (event, dx) {
                var cs = this.originalSize;
                var sp = this.originalPosition;
                return {left: sp.left + dx, width: cs.width - dx};
            },
            n: function (event, dx, dy) {
                var cs = this.originalSize;
                var sp = this.originalPosition;
                return {top: sp.top + dy, height: cs.height - dy};
            },
            s: function (event, dx, dy) {
                return {height: this.originalSize.height + dy};
            },
            se: function (event, dx, dy) {
                return $.extend(change.s.apply(this, arguments),
                    change.e.apply(this, [event, dx, dy]));
            },
            sw: function (event, dx, dy) {
                return $.extend(change.s.apply(this, arguments),
                    change.w.apply(this, [event, dx, dy]));
            },
            ne: function (event, dx, dy) {
                return $.extend(change.n.apply(this, arguments),
                    change.e.apply(this, [event, dx, dy]));
            },
            nw: function (event, dx, dy) {
                return $.extend(change.n.apply(this, arguments),
                    change.w.apply(this, [event, dx, dy]));
            }
        };

        exports.mouseDrag = function (event) {

            var smp = this.originalMousePosition;

            updatePrevProperties.call(this);

            var trigger = change[this.axis];
            if (!trigger) {
                return false;
            }

            var dx = (event.pageX - smp.left) || 0;
            var dy = (event.pageY - smp.top) || 0;
            var data = trigger.apply(this, [event, dx, dy]);

            updateVirtualBoundaries.call(this, event.shiftKey);
            if (this.isAspectRatio || event.shiftKey) {
                data = updateRatio.call(this, data, event);
            }

            data = respectSize.call(this, data, event);

            updateCache.call(this, data);

            propagate.call(this, 'resize', event);

            var props = applyChanges.call(this);

            if (!this.oHelper && this.proportionallyResizeElements.length) {
                proportionallyResize.call(this);
            }

            if (!$.isEmptyObject(props)) {
                updatePrevProperties.call(this);
                this.trigger('resize', event, ui.call(this));
                applyChanges.call(this);
            }

            return false;
        };

        exports.mouseStop = function (event) {

            this.resizing = false;
            var me = this;

            if (this.oHelper) {
                var pr = this.proportionallyResizeElements;
                var ista = pr.length && (/textarea/i).test(pr[0].nodeName);
                var soffseth = ista && hasScroll(pr[0], 'left') ? 0 : me.sizeDiff.height;
                var soffsetw = ista ? 0 : me.sizeDiff.width;

                var size = {
                    width: (me.helper.width()  - soffsetw),
                    height: (me.helper.height() - soffseth)
                };
                var left = (parseInt(me.element.css('left'), 10) +
                    (me.position.left - me.originalPosition.left)) || null;
                var top = (parseInt(me.element.css('top'), 10) +
                    (me.position.top - me.originalPosition.top)) || null;

                var options = this.options;
                if (!options.animate) {
                    this.element.css($.extend(size, {top: top, left: left}));
                }

                me.helper.height(me.size.height);
                me.helper.width(me.size.width);

                if (this.oHelper && !options.animate) {
                    proportionallyResize.call(this);
                }
            }

            $('body').css('cursor', 'auto');

            this.removeClass('resizing');

            propagate.call(this, 'stop', event);

            if (this.oHelper) {
                this.helper.remove();
            }

            return false;

        };

        function updatePrevProperties() {
            this.prevPosition = {
                top: this.position.top,
                left: this.position.left
            };
            this.prevSize = {
                width: this.size.width,
                height: this.size.height
            };
        }

        function applyChanges() {
            var props = {};

            if (this.position.top !== this.prevPosition.top) {
                props.top = this.position.top + 'px';
            }
            if (this.position.left !== this.prevPosition.left) {
                props.left = this.position.left + 'px';
            }
            if (this.size.width !== this.prevSize.width) {
                props.width = this.size.width + 'px';
            }
            if (this.size.height !== this.prevSize.height) {
                props.height = this.size.height + 'px';
            }

            this.helper.css(props);

            return props;
        }

        function updateVirtualBoundaries(forceAspectRatio) {

            var options = this.options;
            var boundary = {
                minWidth: u.isNumber(options.minWidth) ? options.minWidth : 0,
                maxWidth: u.isNumber(options.maxWidth) ? options.maxWidth : Infinity,
                minHeight: u.isNumber(options.minHeight) ? options.minHeight : 0,
                maxHeight: u.isNumber(options.maxHeight) ? options.maxHeight : Infinity
            };

            if (this.isAspectRatio || forceAspectRatio) {
                var pMinWidth = boundary.minHeight * this.aspectRatio;
                var pMinHeight = boundary.minWidth / this.aspectRatio;
                var pMaxWidth = boundary.maxHeight * this.aspectRatio;
                var pMaxHeight = boundary.maxWidth / this.aspectRatio;

                if (pMinWidth > boundary.minWidth) {
                    boundary.minWidth = pMinWidth;
                }
                if (pMinHeight > boundary.minHeight) {
                    boundary.minHeight = pMinHeight;
                }
                if (pMaxWidth < boundary.maxWidth) {
                    boundary.maxWidth = pMaxWidth;
                }
                if (pMaxHeight < boundary.maxHeight) {
                    boundary.maxHeight = pMaxHeight;
                }
            }
            this.vBoundaries = boundary;
        }

        function updateCache(data) {
            this.offset = this.helper.offset();
            if (u.isNumber(data.left)) {
                this.position.left = data.left;
            }
            if (u.isNumber(data.top)) {
                this.position.top = data.top;
            }
            if (u.isNumber(data.height)) {
                this.size.height = data.height;
            }
            if (u.isNumber(data.width)) {
                this.size.width = data.width;
            }
        }

        function updateRatio(data) {

            if (u.isNumber(data.height)) {
                data.width = (data.height * this.aspectRatio);
            }
            else if (u.isNumber(data.width)) {
                data.height = (data.width / this.aspectRatio);
            }

            var axis = this.axis;
            var cpos = this.position;
            var csize = this.size;
            if (axis === 'sw') {
                data.left = cpos.left + (csize.width - data.width);
                data.top = null;
            }
            if (axis === 'nw') {
                data.top = cpos.top + (csize.height - data.height);
                data.left = cpos.left + (csize.width - data.width);
            }

            return data;
        }

        function respectSize(data) {

            var options = this.vBoundaries;
            var ismaxw = u.isNumber(data.width) && options.maxWidth && (options.maxWidth < data.width);
            var ismaxh = u.isNumber(data.height) && options.maxHeight && (options.maxHeight < data.height);
            var isminw = u.isNumber(data.width) && options.minWidth && (options.minWidth > data.width);
            var isminh = u.isNumber(data.height) && options.minHeight && (options.minHeight > data.height);
            if (isminw) {
                data.width = options.minWidth;
            }
            if (isminh) {
                data.height = options.minHeight;
            }
            if (ismaxw) {
                data.width = options.maxWidth;
            }
            if (ismaxh) {
                data.height = options.maxHeight;
            }

            var axis = this.axis;
            var cw = /sw|nw|w/.test(axis);
            var ch = /nw|ne|n/.test(axis);
            var dw = this.originalPosition.left + this.originalSize.width;
            var dh = this.position.top + this.size.height;
            if (isminw && cw) {
                data.left = dw - options.minWidth;
            }
            if (ismaxw && cw) {
                data.left = dw - options.maxWidth;
            }
            if (isminh && ch) {
                data.top = dh - options.minHeight;
            }
            if (ismaxh && ch) {
                data.top = dh - options.maxHeight;
            }

            // Fixing jump error on top/left - bug #2330
            if (!data.width && !data.height && !data.left && data.top) {
                data.top = null;
            }
            else if (!data.width && !data.height && !data.top && data.left) {
                data.left = null;
            }

            return data;
        }

        function getPaddingPlusBorderDimensions(element) {
            var css = element.css;
            var borders = [
                css('borderTopWidth'),
                css('borderRightWidth'),
                css('borderBottomWidth'),
                css('borderLeftWidth')
            ];
            var paddings = [
                css('paddingTop'),
                css('paddingRight'),
                css('paddingBottom'),
                css('paddingLeft')
            ];

            var widths = [];
            for (var i = 0; i < 4; i++) {
                widths[i] = (parseInt(borders[i], 10) || 0);
                widths[i] += (parseInt(paddings[i], 10) || 0);
            }

            return {
                height: widths[0] + widths[2],
                width: widths[1] + widths[3]
            };
        }

        function proportionallyResize() {

            if (!this.proportionallyResizeElements.length) {
                return;
            }

            for (var i = 0; i < this.proportionallyResizeElements.length; i++) {

                var prel = this.proportionallyResizeElements[i];

                // TODO: Seems like a bug to cache this.outerDimensions
                // considering me we are in a loop.
                if (!this.outerDimensions) {
                    this.outerDimensions = getPaddingPlusBorderDimensions.call(this, prel);
                }

                var element = this.helper || this.element;
                prel.css({
                    height: (element.height() - this.outerDimensions.height) || 0,
                    width: (element.width() - this.outerDimensions.width) || 0
                });

            }

        }

        function renderProxy() {

            this.elementOffset = this.element.offset();

            if (this.oHelper) {

                this.helper = this.helper || $('<div style="overflow:hidden;"></div>');

                this.addClass(this.helper, this.oHelper);
                this.helper.css({
                    width: this.element.outerWidth() - 1,
                    height: this.element.outerHeight() - 1,
                    position: 'absolute',
                    left: this.elementOffset.left + 'px',
                    top: this.elementOffset.top + 'px',
                    zIndex: ++this.options.zIndex // TODO: Don't modify option
                });

                this.helper
                    .appendTo('body')
                    .disableSelection();

            }
            else {
                this.helper = this.element;
            }

        }


        function propagate(n, event) {
            // $.ui.plugin.call(this, n, [event, this.ui()]);
            if (n !== 'resize') {
                this.trigger(n, event, ui.call(this));
            }
        }

        function ui() {
            return {
                originalElement: this.originalElement,
                element: this.element,
                helper: this.helper,
                position: this.position,
                size: this.size,
                originalSize: this.originalSize,
                originalPosition: this.originalPosition
            };
        }

        /**
         * 销毁
         */
        exports.dispose = function () {
            this.$super(arguments);
        };

        var Resizable = require('eoo').create(Mouse, exports);

        require('./bridge')('resizable', Resizable);

        return Resizable;

    }
);
