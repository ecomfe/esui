/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 元素拖放
 * @author maoquan(3610cn@gmail.com), liwei(liwei@iguzhi.cn)
 */

define(function (require) {
    var Mouse = require('./Mouse');

    var $ = require('jquery');
    var u = require('underscore');
    require('./util');

    $.ui = $.ui || {};

    var exports = {};

    exports.type = 'sortable';

    exports.constructor = function (options, element) {
        options = u.extend(
            {
                appendTo: 'parent',
                axis: false,
                connectWith: false,
                containment: false,
                cursor: 'auto',
                cursorAt: false,
                dropOnEmpty: true,
                forcePlaceholderSize: false,
                forceHelperSize: false,
                grid: false,
                handle: false,
                helper: 'original',
                items: '> *',
                opacity: false,
                placeholder: false,
                revert: false,
                scroll: true,
                scrollSensitivity: 20,
                scrollSpeed: 20,
                scope: 'default',
                tolerance: 'intersect',
                zIndex: 1000,

                // callbacks
                activate: null,
                beforeStop: null,
                change: null,
                deactivate: null,
                out: null,
                over: null,
                receive: null,
                remove: null,
                sort: null,
                start: null,
                stop: null,
                update: null
            },
            options
        );
        this.$super(arguments);
    };

    exports.init = function () {
        this.$super(arguments);

        this.containerCache = {};
        this.addClass();

        // Get the items
        this.refresh();

        this.setOptions(this.options);

        // Let's determine the parent's offset
        this.offset = this.element.offset();

        this.setHandleClassName();

        // We're ready to go
        this.ready = true;
    };

    function isOverAxis(x, reference, size) {
        return (x >= reference) && (x < (reference + size));
    }

    function isFloating(item) {
        return (/left|right/).test(item.css('float')) || (/inline|table-cell/).test(item.css('display'));
    }

    exports.setHandleClassName = function () {
        var me = this;
        var handleClass = this.getClassName();
        this.element.find('.' + handleClass).removeClass(handleClass);
        $.each(
            this.items,
            function () {
                var handle = this.instance.options.handle;
                handle = handle ? this.item.find(handle) : this.item;
                me.addClass(handle, 'handle');
            }
        );
    };

    exports.dispose = function () {
        this.$super(arguments);
        this.removeClass().removeClass('disabled');
        this.element.find('.' + this.getClassName('handle')).removeClass('handle');

        for (var i = this.items.length - 1; i >= 0; i--) {
            this.items[i].item.removeData(this.type + '-item');
        }
        this.$super(arguments);
    };

    exports.mouseCapture = function (event, overrideHandle) {
        var currentItem = null;
        var validHandle = false;
        var that = this;

        if (this.reverting) {
            return false;
        }

        if (this.options.disabled || this.options.type === 'static') {
            return false;
        }

        // We have to refresh the items data once first
        this.refreshItems(event);

        // Find out if the clicked node (or one of its parents) is a actual item in this.items
        $(event.target).parents().each(function () {
            if ($.data(this, that.type + '-item') === that) {
                currentItem = $(this);
                return false;
            }
        });
        if ($.data(event.target, that.type + '-item') === that) {
            currentItem = $(event.target);
        }

        if (!currentItem) {
            return false;
        }
        if (this.options.handle && !overrideHandle) {
            $(this.options.handle, currentItem).find('*').addBack().each(function () {
                if (this === event.target) {
                    validHandle = true;
                }
            });
            if (!validHandle) {
                return false;
            }
        }

        this.currentItem = currentItem;
        removeCurrentsFromItems.call(this);
        return true;

    };

    exports.mouseStart = function (event, overrideHandle, noActivation) {
        var options = this.options;

        this.currentContainer = this;

        // We only need to call refreshPositions, because the refreshItems call has been moved to mouseCapture
        this.refreshPositions();

        // Create and append the visible helper
        this.helper = createHelper.call(this, event);

        // Cache the helper size
        cacheHelperProportions.call(this);

        /*
         * - Position generation -
         * This block generates everything position related - it's the core of draggables.
         */

        // Cache the margins of the original element
        cacheMargins.call(this);

        // Get the next scrolling parent
        this.scrollParent = this.helper.scrollParent();

        // The element's absolute position on the page minus margins
        this.offset = this.currentItem.offset();
        this.offset = {
            top: this.offset.top - this.margins.top,
            left: this.offset.left - this.margins.left
        };

        $.extend(this.offset, {
            click: { // Where the click happened, relative to the element
                left: event.pageX - this.offset.left,
                top: event.pageY - this.offset.top
            },
            parent: getParentOffset.call(this),
            // This is a relative to absolute position minus the actual position calculation
            // - only used for relative positioned helper
            relative: getRelativeOffset.call(this)
        });

        // Only after we got the offset, we can change the helper's position to absolute
        // TODO: Still need to figure out a way to make relative sorting possible
        this.helper.css('position', 'absolute');
        this.cssPosition = this.helper.css('position');

        // Generate the original position
        this.originalPosition = generatePosition.call(this, event);
        this.originalPageX = event.pageX;
        this.originalPageY = event.pageY;

        // Adjust the mouse offset relative to the helper if 'cursorAt' is supplied
        (options.cursorAt && adjustOffsetFromHelper.call(this, options.cursorAt));

        // Cache the former DOM position
        this.domPosition = {
            prev: this.currentItem.prev()[0],
            parent: this.currentItem.parent()[0]
        };

        // If the helper is not the original,
        // hide the original so it's not playing any role during the drag, won't cause anything bad this way
        if (this.helper[0] !== this.currentItem[0]) {
            this.currentItem.hide();
        }

        // Create the placeholder
        createPlaceholder.call(this);

        // Set a containment if given in the options
        if (options.containment) {
            setContainment.call(this);
        }

        if (options.cursor && options.cursor !== 'auto') { // cursor option
            var body = this.document.find('body');

            // support: IE
            this.storedCursor = body.css('cursor');
            body.css('cursor', options.cursor);

            this.storedStylesheet = $('<style>*{ cursor: ' + options.cursor + ' !important; }</style>').appendTo(body);
        }

        if (options.opacity) { // opacity option
            if (this.helper.css('opacity')) {
                this.storedOpacity = this.helper.css('opacity');
            }
            this.helper.css('opacity', options.opacity);
        }

        if (options.zIndex) { // zIndex option
            if (this.helper.css('zIndex')) {
                this.storedZIndex = this.helper.css('zIndex');
            }
            this.helper.css('zIndex', options.zIndex);
        }

        // Prepare scrolling
        if (this.scrollParent[0] !== this.document[0] && this.scrollParent[0].tagName !== 'HTML') {
            this.overflowOffset = this.scrollParent.offset();
        }

        // Call callbacks
        this.trigger('start', event, uiHash.call(this));

        // Recache the helper size
        if (!this.preserveHelperProportions) {
            cacheHelperProportions.call(this);
        }

        // Post 'activate' events to possible containers
        if (!noActivation) {
            for (var i = this.containers.length - 1; i >= 0; i--) {
                this.containers[i].trigger('activate', event, uiHash.call(this));
            }
        }

        // Prepare possible droppables
        if ($.ui.ddmanager) {
            $.ui.ddmanager.current = this;
        }

        if ($.ui.ddmanager && !options.dropBehaviour) {
            $.ui.ddmanager.prepareOffsets(this, event);
        }

        this.dragging = true;
        this.addClass(this.helper, 'helper');
        // Execute the drag once - this causes the helper not to be visible before getting its correct position
        this.mouseDrag(event);
        return true;
    };

    exports.mouseDrag = function (event) {
        var i;
        var item;
        var itemElement;
        var intersection;
        var options = this.options;
        var scrolled = false;

        // Compute the helpers position
        this.position = generatePosition.call(this, event);
        this.positionAbs = convertPositionTo.call(this, 'absolute');

        if (!this.lastPositionAbs) {
            this.lastPositionAbs = this.positionAbs;
        }

        // Do scrolling
        if (this.options.scroll) {
            if (this.scrollParent[0] !== this.document[0] && this.scrollParent[0].tagName !== 'HTML') {

                if ((this.overflowOffset.top + this.scrollParent[0].offsetHeight) - event.pageY
                    < options.scrollSensitivity) {
                    this.scrollParent[0].scrollTop = scrolled = this.scrollParent[0].scrollTop + options.scrollSpeed;
                }
                else if (event.pageY - this.overflowOffset.top < options.scrollSensitivity) {
                    this.scrollParent[0].scrollTop = scrolled = this.scrollParent[0].scrollTop - options.scrollSpeed;
                }

                if ((this.overflowOffset.left + this.scrollParent[0].offsetWidth) - event.pageX
                    < options.scrollSensitivity) {
                    this.scrollParent[0].scrollLeft = scrolled = this.scrollParent[0].scrollLeft + options.scrollSpeed;
                }
                else if (event.pageX - this.overflowOffset.left < options.scrollSensitivity) {
                    this.scrollParent[0].scrollLeft = scrolled = this.scrollParent[0].scrollLeft - options.scrollSpeed;
                }

            }
            else {

                if (event.pageY - this.document.scrollTop() < options.scrollSensitivity) {
                    scrolled = this.document.scrollTop(this.document.scrollTop() - options.scrollSpeed);
                }
                else if (this.window.height() - (event.pageY - this.document.scrollTop()) < options.scrollSensitivity) {
                    scrolled = this.document.scrollTop(this.document.scrollTop() + options.scrollSpeed);
                }

                if (event.pageX - this.document.scrollLeft() < options.scrollSensitivity) {
                    scrolled = this.document.scrollLeft(this.document.scrollLeft() - options.scrollSpeed);
                }
                else if (this.window.width() - (event.pageX - this.document.scrollLeft()) < options.scrollSensitivity) {
                    scrolled = this.document.scrollLeft(this.document.scrollLeft() + options.scrollSpeed);
                }

            }

            if (scrolled !== false && $.ui.ddmanager && !options.dropBehaviour) {
                $.ui.ddmanager.prepareOffsets(this, event);
            }
        }

        // Regenerate the absolute position used for position checks
        this.positionAbs = convertPositionTo.call(this, 'absolute');

        // Set the helper position
        if (!this.options.axis || this.options.axis !== 'y') {
            this.helper[0].style.left = this.position.left + 'px';
        }
        if (!this.options.axis || this.options.axis !== 'x') {
            this.helper[0].style.top = this.position.top + 'px';
        }

        // Rearrange
        for (i = this.items.length - 1; i >= 0; i--) {

            // Cache variables and intersection, continue if no intersection
            item = this.items[i];
            itemElement = item.item[0];
            intersection = intersectsWithPointer.call(this, item);
            if (!intersection) {
                continue;
            }

            // Only put the placeholder inside the current Container, skip all
            // items from other containers. This works because when moving
            // an item from one container to another the
            // currentContainer is switched before the placeholder is moved.
            //
            // Without this, moving items in 'sub-sortables' can cause
            // the placeholder to jitter between the outer and inner container.
            if (item.instance !== this.currentContainer) {
                continue;
            }

            // cannot intersect with itself
            // no useless actions that have been done before
            // no action if the item moved is the parent of the item checked
            if (itemElement !== this.currentItem[0] &&
                this.placeholder[intersection === 1 ? 'next' : 'prev']()[0] !== itemElement &&
                !$.contains(this.placeholder[0], itemElement) &&
                (this.options.type === 'semi-dynamic' ? !$.contains(this.element[0], itemElement) : true)
            ) {

                this.direction = intersection === 1 ? 'down' : 'up';

                if (this.options.tolerance === 'pointer' || intersectsWithSides.call(this, item)) {
                    rearrange.call(this, event, item);
                }
                else {
                    break;
                }

                this.trigger('change', event, uiHash.call(this));
                break;
            }
        }

        // Post events to containers
        contactContainers.call(this, event);

        // Interconnect with droppables
        if ($.ui.ddmanager) {
            $.ui.ddmanager.drag(this, event);
        }

        // Call callbacks
        this.trigger('sort', event, uiHash.call(this));

        this.lastPositionAbs = this.positionAbs;
        return false;

    };

    exports.mouseStop = function (event, noPropagation) {

        if (!event) {
            return;
        }

        // If we are using droppables, inform the manager about the drop
        if ($.ui.ddmanager && !this.options.dropBehaviour) {
            $.ui.ddmanager.drop(this, event);
        }

        if (this.options.revert) {
            var that = this;
            var cur = this.placeholder.offset();
            var axis = this.options.axis;
            var animation = {};

            if (!axis || axis === 'x') {
                animation.left = cur.left - this.offset.parent.left - this.margins.left
                    + (this.offsetParent[0] === this.document[0].body ? 0 : this.offsetParent[0].scrollLeft);
            }
            if (!axis || axis === 'y') {
                animation.top = cur.top - this.offset.parent.top - this.margins.top
                    + (this.offsetParent[0] === this.document[0].body ? 0 : this.offsetParent[0].scrollTop);
            }
            this.reverting = true;
            $(this.helper).animate(animation, parseInt(this.options.revert, 10) || 500, function () {
                clear.call(that, event);
            });
        }
        else {
            clear.call(this, event, noPropagation);
        }

        return false;

    };

    exports.cancel = function () {

        if (this.dragging) {

            this.mouseUp({target: null});

            if (this.options.helper === 'original') {
                this.currentItem.css(this.storedCSS).removeClass('ui-sortable-helper');
            }
            else {
                this.currentItem.show();
            }

            // Post deactivating events to containers
            for (var i = this.containers.length - 1; i >= 0; i--) {
                this.containers[i].trigger('deactivate', null, uiHash.call(this));
                if (this.containers[i].containerCache.over) {
                    this.containers[i].trigger('out', null, uiHash.call(this));
                    this.containers[i].containerCache.over = 0;
                }
            }

        }

        if (this.placeholder) {
            // $(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately,
            // it unbinds ALL events from the original node!
            if (this.placeholder[0].parentNode) {
                this.placeholder[0].parentNode.removeChild(this.placeholder[0]);
            }
            if (this.options.helper !== 'original' && this.helper && this.helper[0].parentNode) {
                this.helper.remove();
            }

            $.extend(this, {
                helper: null,
                dragging: false,
                reverting: false,
                noFinalSort: null
            });

            if (this.domPosition.prev) {
                $(this.domPosition.prev).after(this.currentItem);
            }
            else {
                $(this.domPosition.parent).prepend(this.currentItem);
            }
        }

        return this;

    };

    exports.serialize = function (options) {

        var items = getItemsAsjQuery.call(this, options && options.connected);
        var str = [];
        options = options || {};

        $(items).each(function () {
            var res = ($(options.item || this).attr(options.attribute || 'id') || '')
                .match(options.expression || (/(.+)[\-=_](.+)/));
            if (res) {
                str.push(
                    (options.key || res[1] + '[]')
                        + '='
                        + (options.key && options.expression ? res[1] : res[2])
                );
            }
        });

        if (!str.length && options.key) {
            str.push(options.key + '=');
        }

        return str.join('&');

    };

    exports.toArray = function (options) {

        var items = getItemsAsjQuery.call(this, options && options.connected);
        var ret = [];

        options = options || {};

        items.each(function () {
            ret.push($(options.item || this).attr(options.attribute || 'id') || '');
        });
        return ret;

    };

    /* Be careful with the following core functions */
    function intersectsWith(item) {

        var x1 = this.positionAbs.left;
        var x2 = x1 + this.helperProportions.width;
        var y1 = this.positionAbs.top;
        var y2 = y1 + this.helperProportions.height;
        var l = item.left;
        var r = l + item.width;
        var t = item.top;
        var b = t + item.height;
        var dyClick = this.offset.click.top;
        var dxClick = this.offset.click.left;
        var isOverElementHeight = (this.options.axis === 'x') || ((y1 + dyClick) > t && (y1 + dyClick) < b);
        var isOverElementWidth = (this.options.axis === 'y') || ((x1 + dxClick) > l && (x1 + dxClick) < r);
        var isOverElement = isOverElementHeight && isOverElementWidth;

        if (this.options.tolerance === 'pointer' ||
            this.options.forcePointerForContainers ||
            (this.options.tolerance !== 'pointer'
                && this.helperProportions[this.floating ? 'width' : 'height']
                > item[this.floating ? 'width' : 'height'])
        ) {
            return isOverElement;
        }

        return (l < x1 + (this.helperProportions.width / 2) // Right Half
            && x2 - (this.helperProportions.width / 2) < r // Left Half
            && t < y1 + (this.helperProportions.height / 2) // Bottom Half
            && y2 - (this.helperProportions.height / 2) < b); // Top Half
    }

    function intersectsWithPointer(item) {

        var isOverElementHeight = (this.options.axis === 'x')
            || isOverAxis.call(this, this.positionAbs.top + this.offset.click.top, item.top, item.height);
        var isOverElementWidth = (this.options.axis === 'y')
            || isOverAxis.call(this, this.positionAbs.left + this.offset.click.left, item.left, item.width);
        var isOverElement = isOverElementHeight && isOverElementWidth;
        var verticalDirection = getDragVerticalDirection.call(this);
        var horizontalDirection = getDragHorizontalDirection.call(this);

        if (!isOverElement) {
            return false;
        }

        return this.floating ?
            (((horizontalDirection && horizontalDirection === 'right') || verticalDirection === 'down') ? 2 : 1)
            : (verticalDirection && (verticalDirection === 'down' ? 2 : 1));

    }

    function intersectsWithSides(item) {

        var isOverBottomHalf = isOverAxis.call(this, this.positionAbs.top
            + this.offset.click.top, item.top + (item.height / 2), item.height);
        var isOverRightHalf = isOverAxis.call(this, this.positionAbs.left
            + this.offset.click.left, item.left + (item.width / 2), item.width);
        var verticalDirection = getDragVerticalDirection.call(this);
        var horizontalDirection = getDragHorizontalDirection.call(this);

        if (this.floating && horizontalDirection) {
            return ((horizontalDirection === 'right' && isOverRightHalf)
                || (horizontalDirection === 'left' && !isOverRightHalf));
        }
        return verticalDirection && ((verticalDirection === 'down' && isOverBottomHalf)
            || (verticalDirection === 'up' && !isOverBottomHalf));
    }

    function getDragVerticalDirection() {
        var delta = this.positionAbs.top - this.lastPositionAbs.top;
        return delta !== 0 && (delta > 0 ? 'down' : 'up');
    }

    function getDragHorizontalDirection() {
        var delta = this.positionAbs.left - this.lastPositionAbs.left;
        return delta !== 0 && (delta > 0 ? 'right' : 'left');
    }

    exports.refresh = function (event) {
        this.refreshItems(event);
        this.setHandleClassName();
        this.refreshPositions();
        return this;
    };

    exports.connectWith = function () {
        var options = this.options;
        return options.connectWith.constructor === String ? [options.connectWith] : options.connectWith;
    };

    function getItemsAsjQuery(connected) {

        var queries = [];
        var connectWith = this.connectWith();

        var helperClassWithDot = '.' + this.getClassName('helper');
        var placeholderClassWithDot = '.' + this.getClassName('placeholder');
        if (connectWith && connected) {
            for (var i = connectWith.length - 1; i >= 0; i--) {
                var cur = $(connectWith[i], this.document[0]);
                for (var j = cur.length - 1; j >= 0; j--) {
                    var inst = $.data(cur[j], this.type);
                    if (inst && inst !== this && !inst.options.disabled) {
                        queries.push(
                            [
                                $.isFunction(inst.options.items)
                                    ? inst.options.items.call(inst.element)
                                    : $(inst.options.items, inst.element)
                                        .not(helperClassWithDot)
                                        .not(placeholderClassWithDot),
                                inst
                            ]
                        );
                    }
                }
            }
        }

        queries.push(
            [
                $.isFunction(this.options.items)
                    ? this.options.items.call(
                        this.element,
                        null,
                        {
                            options: this.options,
                            item: this.currentItem
                        }
                    )
                    : $(this.options.items, this.element).not(helperClassWithDot).not(placeholderClassWithDot),
                this
            ]
        );

        var items = [];
        function addItems () {
            items.push(this);
        }

        for (i = queries.length - 1; i >= 0; i--) {
            queries[i][0].each(addItems);
        }

        return $(items);
    }

    function removeCurrentsFromItems() {
        var list = this.currentItem.find(':data(' + this.type + '-item)');
        this.items = $.grep(
            this.items,
            function (item) {
                for (var j = 0; j < list.length; j++) {
                    if (list[j] === item.item[0]) {
                        return false;
                    }
                }
                return true;
            }
        );
    }

    exports.refreshItems = function (event) {

        this.items = [];
        this.containers = [this];

        var items = this.items;
        var queries = [[$.isFunction(this.options.items)
            ? this.options.items.call(this.element[0], event, {item: this.currentItem})
            : $(this.options.items, this.element), this]];
        var connectWith = this.connectWith();

        if (connectWith && this.ready) { // Shouldn't be run the first time through due to massive slow-down
            for (var i = connectWith.length - 1; i >= 0; i--) {
                var cur = $(connectWith[i], this.document[0]);
                for (var j = cur.length - 1; j >= 0; j--) {
                    var inst = $.data(cur[j], this.type);
                    if (inst && inst !== this && !inst.options.disabled) {
                        queries.push([$.isFunction(inst.options.items)
                            ? inst.options.items.call(inst.element[0], event, {item: this.currentItem})
                            : $(inst.options.items, inst.element), inst]);
                        this.containers.push(inst);
                    }
                }
            }
        }

        for (i = queries.length - 1; i >= 0; i--) {
            var targetData = queries[i][1];
            var _queries = queries[i][0];

            var queriesLength;
            for (j = 0, queriesLength = _queries.length; j < queriesLength; j++) {
                var item = $(_queries[j]);

                item.data(this.type + '-item', targetData); // Data for target checking (mouse manager)

                items.push({
                    item: item,
                    instance: targetData,
                    width: 0, height: 0,
                    left: 0, top: 0
                });
            }
        }

    };

    exports.refreshPositions = function (fast) {

        // Determine whether items are being displayed horizontally
        this.floating = this.items.length
            ?  this.options.axis === 'x' || isFloating.call(this, this.items[0].item)
            : false;

        // This has to be redone because due to the item being moved out/into the offsetParent,
        // the offsetParent's position will change
        if (this.offsetParent && this.helper) {
            this.offset.parent = getParentOffset.call(this);
        }

        var i;
        var item;
        var t;
        var p;

        for (i = this.items.length - 1; i >= 0; i--) {
            item = this.items[i];

            // We ignore calculating positions of all connected containers when we're not over them
            if (item.instance !== this.currentContainer
                && this.currentContainer && item.item[0] !== this.currentItem[0]) {
                continue;
            }

            t = this.options.toleranceElement ? $(this.options.toleranceElement, item.item) : item.item;

            if (!fast) {
                item.width = t.outerWidth();
                item.height = t.outerHeight();
            }

            p = t.offset();
            item.left = p.left;
            item.top = p.top;
        }

        if (this.options.custom && this.options.custom.refreshContainers) {
            this.options.custom.refreshContainers.call(this);
        }
        else {
            for (i = this.containers.length - 1; i >= 0; i--) {
                p = this.containers[i].element.offset();
                this.containers[i].containerCache.left = p.left;
                this.containers[i].containerCache.top = p.top;
                this.containers[i].containerCache.width = this.containers[i].element.outerWidth();
                this.containers[i].containerCache.height = this.containers[i].element.outerHeight();
            }
        }

        return this;
    };

    function createPlaceholder(that) {
        that = that || this;
        var className;
        var options = that.options;

        if (!options.placeholder || options.placeholder.constructor === String) {
            className = options.placeholder;
            options.placeholder = {
                element: function () {
                    var nodeName = that.currentItem[0].nodeName.toLowerCase();
                    var element = $('<' + nodeName + '>', that.document[0]);
                    this.addClass(element, className || that.currentItem[0].className + ' placeholder');
                    this.removeClass(element, 'helper');

                    if (nodeName === 'tbody') {
                        createTrPlaceholder.call(
                            that,
                            that.currentItem.find('tr').eq(0),
                            $('<tr>', that.document[0]).appendTo(element)
                        );
                    }
                    else if (nodeName === 'tr') {
                        createTrPlaceholder.call(that, that.currentItem, element);
                    }
                    else if (nodeName === 'img') {
                        element.attr('src', that.currentItem.attr('src'));
                    }

                    if (!className) {
                        element.css('visibility', 'hidden');
                    }

                    return element;
                },
                update: function (container, p) {

                    // 1. If a className is set as 'placeholder option,
                    // we don't force sizes - the class is responsible for that
                    // 2. The option 'forcePlaceholderSize can be enabled to force it even if a class name is specified
                    if (className && !options.forcePlaceholderSize) {
                        return;
                    }

                    // If the element doesn't have a actual height by itself (without styles coming from a stylesheet),
                    // it receives the inline height from the dragged item
                    if (!p.height()) {
                        p.height(that.currentItem.innerHeight() - parseInt(that.currentItem.css('paddingTop') || 0, 10)
                            - parseInt(that.currentItem.css('paddingBottom') || 0, 10));
                    }
                    if (!p.width()) {
                        p.width(that.currentItem.innerWidth() - parseInt(that.currentItem.css('paddingLeft') || 0, 10)
                            - parseInt(that.currentItem.css('paddingRight') || 0, 10));
                    }
                }
            };
        }

        // Create the placeholder
        that.placeholder = $(options.placeholder.element.call(that.element, that.currentItem));

        // Append it after the actual current item
        that.currentItem.after(that.placeholder);

        // Update the size of the placeholder (TODO: Logic to fuzzy, see line 316/317)
        options.placeholder.update(that, that.placeholder);

    }

    function createTrPlaceholder(sourceTr, targetTr) {
        var that = this;

        sourceTr.children().each(function () {
            $('<td>&#160;</td>', that.document[0])
                .attr('colspan', $(this).attr('colspan') || 1)
                .appendTo(targetTr);
        });
    }

    function contactContainers(event) {
        var i;
        var j;
        var dist;
        var itemWithLeastDistance;
        var posProperty;
        var sizeProperty;
        var cur;
        var nearBottom;
        var floating;
        var axis;
        var innermostContainer = null;
        var innermostIndex = null;

        // get innermost container that intersects with item
        for (i = this.containers.length - 1; i >= 0; i--) {

            // never consider a container that's located within the item itself
            if ($.contains(this.currentItem[0], this.containers[i].element[0])) {
                continue;
            }

            if (intersectsWith.call(this, this.containers[i].containerCache)) {
                // if we've already found a container and it's more 'inner' than this, then continue
                if (innermostContainer && $.contains(this.containers[i].element[0], innermostContainer.element[0])) {
                    continue;
                }

                innermostContainer = this.containers[i];
                innermostIndex = i;

            }
            else {
                // container doesn't intersect. trigger 'out' event if necessary
                if (this.containers[i].containerCache.over) {
                    this.containers[i].trigger('out', event, uiHash.call(this));
                    this.containers[i].containerCache.over = 0;
                }
            }

        }

        // if no intersecting containers found, return
        if (!innermostContainer) {
            return;
        }

        // move the item into the container if it's not there already
        if (this.containers.length === 1) {
            if (!this.containers[innermostIndex].containerCache.over) {
                this.containers[innermostIndex].trigger('over', event, uiHash.call(this));
                this.containers[innermostIndex].containerCache.over = 1;
            }
        }
        else {
            // When entering a new container, we will find the item with the least distance and append our item near it
            dist = 10000;
            itemWithLeastDistance = null;
            floating = innermostContainer.floating || isFloating.call(this, this.currentItem);
            posProperty = floating ? 'left' : 'top';
            sizeProperty = floating ? 'width' : 'height';
            axis = floating ? 'clientX' : 'clientY';

            for (j = this.items.length - 1; j >= 0; j--) {
                if (!$.contains(this.containers[innermostIndex].element[0], this.items[j].item[0])) {
                    continue;
                }
                if (this.items[j].item[0] === this.currentItem[0]) {
                    continue;
                }

                cur = this.items[j].item.offset()[posProperty];
                nearBottom = false;
                if (event[axis] - cur > this.items[j][sizeProperty] / 2) {
                    nearBottom = true;
                }

                if (Math.abs(event[axis] - cur) < dist) {
                    dist = Math.abs(event[axis] - cur);
                    itemWithLeastDistance = this.items[j];
                    this.direction = nearBottom ? 'up' : 'down';
                }
            }

            // Check if dropOnEmpty is enabled
            if (!itemWithLeastDistance && !this.options.dropOnEmpty) {
                return;
            }

            if (this.currentContainer === this.containers[innermostIndex]) {
                if (!this.currentContainer.containerCache.over) {
                    this.containers[innermostIndex].trigger('over', event, uiHash.call(this));
                    this.currentContainer.containerCache.over = 1;
                }
                return;
            }

            itemWithLeastDistance
                ? rearrange.call(this, event, itemWithLeastDistance, null, true)
                : rearrange.call(this, event, null, this.containers[innermostIndex].element, true);
            this.trigger('change', event, uiHash.call(this));
            this.containers[innermostIndex].trigger('change', event, uiHash.call(this));
            this.currentContainer = this.containers[innermostIndex];

            // Update the placeholder
            this.options.placeholder.update(this.currentContainer, this.placeholder);

            this.containers[innermostIndex].trigger('over', event, uiHash.call(this));
            this.containers[innermostIndex].containerCache.over = 1;
        }


    }

    function createHelper(event) {
        var options = this.options;
        var helper = $.isFunction(options.helper)
            ? $(options.helper.apply(this.element[0], [event, this.currentItem]))
            : (options.helper === 'clone' ? this.currentItem.clone() : this.currentItem);

        // Add the helper to the DOM if that didn't happen already
        if (!helper.parents('body').length) {
            $(options.appendTo !== 'parent'
                ? options.appendTo
                : this.currentItem[0].parentNode)[0].appendChild(helper[0]);
        }

        if (helper[0] === this.currentItem[0]) {
            this.storedCSS = {
                width: this.currentItem[0].style.width,
                height: this.currentItem[0].style.height,
                position: this.currentItem.css('position'),
                top: this.currentItem.css('top'),
                left: this.currentItem.css('left')
            };
        }

        if (!helper[0].style.width || options.forceHelperSize) {
            helper.width(this.currentItem.width());
        }
        if (!helper[0].style.height || options.forceHelperSize) {
            helper.height(this.currentItem.height());
        }

        return helper;

    }

    function adjustOffsetFromHelper(obj) {
        if (typeof obj === 'string') {
            obj = obj.split(' ');
        }
        if ($.isArray(obj)) {
            obj = {left: +obj[0], top: +obj[1] || 0};
        }
        if ('left' in obj) {
            this.offset.click.left = obj.left + this.margins.left;
        }
        if ('right' in obj) {
            this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
        }
        if ('top' in obj) {
            this.offset.click.top = obj.top + this.margins.top;
        }
        if ('bottom' in obj) {
            this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
        }
    }

    function getParentOffset() {
        // Get the offsetParent and cache its position
        this.offsetParent = this.helper.offsetParent();
        var po = this.offsetParent.offset();

        // This is a special case where we need to modify a offset calculated on start,
        // since the following happened:
        // 1. The position of the helper is absolute,
        // so it's position is calculated based on the next positioned parent
        // 2. The actual offset parent is a child of the scroll parent,
        // and the scroll parent isn't the document, which means that
        // the scroll is included in the initial calculation of the offset of the parent,
        // and never recalculated upon drag
        if (this.cssPosition === 'absolute' && this.scrollParent[0] !== this.document[0]
            && $.contains(this.scrollParent[0], this.offsetParent[0])) {
            po.left += this.scrollParent.scrollLeft();
            po.top += this.scrollParent.scrollTop();
        }

        // This needs to be actually done for all browsers, since pageX/pageY includes this information
        // with an ugly IE fix
        if (this.offsetParent[0] === this.document[0].body
            || (this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() === 'html' && $.ui.ie)) {
            po = {top: 0, left: 0};
        }

        return {
            top: po.top + (parseInt(this.offsetParent.css('borderTopWidth'), 10) || 0),
            left: po.left + (parseInt(this.offsetParent.css('borderLeftWidth'), 10) || 0)
        };

    }

    function getRelativeOffset() {

        if (this.cssPosition === 'relative') {
            var p = this.currentItem.position();
            return {
                top: p.top - (parseInt(this.helper.css('top'), 10) || 0) + this.scrollParent.scrollTop(),
                left: p.left - (parseInt(this.helper.css('left'), 10) || 0) + this.scrollParent.scrollLeft()
            };
        }
        return {top: 0, left: 0};
    }

    function cacheMargins() {
        this.margins = {
            left: (parseInt(this.currentItem.css('marginLeft'), 10) || 0),
            top: (parseInt(this.currentItem.css('marginTop'), 10) || 0)
        };
    }

    function cacheHelperProportions() {
        this.helperProportions = {
            width: this.helper.outerWidth(),
            height: this.helper.outerHeight()
        };
    }

    function setContainment() {

        var options = this.options;
        if (options.containment === 'parent') {
            options.containment = this.helper[0].parentNode;
        }
        if (options.containment === 'document' || options.containment === 'window') {
            this.containment = [
                0 - this.offset.relative.left - this.offset.parent.left,
                0 - this.offset.relative.top - this.offset.parent.top,
                options.containment === 'document'
                    ? this.document.width()
                    : this.window.width() - this.helperProportions.width - this.margins.left,
                (
                    options.containment === 'document'
                    ? this.document.width()
                    : this.window.height() || this.document[0].body.parentNode.scrollHeight
                ) - this.helperProportions.height - this.margins.top
            ];
        }

        if (!(/^(document|window|parent)$/).test(options.containment)) {
            var ce = $(options.containment)[0];
            var co = $(options.containment).offset();
            var over = ($(ce).css('overflow') !== 'hidden');

            this.containment = [
                co.left + (parseInt($(ce).css('borderLeftWidth'), 10) || 0)
                    + (parseInt($(ce).css('paddingLeft'), 10) || 0) - this.margins.left,
                co.top + (parseInt($(ce).css('borderTopWidth'), 10) || 0)
                    + (parseInt($(ce).css('paddingTop'), 10) || 0) - this.margins.top,
                co.left + (over ? Math.max(ce.scrollWidth, ce.offsetWidth) : ce.offsetWidth)
                    - (parseInt($(ce).css('borderLeftWidth'), 10) || 0)
                    - (parseInt($(ce).css('paddingRight'), 10) || 0)
                    - this.helperProportions.width
                    - this.margins.left,
                co.top + (over ? Math.max(ce.scrollHeight, ce.offsetHeight) : ce.offsetHeight)
                    - (parseInt($(ce).css('borderTopWidth'), 10) || 0)
                    - (parseInt($(ce).css('paddingBottom'), 10) || 0)
                    - this.helperProportions.height
                    - this.margins.top
            ];
        }

    }

    function convertPositionTo(d, pos) {

        if (!pos) {
            pos = this.position;
        }
        var mod = d === 'absolute' ? 1 : -1;
        var scroll = this.cssPosition === 'absolute'
                && !(this.scrollParent[0] !== this.document[0]
                && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent;
        var scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

        return {
            top: (
                // The absolute mouse position
                pos.top
                // Only for relative positioned nodes: Relative offset from element to offset parent
                + this.offset.relative.top * mod
                // The offsetParent's offset without borders (offset + border)
                + this.offset.parent.top * mod
                - ((this.cssPosition === 'fixed'
                    ? -this.scrollParent.scrollTop()
                    : (scrollIsRootNode ? 0 : scroll.scrollTop())) * mod)
            ),
            left: (
                // The absolute mouse position
                pos.left
                // Only for relative positioned nodes: Relative offset from element to offset parent
                + this.offset.relative.left * mod
                // The offsetParent's offset without borders (offset + border)
                + this.offset.parent.left * mod
                - ((this.cssPosition === 'fixed'
                    ? -this.scrollParent.scrollLeft()
                    : scrollIsRootNode ? 0 : scroll.scrollLeft()) * mod)
            )
        };

    }

    function generatePosition(event) {

        var top;
        var left;
        var options = this.options;
        var pageX = event.pageX;
        var pageY = event.pageY;
        var scroll = this.cssPosition === 'absolute'
                && !(this.scrollParent[0] !== this.document[0]
                && $.contains(this.scrollParent[0], this.offsetParent[0]))
                ? this.offsetParent
                : this.scrollParent;
        var scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

        // This is another very weird special case that only happens for relative elements:
        // 1. If the css position is relative
        // 2. and the scroll parent is the document or similar to the offset parent
        // we have to refresh the relative offset during the scroll so there are no jumps
        if (this.cssPosition === 'relative'
            && !(this.scrollParent[0] !== this.document[0]
            && this.scrollParent[0] !== this.offsetParent[0])) {
            this.offset.relative = getRelativeOffset.call(this);
        }

        /*
         * - Position constraining -
         * Constrain the position to a mix of grid, containment.
         */

        if (this.originalPosition) { // If we are not dragging yet, we won't check for options

            if (this.containment) {
                if (event.pageX - this.offset.click.left < this.containment[0]) {
                    pageX = this.containment[0] + this.offset.click.left;
                }
                if (event.pageY - this.offset.click.top < this.containment[1]) {
                    pageY = this.containment[1] + this.offset.click.top;
                }
                if (event.pageX - this.offset.click.left > this.containment[2]) {
                    pageX = this.containment[2] + this.offset.click.left;
                }
                if (event.pageY - this.offset.click.top > this.containment[3]) {
                    pageY = this.containment[3] + this.offset.click.top;
                }
            }

            if (options.grid) {
                top = this.originalPageY
                    + Math.round((pageY - this.originalPageY) / options.grid[1]) * options.grid[1];
                pageY = this.containment
                    ? (
                        (top - this.offset.click.top >= this.containment[1]
                        && top - this.offset.click.top <= this.containment[3])
                        ? top
                        : (
                            (top - this.offset.click.top >= this.containment[1])
                                ? top - options.grid[1] : top + options.grid[1]
                        )
                    )
                    : top;

                left = this.originalPageX
                    + Math.round((pageX - this.originalPageX) / options.grid[0]) * options.grid[0];
                pageX = this.containment
                    ? ((left - this.offset.click.left >= this.containment[0]
                        && left - this.offset.click.left <= this.containment[2])
                        ? left
                        : ((left - this.offset.click.left >= this.containment[0])
                            ? left - options.grid[0] : left + options.grid[0]))
                    : left;
            }

        }

        return {
            top: (
                // The absolute mouse position
                pageY
                // Click offset (relative to the element)
                - this.offset.click.top
                // Only for relative positioned nodes: Relative offset from element to offset parent
                - this.offset.relative.top
                // The offsetParent's offset without borders (offset + border)
                - this.offset.parent.top
                + ((this.cssPosition === 'fixed'
                    ? -this.scrollParent.scrollTop()
                    : (scrollIsRootNode ? 0 : scroll.scrollTop())))
            ),
            left: (
                // The absolute mouse position
                pageX
                // Click offset (relative to the element)
                - this.offset.click.left
                // Only for relative positioned nodes: Relative offset from element to offset parent
                - this.offset.relative.left
                // The offsetParent's offset without borders (offset + border)
                - this.offset.parent.left
                + ((this.cssPosition === 'fixed'
                    ? -this.scrollParent.scrollLeft()
                    : scrollIsRootNode ? 0 : scroll.scrollLeft()))
            )
        };

    }

    function rearrange(event, i, a, hardRefresh) {

        a ? a[0].appendChild(this.placeholder[0])
            : i.item[0].parentNode.insertBefore(this.placeholder[0]
                , (this.direction === 'down' ? i.item[0] : i.item[0].nextSibling));

        // Various things done here to improve the performance:
        // 1. we create a setTimeout, that calls refreshPositions
        // 2. on the instance, we have a counter variable, that get's higher after every append
        // 3. on the local scope, we copy the counter variable, and check in the timeout, if it's still the same
        // 4. this lets only the last addition to the timeout stack through
        this.counter = this.counter ? ++this.counter : 1;
        var counter = this.counter;

        delay.call(
            this,
            function () {
                if (counter === this.counter) {
                    this.refreshPositions(!hardRefresh); // Precompute after each DOM insertion, NOT on mousemove
                }
            }
        );
    }

    function delay(handler, delay) {
        var instance = this;
        function handlerProxy () {
            return (typeof handler === 'string' ? instance[handler] : handler)
                .apply(instance, arguments);
        }
        return setTimeout(handlerProxy, delay || 0);
    }

    function clear(event, noPropagation) {

        this.reverting = false;
        // We delay all events that have to be triggered to after the point where the placeholder has been removed and
        // everything else normalized again
        var i;
        var delayedTriggers = [];

        // We first have to update the dom position of the actual currentItem
        // Note: don't do it if the current item is already removed (by a user), or it gets reappended (see #4088)
        if (!this.noFinalSort && this.currentItem.parent().length) {
            this.placeholder.before(this.currentItem);
        }
        this.noFinalSort = null;

        var helperClass = this.getClassName('helper');
        if (this.helper[0] === this.currentItem[0]) {
            for (i in this.storedCSS) {
                if (this.storedCSS[i] === 'auto' || this.storedCSS[i] === 'static') {
                    this.storedCSS[i] = '';
                }
            }
            this.currentItem.css(this.storedCSS).removeClass(helperClass);
        }
        else {
            this.currentItem.show();
        }

        if (this.fromOutside && !noPropagation) {
            delayedTriggers.push(function (event) {
                this.trigger('receive', event, uiHash.call(this, this.fromOutside));
            });
        }
        if ((this.fromOutside
            || this.domPosition.prev !== this.currentItem.prev().not('.' + helperClass)[0]
            || this.domPosition.parent !== this.currentItem.parent()[0]) && !noPropagation) {
            // Trigger update callback if the DOM position has changed
            delayedTriggers.push(function (event) {
                this.trigger('update', event, uiHash.call(this));
            });
        }

        // Check if the items Container has Changed and trigger appropriate
        // events.
        if (this !== this.currentContainer) {
            if (!noPropagation) {
                delayedTriggers.push(function (event) {
                    this.trigger('remove', event, uiHash.call(this));
                });
                delayedTriggers.push(
                    function (c) {
                        return function (event) {
                            c.trigger('receive', event, uiHash.call(this));
                        };
                    }.call(this, this.currentContainer)
                );
                delayedTriggers.push(
                    function (c) {
                        return function (event) {
                            c.trigger('update', event, uiHash.call(this));
                        };
                    }.call(this, this.currentContainer)
                );
            }
        }


        // Post events to containers
        function delayEvent (type, instance, container) {
            return function (event) {
                container.trigger(type, event, uiHash.call(instance));
            };
        }
        for (i = this.containers.length - 1; i >= 0; i--) {
            if (!noPropagation) {
                delayedTriggers.push(delayEvent('deactivate', this, this.containers[i]));
            }
            if (this.containers[i].containerCache.over) {
                delayedTriggers.push(delayEvent('out', this, this.containers[i]));
                this.containers[i].containerCache.over = 0;
            }
        }

        // Do what was originally in plugins
        if (this.storedCursor) {
            this.document.find('body').css('cursor', this.storedCursor);
            this.storedStylesheet.remove();
        }
        if (this.storedOpacity) {
            this.helper.css('opacity', this.storedOpacity);
        }
        if (this.storedZIndex) {
            this.helper.css('zIndex', this.storedZIndex === 'auto' ? '' : this.storedZIndex);
        }

        this.dragging = false;

        if (!noPropagation) {
            this.trigger('beforeStop', event, uiHash.call(this));
        }

        // $(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately,
        // it unbinds ALL events from the original node!
        this.placeholder[0].parentNode.removeChild(this.placeholder[0]);

        if (!this.cancelHelperRemoval) {
            if (this.helper[0] !== this.currentItem[0]) {
                this.helper.remove();
            }
            this.helper = null;
        }

        if (!noPropagation) {
            for (i = 0; i < delayedTriggers.length; i++) {
                delayedTriggers[i].call(this, event);
            } // Trigger all delayed events
            this.trigger('stop', event, uiHash.call(this));
        }

        this.fromOutside = false;
        return !this.cancelHelperRemoval;

    }

    exports.trigger = function () {
        if (this.$super(arguments) === false) {
            this.cancel();
            return false;
        }
        return true;
    };

    function uiHash(_inst) {
        var inst = _inst || this;
        return {
            helper: inst.helper,
            placeholder: inst.placeholder || $([]),
            position: inst.position,
            originalPosition: inst.originalPosition,
            offset: inst.positionAbs,
            item: inst.currentItem,
            sender: _inst ? _inst.element : null
        };
    }

    var Sortable = require('eoo').create(Mouse, exports);
    require('./bridge')(exports.type, Sortable);

    return Sortable;
});
