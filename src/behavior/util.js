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

        $.fn.extend(
            {

                /**
                 * 查找第一个支持scrolling的父元素,即当前元素在此元素中滚动
                 * @param {boolean} includeHidden 是否保护overflow:hidden
                 * @return {Element}
                 */
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

                /**
                 * 禁止选中
                 */
                disableSelection: (function () {
                    var eventType = 'onselectstart' in document.createElement('div')
                        ? 'selectstart' : 'mousedown';

                    return function () {
                        return this.on(
                            eventType + '.esui-disableSelection',
                            function (event) {
                                event.preventDefault();
                            }
                        );
                    };
                })(),

                /**
                 * 允许选中
                 * @return {$}
                 */
                enableSelection: function () {
                    return this.off('.esui-disableSelection');
                }
            }
        );

        return {

            /**
             * active指定元素
             * @param {Element} document 指定document内active
             * @return {Element}
             */
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

            /**
             * blur指定元素
             * @param {Element} element 要blur的元素
             */
            safeBlur: function (element) {

                // Support: IE9 - 10 only
                // If the <body> is blurred, IE will switch windows
                if (element && element.nodeName.toLowerCase() !== 'body') {
                    $(element).blur();
                }
            },

            /**
             * 判断是否IE
             */
            ie: !!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase())
        };

    }
);
