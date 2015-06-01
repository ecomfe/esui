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
                    alsoResize: false,
                    animate: false,
                    animateDuration: 'slow',
                    animateEasing: 'swing',
                    aspectRatio: false,
                    autoHide: false,
                    classes: {
                        'ui-resizable-se': 'ui-icon ui-icon-gripsmall-diagonal-se'
                    },
                    containment: false,
                    ghost: false,
                    grid: false,
                    handles: 'e,s,se',
                    helper: false,
                    maxHeight: null,
                    maxWidth: null,
                    minHeight: 10,
                    minWidth: 10,
                    // See #7960
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

        function num(value) {
            return parseInt(value, 10) || 0;
        }

        function hasScroll(el, a) {

            if ($(el).css('overflow') === 'hidden') {
                return false;
            }

            var scroll = (a && a === 'left') ? 'scrollLeft' : 'scrollTop',
                has = false;

            if (el[scroll] > 0) {
                return true;
            }

            // TODO: determine which cases actually cause this to happen
            // if the element doesn't have the scroll set, see if it's possible to
            // set the scroll
            el[scroll] = 1;
            has = (el[scroll] > 0);
            el[scroll] = 0;
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
                    _aspectRatio: !!(options.aspectRatio),
                    aspectRatio: options.aspectRatio,
                    originalElement: this.element,
                    _proportionallyResizeElements: [],
                    _helper: options.helper || options.ghost || options.animate
                        ? options.helper || 'ui-resizable-helper' : null
                }
            );

            // Wrap the element if it cannot hold child nodes
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

                this._proportionallyResizeElements.push(
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
                    axis = $('<div>');
                    this.addClass(axis, 'handle');
                    this.addClass(axis, this.getClassName(handle));

                    axis.css({zIndex: options.zIndex});

                    this.handles[handle] = '.' + this.getClassName(handle);
                    this.element.append(axis);
                }

            }

            function renderAxis(target) {

                var padPos, padWrapper;

                target = target || this.element;

                for (i in this.handles) {

                    if (this.handles[i].constructor === String) {
                        this.handles[i] = this.element.children(this.handles[i]).first().show();
                    }
                    else if (this.handles[i].jquery || this.handles[i].nodeType) {
                        this.handles[i] = $(this.handles[i]);
                        this.on(
                            this.handles[i],
                            {
                                'mousedown': me.mouseDown
                            }
                        );
                    }

                    if (this.elementIsWrapper && this.originalElement[0].nodeName.match(/^(textarea|input|select|button)$/i)) {

                        var axis = $(this.handles[i], this.element);

                        padWrapper = /sw|ne|nw|se|n|s/.test(i) ? axis.outerHeight() : axis.outerWidth();

                        padPos = ['padding',
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
                function() {
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

            if (options.autoHide) {
                this._handles.hide();
                this.addClass('autohide');
                $(this.element)
                    .mouseenter(
                        function() {
                            if (options.disabled) {
                                return;
                            }
                            me._removeClass('autohide');
                            me._handles.show();
                        }
                    )
                    .mouseleave(
                        function() {
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

        exports.destroy = function() {

            this._mouseDestroy();

            var wrapper,
                _destroy = function(exp) {
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
                wrapper = this.element;
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

            return this;
        };

        exports.mouseCapture = function(event) {
            var i, handle,
                capture = false;

            for (i in this.handles) {
                handle = $(this.handles[i])[0];
                if (handle === event.target || $.contains(handle, event.target)) {
                    capture = true;
                }
            }

            return !this.options.disabled && capture;
        };

        exports.mouseStart = function(event) {

            var curleft, curtop, cursor,
                options = this.options,
                el = this.element;

            this.resizing = true;

            renderProxy.call(this);

            curleft = num.call(this, this.helper.css('left'));
            curtop = num.call(this, this.helper.css('top'));

            if (options.containment) {
                curleft += $(options.containment).scrollLeft() || 0;
                curtop += $(options.containment).scrollTop() || 0;
            }

            this.offset = this.helper.offset();
            this.position = {left: curleft, top: curtop};

            this.size = this._helper
                ? {
                    width: this.helper.width(),
                    height: this.helper.height()
                }
                : {
                    width: el.width(),
                    height: el.height()
                };

            this.originalSize = this._helper ? {
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

            cursor = $('.ui-resizable-' + this.axis).css('cursor');
            $('body').css('cursor', cursor === 'auto' ? this.axis + '-resize' : cursor);

            this.addClass('resizing');
            this._propagate('start', event);
            return true;
        };

        var change = {
            e: function(event, dx) {
                return {width: this.originalSize.width + dx};
            },
            w: function(event, dx) {
                var cs = this.originalSize, sp = this.originalPosition;
                return {left: sp.left + dx, width: cs.width - dx};
            },
            n: function(event, dx, dy) {
                var cs = this.originalSize, sp = this.originalPosition;
                return {top: sp.top + dy, height: cs.height - dy};
            },
            s: function(event, dx, dy) {
                return {height: this.originalSize.height + dy};
            },
            se: function(event, dx, dy) {
                return $.extend(this._change.s.apply(this, arguments),
                    this._change.e.apply(this, [event, dx, dy]));
            },
            sw: function(event, dx, dy) {
                return $.extend(this._change.s.apply(this, arguments),
                    this._change.w.apply(this, [event, dx, dy]));
            },
            ne: function(event, dx, dy) {
                return $.extend(this._change.n.apply(this, arguments),
                    this._change.e.apply(this, [event, dx, dy]));
            },
            nw: function(event, dx, dy) {
                return $.extend(this._change.n.apply(this, arguments),
                    this._change.w.apply(this, [event, dx, dy]));
            }
        };

        exports.mouseDrag = function(event) {

            var data, props,
                smp = this.originalMousePosition,
                a = this.axis,
                dx = (event.pageX - smp.left) || 0,
                dy = (event.pageY - smp.top) || 0,
                trigger = this._change[a];

            updatePrevProperties.call(this);

            if (!trigger) {
                return false;
            }

            data = trigger.apply(this, [event, dx, dy]);

            updateVirtualBoundaries.call(this, event.shiftKey);
            if (this._aspectRatio || event.shiftKey) {
                data = updateRatio.call(this, data, event);
            }

            data = respectSize.call(this, data, event);

            updateCache.call(this, data);

            this._propagate('resize', event);

            props = applyChanges.call(this);

            if (!this._helper && this._proportionallyResizeElements.length) {
                proportionallyResize.call(this);
            }

            if (!$.isEmptyObject(props)) {
                updatePrevProperties.call(this);
                this._trigger('resize', event, this.ui());
                applyChanges.call(this);
            }

            return false;
        };

        exports.mouseStop = function(event) {

            this.resizing = false;
            var pr, ista, soffseth, soffsetw, s, left, top,
                options = this.options, me = this;

            if (this._helper) {

                pr = this._proportionallyResizeElements;
                ista = pr.length && (/textarea/i).test(pr[0].nodeName);
                soffseth = ista && this._hasScroll(pr[0], 'left') ? 0 : me.sizeDiff.height;
                soffsetw = ista ? 0 : me.sizeDiff.width;

                s = {
                    width: (me.helper.width()  - soffsetw),
                    height: (me.helper.height() - soffseth)
                };
                left = (parseInt(me.element.css('left'), 10) +
                    (me.position.left - me.originalPosition.left)) || null;
                top = (parseInt(me.element.css('top'), 10) +
                    (me.position.top - me.originalPosition.top)) || null;

                if (!options.animate) {
                    this.element.css($.extend(s, {top: top, left: left}));
                }

                me.helper.height(me.size.height);
                me.helper.width(me.size.width);

                if (this._helper && !options.animate) {
                    proportionallyResize.call(this);
                }
            }

            $('body').css('cursor', 'auto');

            this._removeClass('ui-resizable-resizing');

            this._propagate('stop', event);

            if (this._helper) {
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
            var pMinWidth, pMaxWidth, pMinHeight, pMaxHeight, b,
                options = this.options;

            b = {
                minWidth: this._isNumber(options.minWidth) ? options.minWidth : 0,
                maxWidth: this._isNumber(options.maxWidth) ? options.maxWidth : Infinity,
                minHeight: this._isNumber(options.minHeight) ? options.minHeight : 0,
                maxHeight: this._isNumber(options.maxHeight) ? options.maxHeight : Infinity
            };

            if (this._aspectRatio || forceAspectRatio) {
                pMinWidth = b.minHeight * this.aspectRatio;
                pMinHeight = b.minWidth / this.aspectRatio;
                pMaxWidth = b.maxHeight * this.aspectRatio;
                pMaxHeight = b.maxWidth / this.aspectRatio;

                if (pMinWidth > b.minWidth) {
                    b.minWidth = pMinWidth;
                }
                if (pMinHeight > b.minHeight) {
                    b.minHeight = pMinHeight;
                }
                if (pMaxWidth < b.maxWidth) {
                    b.maxWidth = pMaxWidth;
                }
                if (pMaxHeight < b.maxHeight) {
                    b.maxHeight = pMaxHeight;
                }
            }
            this._vBoundaries = b;
        }

        function updateCache(data) {
            this.offset = this.helper.offset();
            if (this._isNumber(data.left)) {
                this.position.left = data.left;
            }
            if (this._isNumber(data.top)) {
                this.position.top = data.top;
            }
            if (this._isNumber(data.height)) {
                this.size.height = data.height;
            }
            if (this._isNumber(data.width)) {
                this.size.width = data.width;
            }
        }

        function updateRatio(data) {

            var cpos = this.position,
                csize = this.size,
                a = this.axis;

            if (this._isNumber(data.height)) {
                data.width = (data.height * this.aspectRatio);
            }
            else if (this._isNumber(data.width)) {
                data.height = (data.width / this.aspectRatio);
            }

            if (a === 'sw') {
                data.left = cpos.left + (csize.width - data.width);
                data.top = null;
            }
            if (a === 'nw') {
                data.top = cpos.top + (csize.height - data.height);
                data.left = cpos.left + (csize.width - data.width);
            }

            return data;
        }

        function respectSize(data) {

            var options = this._vBoundaries,
                a = this.axis,
                ismaxw = this._isNumber(data.width) && options.maxWidth && (options.maxWidth < data.width),
                ismaxh = this._isNumber(data.height) && options.maxHeight && (options.maxHeight < data.height),
                isminw = this._isNumber(data.width) && options.minWidth && (options.minWidth > data.width),
                isminh = this._isNumber(data.height) && options.minHeight && (options.minHeight > data.height),
                dw = this.originalPosition.left + this.originalSize.width,
                dh = this.position.top + this.size.height,
                cw = /sw|nw|w/.test(a), ch = /nw|ne|n/.test(a);
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
            var i = 0,
                widths = [],
                borders = [
                    element.css('borderTopWidth'),
                    element.css('borderRightWidth'),
                    element.css('borderBottomWidth'),
                    element.css('borderLeftWidth')
                ],
                paddings = [
                    element.css('paddingTop'),
                    element.css('paddingRight'),
                    element.css('paddingBottom'),
                    element.css('paddingLeft')
                ];

            for (; i < 4; i++) {
                widths[i] = (parseInt(borders[i], 10) || 0);
                widths[i] += (parseInt(paddings[i], 10) || 0);
            }

            return {
                height: widths[0] + widths[2],
                width: widths[1] + widths[3]
            };
        }

        function proportionallyResize() {

            if (!this._proportionallyResizeElements.length) {
                return;
            }

            var prel,
                i = 0,
                element = this.helper || this.element;

            for (; i < this._proportionallyResizeElements.length; i++) {

                prel = this._proportionallyResizeElements[i];

                // TODO: Seems like a bug to cache this.outerDimensions
                // considering me we are in a loop.
                if (!this.outerDimensions) {
                    this.outerDimensions = getPaddingPlusBorderDimensions.call(this, prel);
                }

                prel.css({
                    height: (element.height() - this.outerDimensions.height) || 0,
                    width: (element.width() - this.outerDimensions.width) || 0
                });

            }

        }

        function renderProxy() {

            var el = this.element, options = this.options;
            this.elementOffset = el.offset();

            if (this._helper) {

                this.helper = this.helper || $('<div style="overflow:hidden;"></div>');

                this.addClass(this.helper, this._helper);
                this.helper.css({
                    width: this.element.outerWidth() - 1,
                    height: this.element.outerHeight() - 1,
                    position: 'absolute',
                    left: this.elementOffset.left + 'px',
                    top: this.elementOffset.top + 'px',
                    zIndex: ++options.zIndex //TODO: Don't modify option
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
            $.ui.plugin.call(this, n, [event, this.ui()]);
            (n !== 'resize' && this._trigger(n, event, this.ui()));
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
        exports.destroy = function () {
        };

        var Resizable = require('eoo').create(Mouse, exports);

        require('./bridge')('resizable', Resizable);

        return Resizable;

    }
);
