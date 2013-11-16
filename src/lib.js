/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file UI基础库适配层
 * @author otakustay, firede(firede@firede.us), erik
 */
define(function () {
    /**
     * lib命名空间
     *
     * @namespace
     * @exports  module:lib
     */
    var lib = {};
    var u = require('underscore');

    /* ========================== 语言部分 ========================== */

    var counter = 0x861005;
    /**
     * 获取唯一id
     * 
     * @inner
     * @param {string} prefix 前缀
     * @return {string}
     */
    lib.getGUID = function (prefix) {
        prefix = prefix || 'esui';
        return prefix + counter++;
    };

    var whitespace = /^[\s\xa0\u3000]+|[\u3000\xa0\s]+$/g;

    /**
     * 删除目标字符串两端的空白字符
     *
     * @param {string} source 目标字符串
     *
     * @return {string} 删除两端空白字符后的字符串
     */
    lib.trim = function (source) {
        if (!source) {
            return '';
        }

        return String(source).replace(whitespace, '');
    };

    lib.isArray = u.isArray;

    lib.toArray = u.toArray;

    /**
     * 为类型构造器建立继承关系
     *
     * @param {Function} subClass 子类构造器
     * @param {Function} superClass 父类构造器
     */
    lib.inherits = function (subClass, superClass) {
        // by Tangram 1.x: baidu.lang.inherits
        var Empty = function () {
        };
        Empty.prototype = superClass.prototype;
        var selfPrototype = subClass.prototype;
        var proto = subClass.prototype = new Empty();

        for (var key in selfPrototype) {
            proto[key] = selfPrototype[key];
        }
        subClass.prototype.constructor = subClass;
        subClass.superClass = superClass.prototype;

        return subClass;
    };

    lib.extend = u.extend;

    /**
     * 对一个 object 进行深度复制
     *
     * @param {Object} source 需要进行复制的对象
     *
     * @return {Object} 复制出来的新对象
     */
    lib.clone = function (source) {
        if (!source || typeof source !== 'object') {
            return source;
        }

        var result = source;
        if (lib.isArray(source)) {
            result = [];
            for (var i = 0; i < source.length; i++) {
                result.push(source[i]);
            }
        }
        else if (Object.prototype.toString.call(source) === '[object Object]'
            // IE下，DOM和BOM对象上一个语句为true，
            // isPrototypeOf挂在`Object.prototype`上的，
            // 因此所有的字面量都应该会有这个属性
            // 对于在`window`上挂了`isPrototypeOf`属性的情况，直接忽略不考虑
            && ('isPrototypeOf' in source)
            ) {
            result = {};
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    result[key] = lib.clone(source[key]);
                }
            }
        }

        return result;
    };

    lib.bind = u.bind;

    lib.curry = u.partial;

    /**
     * 字符串格式化
     *
     * @param {string} template 原字符串
     * @param {Object.<string, *>} data 参数
     *
     * @return {string} 格式化后的字符串
     */
    lib.format = function (template, data) {
        if (!template) {
            return '';
        }

        if (data == null) {
            return template;
        }

        return template.replace(
            /\$\{(.+?)\}/g,
            function (match, key) {
                var replacer = data[key];
                if (typeof replacer === 'function') {
                    replacer = replacer(key);
                }

                return replacer == null ? '' : replacer;
            }
        );
    };

    lib.indexOf = u.indexOf;

    lib.decodeHTML = u.unescape;

    lib.encodeHTML = u.escape;

    /**
     * 将字符串转换成 camel 格式
     *
     * @param {string} source 源字符串
     *
     * @return {string}
     */
    lib.camelize = function (source) {
        if (!source) {
            return '';
        }

        return source.replace(
            /-([a-z])/g,
            function (alpha) {
                return alpha.toUpperCase();
            }
        );
    };

    /**
     * 将字符串转换成 pascal 格式
     *
     * @param {string} source 源字符串
     *
     * @return {string}
     */
    lib.pascalize = function (source) {
        if (!source) {
            return '';
        }

        return source.charAt(0).toUpperCase() + lib.camelize(source.slice(1));
    };

    /**
     * 操作日期的方法
     * @namespace
     */
    lib.date = lib.date || {};

    /**
     * 对目标日期对象进行格式化
     *
     * @method module:lib.date.format
     * @grammar lib.date.format(source, pattern)
     * @param {Date} source 目标日期对象
     * @param {string} pattern 日期格式化规则
     *
     * @remark
     *
     * <b>格式表达式，变量含义：</b><br><br>
     * hh: 带 0 补齐的两位 12 进制时表示<br>
     * h: 不带 0 补齐的 12 进制时表示<br>
     * HH: 带 0 补齐的两位 24 进制时表示<br>
     * H: 不带 0 补齐的 24 进制时表示<br>
     * mm: 带 0 补齐两位分表示<br>
     * m: 不带 0 补齐分表示<br>
     * ss: 带 0 补齐两位秒表示<br>
     * s: 不带 0 补齐秒表示<br>
     * YYYY: 带 0 补齐的四位年表示<br>
     * YY: 带 0 补齐的两位年表示<br>
     * MM: 带 0 补齐的两位月表示<br>
     * M: 不带 0 补齐的月表示<br>
     * DD: 带 0 补齐的两位日表示<br>
     * D: 不带 0 补齐的日表示
     *
     * @return {string} 格式化后的字符串
     */
    lib.date.format = function (source, pattern) {
        if (!source) {
            return '';
        }

        if ('string' != typeof pattern) {
            return source.toString();
        }

        function replacer(patternPart, result) {
            pattern = pattern.replace(patternPart, result);
        }

        var pad = lib.number.pad;
        var year = source.getFullYear();
        var month = source.getMonth() + 1;
        var date2 = source.getDate();
        var hours = source.getHours();
        var minutes = source.getMinutes();
        var seconds = source.getSeconds();

        replacer(/YYYY/g, pad(year, 4));
        replacer(/YY/g, pad(parseInt(year.toString().slice(2), 10), 2));
        replacer(/MM/g, pad(month, 2));
        replacer(/M/g, month);
        replacer(/DD/g, pad(date2, 2));
        replacer(/D/g, date2);

        replacer(/HH/g, pad(hours, 2));
        replacer(/H/g, hours);
        replacer(/hh/g, pad(hours % 12, 2));
        replacer(/h/g, hours % 12);
        replacer(/mm/g, pad(minutes, 2));
        replacer(/m/g, minutes);
        replacer(/ss/g, pad(seconds, 2));
        replacer(/s/g, seconds);

        return pattern;
    };

    /**
     * 将目标字符串转换成日期对象
     *
     * @method module:lib.date.parse
     * @grammar lib.date.parse(source)
     * @param {string} source 目标字符串
     * @remark
     *
     * 对于目标字符串，下面这些规则决定了 parse 方法能够成功地解析：
     *
     * - 短日期可以使用“/”或“-”作为日期分隔符，
     * 但是必须用月/日/年的格式来表示，例如"7/20/96"。
     * - 以 "July 10 1995" 形式表示的长日期中的年、月、日可以按任何顺序排列，
     * 年份值可以用 2 位数字表示也可以用 4 位数字表示。
     * 如果使用 2 位数字来表示年份，那么该年份必须大于或等于 70。
     * - 括号中的任何文本都被视为注释。这些括号可以嵌套使用。
     * - 逗号和空格被视为分隔符。允许使用多个分隔符。
     * - 月和日的名称必须具有两个或两个以上的字符。
     * 如果两个字符所组成的名称不是独一无二的，
     * 那么该名称就被解析成最后一个符合条件的月或日。
     * 例如，"Ju" 被解释为七月而不是六月。
     * - 在所提供的日期中，如果所指定的星期几的值与
     * 按照该日期中剩余部分所确定的星期几的值不符合，
     * 那么该指定值就会被忽略。
     * 例如，尽管 1996 年 11 月 9 日实际上是星期五，
     * "Tuesday November 9 1996" 也还是可以被接受并进行解析的。
     * 但是结果 date 对象中包含的是 "Friday November 9 1996"。
     * - JScript 处理所有的标准时区，
     * 以及全球标准时间 (UTC) 和格林威治标准时间 (GMT)。
     * - 小时、分钟、和秒钟之间用冒号分隔，
     * 尽管不是这三项都需要指明。"10:"、"10:11"、和 "10:11:12" 都是有效的。
     * - 如果使用 24 小时计时的时钟，
     * 那么为中午 12 点之后的时间指定"PM"是错误的。例如 "23:15 PM" 就是错误的。
     * - 包含无效日期的字符串是错误的。
     * 例如，一个包含有两个年份或两个月份的字符串就是错误的。
     *
     * @return {Date} 转换后的日期对象
     */
    lib.date.parse = function (source) {
        if (!source) {
            return new Date(0);
        }

        // by Tangram 1.x: baidu.date.parse
        var reg = new RegExp('^\\d+(\\-|\\/)\\d+(\\-|\\/)\\d+\x24');
        if ('string' == typeof source) {
            if (reg.test(source) || isNaN(Date.parse(source))) {
                var d = source.split(/ |T/);
                var d1 = d.length > 1
                    ? d[1].split(/[^\d]/)
                    : [0, 0, 0];
                var d0 = d[0].split(/[^\d]/);
                return new Date(
                    d0[0] - 0, d0[1] - 1, d0[2] - 0,
                    d1[0] - 0, d1[1] - 0, d1[2] - 0
                );
            }
            else {
                return new Date(source);
            }
        }

        return new Date();
    };

    /**
     * 操作 number 的方法
     *
     * @namespace
     */
    lib.number = lib.number || {};

    /**
     * 对目标数字进行0补齐处理
     *
     * @method module:lib.number.pad
     * @grammar lib.number.pad(source, length)
     * @param {number} source 需要处理的数字
     * @param {number} length 需要输出的长度
     *
     * @return {string} 对目标数字进行0补齐处理后的结果
     */
    lib.number.pad = function (source, length) {
        var pre = '';
        var negative = (source < 0);
        var string = String(Math.abs(source));

        if (string.length < length) {
            pre = (new Array(length - string.length + 1)).join('0');
        }

        return (negative ? '-' : '') + pre + string;
    };

    /* ========================== DOM部分 ========================== */

    /**
     * 从文档中获取指定的 DOM 元素
     *
     * @param {string|HTMLElement} id 元素的 id 或 DOM 元素
     *
     * @return {?HTMLElement} 获取的元素，查找不到时返回null
     */
    lib.g = function (id) {
        if (!id) {
            return null;
        }

        return typeof id === 'string' ? document.getElementById(id) : id;
    };

    /**
     * 判断一个元素是否输入元素
     *
     * @param {HTMLElement} element 目标元素
     *
     * @return {boolean}
     */
    lib.isInput = function (element) {
        var nodeName = element.nodeName.toLowerCase();
        return nodeName === 'input'
            || nodeName === 'select'
            || nodeName === 'textarea';
    };

    /**
     * 判断元素是否拥有指定的 className
     *
     * @param {HTMLElement} element 目标元素
     * @param {string} className 要判断的className
     *
     * @return {boolean} 是否拥有指定的className
     */
    lib.hasClass = function (element, className) {
        if (!element) {
            return false;
        }

        if (!className) {
            return true;
        }

        var classes = element.className.split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            if (classes[i] === className) {
                return true;
            }
        }

        return false;
    };

    /**
     * 为目标元素添加 className
     *
     * @param {HTMLElement} element 目标元素或目标元素的 id
     * @param {string} className 要添加的 className
     *
     * @return {HTMLElement} 目标元素
     */
    lib.addClass = function (element, className) {
        if (!element || !className) {
            return element;
        }

        var classes = element.className ? element.className.split(/\s+/) : [];
        for (var i = 0; i < classes.length; i++) {
            if (classes[i] === className) {
                return element;
            }
        }

        classes.push(className);
        element.className = classes.join(' ');

        return element;
    };

    /**
     * 批量添加 className
     *
     * @param {HTMLElement} element 目标元素
     * @param {Array.<string>} classes 需添加的 className
     *
     * @return {HTMLElement} 目标元素
     */
    lib.addClasses = function (element, classes) {
        if (!element || !classes) {
            return element;
        }

        var originalClasses =
            element.className ? element.className.split(/\s+/) : [];
        var map = {};
        for (var i = 0; i < originalClasses.length; i++) {
            map[originalClasses[i]] = true;
        }

        var changed = false;
        for (var i = 0; i < classes.length; i++) {
            var className = classes[i];
            if (!map.hasOwnProperty(className)) {
                originalClasses.push(className);
                changed = true;
            }
        }

        if (changed) {
            element.className = originalClasses.join(' ');
        }

        return element;
    };

    /**
     * 移除目标元素的 className
     *
     * @param {HTMLElement} element 目标元素或目标元素的 id
     * @param {string} className 要移除的 className
     *
     * @return {HTMLElement} 目标元素
     */
    lib.removeClass = function (element, className) {
        if (!element || !className) {
            return element;
        }

        var classes = element.className ? element.className.split(/\s+/) : [];
        for (var i = 0; i < classes.length; i++) {
            if (classes[i] === className) {
                classes.splice(i, 1);
                i--;
            }
        }
        element.className = classes.join(' ');

        return element;
    };

    /**
     * 批量移除 className
     *
     * @param {HTMLElement} element 目标元素
     * @param {Array.<string>} 需移除的 className
     *
     * @return {HTMLElement} 目标元素
     */
    lib.removeClasses = function (element, classes) {
        if (!element || !classes) {
            return element;
        }

        var map = {};
        for (var i = 0; i < classes.length; i++) {
            map[classes[i]] = true;
        }

        var originalClasses =
            element.className ? element.className.split(/\s+/) : [];
        var finalClasses = [];
        for (var i = 0; i < originalClasses.length; i++) {
            var className = originalClasses[i];
            if (!map.hasOwnProperty(className)) {
                finalClasses.push(className);
            }
        }

        if (finalClasses.length !== originalClasses.length) {
            element.className = finalClasses.join(' ');
        }

        return element;
    };

    /**
     * 切换目标元素的 className
     *
     * @param {HTMLElement} element 目标元素或目标元素的 id
     * @param {string} className 要切换的 className
     *
     * @return {HTMLElement} 目标元素
     */
    lib.toggleClass = function (element, className) {
        if (!element || !className) {
            return element;
        }

        var classes = element.className ? element.className.split(/\s+/) : [];
        var containsClass = false;
        for (var i = 0; i < classes.length; i++) {
            if (classes[i] === className) {
                classes.splice(i, 1);
                containsClass = true;
                i--;
            }
        }

        if (!containsClass) {
            classes.push(className);
        }
        element.className = classes.join(' ');

        return element;
    };

    /**
     * 移除目标元素
     *
     * @param {HTMLElement} element 目标元素或目标元素的 id
     *
     */
    lib.removeNode = function (element) {
        if (typeof element === 'string') {
            element = lib.g(element);
        }

        if (!element) {
            return;
        }

        var parent = element.parentNode;
        if (parent) {
            parent.removeChild(element);
        }
    };

    /**
     * 将目标元素添加到基准元素之后
     *
     * @param {HTMLElement} newElement 被添加的目标元素
     * @param {HTMLElement} existElement 基准元素
     *
     * @return {HTMLElement} 被添加的目标元素
     */
    lib.insertAfter = function (newElement, existElement) {
        var existParent = existElement.parentNode;

        if (existParent) {
            existParent.insertBefore(newElement, existElement.nextSibling);
        }
        return newElement;
    };

    /**
     * 将目标元素添加到基准元素之前
     *
     * @param {HTMLElement} newElement 被添加的目标元素
     * @param {HTMLElement} existElement 基准元素
     *
     * @return {HTMLElement} 被添加的目标元素
     */
    lib.insertBefore = function (newElement, existElement) {
        var existParent = existElement.parentNode;

        if (existParent) {
            existParent.insertBefore(newElement, existElement);
        }

        return newElement;
    };

    /**
     * 获取子元素
     * @param {HTMLElement} element 目标元素
     * @param {Array.<HTMLElement>} 目标元素的所有子元素
     */
    lib.getChildren = function (element) {
        var children = element.children;
        var result = [];
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.nodeType === 1) {
                result.push(child);
            }
        }

        return result;
    };


    /**
     * 获取计算样式值
     *
     * @param {HTMLElement} element 目标元素
     * @param {string} key 样式名称
     *
     * @return {string}
     */
    lib.getComputedStyle = function (element, key) {
        if (!element) {
            return '';
        }

        var doc = element.nodeType == 9
            ? element
            : element.ownerDocument || element.document;

        if (doc.defaultView && doc.defaultView.getComputedStyle) {
            var styles = doc.defaultView.getComputedStyle(element, null);
            if (styles) {
                return styles[key] || styles.getPropertyValue(key);
            }
        }
        else if (element && element.currentStyle) {
            return element.currentStyle[key];
        }
        return '';
    };

    /**
     * 获取元素样式值
     *
     * @param {HTMLElement} element 目标元素
     * @param {string} key 样式名称
     *
     * @return {string} 目标元素的指定样式值
     */
    lib.getStyle = function (element, key) {
        key = lib.camelize(key);
        return element.style[key]
            || (element.currentStyle ? element.currentStyle[key] : '')
            || lib.getComputedStyle(element, key);
    };

    /**
     * 获取元素在页面中的位置和尺寸信息
     *
     * @param {HTMLElement} element 目标元素
     *
     * @return {Object} 元素的尺寸和位置信息
     */
    lib.getOffset = function (element) {
        var rect = element.getBoundingClientRect();
        var offset = {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top
        };
        var clientTop = document.documentElement.clientTop
            || document.body.clientTop
            || 0;
        var clientLeft = document.documentElement.clientLeft
            || document.body.clientLeft
            || 0;
        var scrollTop = window.pageYOffset
            || document.documentElement.scrollTop;
        var scrollLeft = window.pageXOffset
            || document.documentElement.scrollLeft;
        offset.top = offset.top + scrollTop - clientTop;
        offset.bottom = offset.bottom + scrollTop - clientTop;
        offset.left = offset.left + scrollLeft - clientLeft;
        offset.right = offset.right + scrollLeft - clientLeft;

        return offset;
    };

    lib.on = function (element, type, listener) {
        if (element.addEventListener) {
            element.addEventListener(type, listener, false);
        }
        else if (element.attachEvent) {
            element.attachEvent('on' + type, listener);
        }
    };

    lib.un = function (element, type, listener) {
        if (element.addEventListener) {
            element.removeEventListener(type, listener, false);
        }
        else if (element.attachEvent) {
            element.detachEvent('on' + type, listener);
        }
    };

    lib.getText = function (element) {
        var ret = '';
        var childs;
        var i = 0;
        var l;

        //  text 和 CDATA 节点，取nodeValue
        if (element.nodeType === 3 || element.nodeType === 4) {

            ret += element.nodeValue;
        }
        // 8 是 comment Node
        else if (element.nodeType !== 8) {
            childs = element.childNodes;

            for (l = childs.length; i < l; i++) {
                ret += lib.getText(childs[i]);
            }
        }

        return ret;
    };

    /**
     * 检查元素是否有指定的属性
     *
     * @param {HTMLElement} element 指定元素
     * @param {string} name 指定属性名称
     *
     * @return {string}
     */
    lib.hasAttribute = function (element, name) {
        if (element.hasAttribute) {
            return element.hasAttribute(name);
        }
        else {
            return element.attributes
                && element.attributes[name]
                && element.attributes[name].specified;
        }
    };

    /**
     * 提供给 setAttribute 与 getAttribute 方法作名称转换使用
     * ie6, 7 下 class 要转换成 className
     *
     * @meta standard
     */
    lib.NAME_ATTRS = (function () {
        var result = {
            'cellpadding': 'cellPadding',
            'cellspacing': 'cellSpacing',
            'colspan': 'colSpan',
            'rowspan': 'rowSpan',
            'valign': 'vAlign',
            'usemap': 'useMap',
            'frameborder': 'frameBorder'
        };

        var div = document.createElement('div');
        div.innerHTML = '<label for="test" className="test"></label>';
        var label = div.getElementsByTagName('label')[0];

        if (label.getAttribute('class') === 'test') {
            result['className'] = 'class';
        }
        else {
            result['class'] = 'className';
        }

        if (label.getAttribute('for') === 'test') {
            result['htmlFor'] = 'for';
        }
        else {
            result['for'] = 'htmlFor';
        }

        return result;
    })();


    /**
     * 设置元素属性，会对某些值做转换
     *
     * @param {(HTMLElement | string)} element 目标元素或目标元素 id
     * @param {string} key 要设置的属性名
     * @param {string} value 要设置的属性值
     *
     * @return {HTMLElement} 目标元素
     */
    lib.setAttribute = function (element, key, value) {
        element = lib.g(element);

        if ('style' == key) {
            element.style.cssText = value;
        }
        else {
            key = lib.NAME_ATTRS[key] || key;
            element.setAttribute(key, value);
        }

        return element;
    };

    /**
     * 获取目标元素的属性值
     *
     * @grammar lib.dom.getAttribute(element, key)
     * @param {(HTMLElement | string)} element 目标元素或目标元素的id
     * @param {string} key 要获取的attribute键名
     * @shortcut getAttr
     * @meta standard
     * @see lib.dom.setAttribute
     *
     * @return {?string} 目标元素的attribute值，获取不到时返回 null
     */
    lib.getAttribute = function (element, key) {
        element = lib.g(element);

        if ('style' == key) {
            return element.style.cssText;
        }

        key = lib.NAME_ATTRS[key] || key;
        return element.getAttribute(key);
    };

    /**
     * 移除元素属性
     *
     * @param {(HTMLElement | string)} element 目标元素或目标元素 id
     * @param {string} key 属性名称
     */
    lib.removeAttribute = function (element, key) {
        element = lib.g(element);

        key = lib.NAME_ATTRS[key] || key;
        element.removeAttribute(key);
    };

    /**
     * page命名空间
     *
     * @namespace
     */
    lib.page = {};

    var documentElement = document.documentElement;
    var body = document.body;
    var viewRoot = document.compatMode == 'BackCompat' ? body : documentElement;

    /**
     * 获取页面宽度
     *
     * @method module:lib.page.getWidth
     *
     * @return {number} 页面宽度
     */
    lib.page.getWidth = function () {
        // by Tangram 1.x: baidu.page.getWidth
        return Math.max(
            documentElement.scrollWidth,
            body.scrollWidth,
            viewRoot.clientWidth
        );
    };

    /**
     * 获取页面高度
     *
     * @method module:lib.page.getHeight
     *
     * @return {number} 页面高度
     */
    lib.page.getHeight = function () {
        // by Tangram 1.x: baidu.page.getHeight
        return Math.max(
            documentElement.scrollHeight,
            body.scrollHeight,
            viewRoot.clientHeight
        );
    };


    /**
     * 获取页面视觉区域宽度
     *
     * @method module:lib.page.getViewWidth
     *
     * @return {number} 页面视觉区域宽度
     */
    lib.page.getViewWidth = function () {
        return viewRoot.clientWidth;
    };

    /**
     * 获取页面视觉区域高度
     *
     * @method module:lib.page.getViewHeight
     *
     * @return {number} 页面视觉区域高度
     */
    lib.page.getViewHeight = function () {
        return viewRoot.clientHeight;
    };

    /**
     * 获取纵向滚动量
     *
     * @method module:lib.page.getScrollTop
     *
     * @return {number} 纵向滚动量
     */
    lib.page.getScrollTop = function () {
        return window.pageYOffset
            || document.documentElement.scrollTop
            || document.body.scrollTop;
    };

    /**
     * 获取横向滚动量
     *
     * @method module:lib.page.getScrollLeft
     *
     * @return {number} 横向滚动量
     */
    lib.page.getScrollLeft = function () {
        return window.pageXOffset
            || document.documentElement.scrollLeft
            || document.body.scrollLeft;
    };

    /**
     * 事件处理
     *
     * @namespace
     */
    lib.event = {};

    /**
     * 阻止事件默认行为
     *
     * @method module:lib.event.preventDefault
     * @param {Event} event 事件对象
     */
    lib.event.preventDefault = function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        else {
            event.returnValue = false;
        }
    };

    /**
     * 阻止事件冒泡
     *
     * @method module:lib.event.stopPropagation
     * @param {Event} event 事件对象
     */
    lib.event.stopPropagation = function (event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        else {
            event.cancelBubble = true;
        }
    };

    /**
     * 获取鼠标位置
     *
     * @method module:lib.event.getMousePosition
     * @param {Event} event 事件对象
     */
    lib.event.getMousePosition = function (event) {
        var doc = document.documentElement;
        var body = document.body;

        event.pageX = event.pageX || (
            event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0)
            );

        event.pageY = event.pageY || (
            event.clientY +
                (doc && doc.scrollTop || body && body.scrollTop || 0) -
                (doc && doc.clientTop || body && body.clientTop || 0)
            );
    };

    /**
     * 阻止事件冒泡
     *
     * @method module:lib.event.getTarget
     * @param {Event} e 事件对象
     *
     * @return {Object} 获取事件目标对象
     */
    lib.event.getTarget = function (e) {
        e = e || window.event;
        return e.target || e.srcElement;
    };

    if (/msie (\d+\.\d+)/i.test(navigator.userAgent)) {
        /**
         * IE浏览器版本号
         *
         * @type {number}
         */
        lib.ie = document.documentMode || +RegExp.$1;
    }

    /**
     * 操作dom的方法
     *
     * @namespace
     */
    lib.dom = lib.dom || {};

    /**
     * 获取目标元素的第一个元素节点
     *
     * @method module:lib.dom.first
     * @grammar lib.dom.first(element)
     * @param {(HTMLElement | string)} element 目标元素或目标元素的 id
     * @meta standard
     *
     * @return {?HTMLElement} 目标元素的第一个元素节点，查找不到时返回 null
     */
    lib.dom.first = function (element) {
        element = lib.g(element);

        var node = element['firstChild'];
        for (; node; node = node['nextSibling']) {
            if (node.nodeType == 1) {
                return node;
            }
        }

        return null;
    };

    /**
     * 获取目标元素的最后一个元素节点
     *
     * @method module:lib.dom.last
     * @grammar lib.dom.last(element)
     * @param {(HTMLElement | string)} element 目标元素或目标元素的 id
     * @meta standard
     *
     * @return {?HTMLElement} 目标元素的第一个元素节点，查找不到时返回 null
     */
    lib.dom.last = function (element) {
        element = lib.g(element);
        if (element.lastElementChild) {
            return element.lastElementChild;
        }

        var node = element.lastChild;
        for (; node; node = node.previousSibling) {
            if (node.nodeType === 1) {
                return node;
            }
        }

        return null;
    };

    /**
     * 获取目标元素的下一个兄弟元素节点
     *
     * @method module:lib.dom.next
     * @grammar lib.dom.next(element)
     * @param {(HTMLElement | string)} element 目标元素或目标元素的 id
     * @meta standard
     *
     * @return {?HTMLElement} 目标元素的下一个兄弟元素节点，查找不到时返回 null
     */
    lib.dom.next = function (element) {
        element = lib.g(element);

        var node = element['nextSibling'];
        for (; node; node = node['nextSibling']) {
            if (node.nodeType == 1) {
                return node;
            }
        }

        return null;
    };

    /**
     * 判断一个元素是否包含另一个元素
     *
     * @method  module:lib.dom.contains
     * @grammar lib.dom.contains(container, contained)
     * @param {(HTMLElement | string)} container 包含元素或元素的 id
     * @param {(HTMLElement | string)} contained 被包含元素或元素的 id
     * @meta standard
     *
     * @return {boolean} contained 元素是否被包含于 container 元素的 DOM 节点上
     */
    lib.dom.contains = function (container, contained) {
        var g = lib.g;
        container = g(container);
        contained = g(contained);

        //fixme: 无法处理文本节点的情况(IE)
        return container.contains
            ? container != contained && container.contains(contained)
            : !!(container.compareDocumentPosition(contained) & 16);
    };

    return lib;
});