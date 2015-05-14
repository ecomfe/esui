/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file esui Behavior Util
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {
        var $ = require('jquery');
        // plugins
        $.fn.extend(
            {
                scrollParent: function (includeHidden) {
                    var position = this.css('position');
                    var excludeStaticParent = position === 'absolute';
                    var overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
                    var scrollParent = this.parents().filter(
                        function () {
                            var parent = $(this);
                            if (excludeStaticParent && parent.css('position') === 'static') {
                                return false;
                            }
                            return overflowRegex.test(
                                parent.css('overflow') + parent.css('overflow-y') + parent.css('overflow-x')
                            );
                        }
                    ).eq(0);

                    return position === 'fixed' || !scrollParent.length
                        ? $(this[0].ownerDocument || document) : scrollParent;
                },

                uniqueId: (function () {
                    var uuid = 0;

                    return function () {
                        return this.each(
                            function () {
                                if (!this.id) {
                                    this.id = 'ui-id-' + (++uuid);
                                }
                            }
                        );
                    };
                })(),

                removeUniqueId: function () {
                    return this.each(
                        function () {
                            if (/^ui-id-\d+$/.test(this.id)) {
                                $(this).removeAttr('id');
                            }
                        }
                    );
                },

                /**
                 * 禁止元素被反选从而出现反选背景色
                 */
                disableSelection: (function () {
                    var eventType = 'onselectstart' in document.createElement('div')
                        ? 'selectstart' : 'mousedown';

                    return function () {
                        return this.bind(
                            eventType + '.ui-disableSelection',
                            function (event) {
                                event.preventDefault();
                            }
                        );
                    };
                })(),

                enableSelection: function () {
                    return this.unbind('.ui-disableSelection');
                }
            }
        );

        // selectors
        function focusable(element, hasTabindex) {
            var nodeName = element.nodeName.toLowerCase();
            if ('area' === nodeName) {
                var map = element.parentNode;
                var mapName = map.name;
                if (!element.href || !mapName || map.nodeName.toLowerCase() !== 'map') {
                    return false;
                }
                var img = $('img[usemap="#' + mapName + '"]')[0];
                return !!img && visible(img);
            }
            return (
                /^(input|select|textarea|button|object)$/.test(nodeName)
                    ? !element.disabled
                    : ('a' === nodeName ?  element.href || hasTabindex : hasTabindex)
                ) && visible(element);
        }

        function visible(element) {
            return $.expr.filters.visible(element)
                && !$(element).parents().addBack().filter(
                    function () {
                        return $.css(this, 'visibility') === 'hidden';
                    }
                ).length;
        }

        $.extend(
            $.expr[':'],
            {
                data: $.expr.createPseudo ?
                    $.expr.createPseudo(function (dataName) {
                        return function (elem) {
                            return !!$.data(elem, dataName);
                        };
                    }) :
                    // support: jQuery <1.8
                    function (elem, i, match) {
                        return !!$.data(elem, match[3]);
                    },

                focusable: function (element) {
                    return focusable(element, $.attr(element, 'tabindex') != null);
                },

                tabbable: function (element) {
                    var tabIndex = $.attr(element, 'tabindex');
                    var hasTabindex = tabIndex != null;
                    return (!hasTabindex || tabIndex >= 0) && focusable(element, hasTabindex);
                }
            }
        );

        return {
            keyCode: {
                BACKSPACE: 8,
                COMMA: 188,
                DELETE: 46,
                DOWN: 40,
                END: 35,
                ENTER: 13,
                ESCAPE: 27,
                HOME: 36,
                LEFT: 37,
                PAGE_DOWN: 34,
                PAGE_UP: 33,
                PERIOD: 190,
                RIGHT: 39,
                SPACE: 32,
                TAB: 9,
                UP: 38
            },

            // Internal use only
            safeActiveElement: function (document) {
                var activeElement;

                // Support: IE 9 only
                // IE9 throws an 'Unspecified error' accessing document.activeElement from an <iframe>
                try {
                    activeElement = document.activeElement;
                }
                catch (error) {
                    activeElement = document.body;
                }

                // Support: IE 9 - 11 only
                // IE may return null instead of an element
                // Interestingly, this only seems to occur when NOT in an iframe
                if (!activeElement) {
                    activeElement = document.body;
                }

                // Support: IE 11 only
                // IE11 returns a seemingly empty object in some cases when accessing
                // document.activeElement from an <iframe>
                if (!activeElement.nodeName) {
                    activeElement = document.body;
                }

                return activeElement;
            },

            // Internal use only
            safeBlur: function (element) {

                // Support: IE9 - 10 only
                // If the <body> is blurred, IE will switch windows, see #9420
                if (element && element.nodeName.toLowerCase() !== 'body') {
                    $(element).blur();
                }
            },
            ie: !!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase())
        };

    }
);
