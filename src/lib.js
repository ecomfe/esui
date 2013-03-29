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
     */
    var lib = {};

    var whitespace = /(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g;

    /**
     * 删除目标字符串两端的空白字符
     * 
     * @param {string} source 目标字符串
     * @return {string} 删除两端空白字符后的字符串
     */
    lib.trim = function (source) {
        // by Tangram 1.x: baidu.string.trim
        return String(source).replace(whitespace, '');
    };

    /**
     * 为类型构造器建立继承关系
     * 
     * @param {function} subClass 子类构造器
     * @param {function} superClass 父类构造器
     */
    lib.inherits = function (subClass, superClass) {
        // by Tangram 1.x: baidu.lang.inherits
        var Empty = function () {};
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

    /**
     * 将源对象属性拷贝到目标对象
     * 
     * @param {Object} subClass 目标对象
     * @param {Object} source 源对象
     */
    lib.extend = function (target, source) {
        for (var i = 1, len = arguments.length; i < len; i++) {
            source = arguments[i];

            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        }
    };

    /**
     * 对一个object进行深度拷贝
     * 
     * @param {Object} source 需要进行拷贝的对象
     * @return {Object} 拷贝后的新对象
     */
    lib.clone = function (source) {
        // by Tangram 1.x: baidu.object.clone
        if (!source
            || source instanceof Number
            || source instanceof String
            || source instanceof Boolean
        ) {
            return source;
        }
        else if (source instanceof Array) {
            var result = [];
            for (var i = 0; i < source.length; i++) {
                result.push(lib.clone(source[i]));
            }
            return result;
        }
        else {
            var result = {};
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    result[key] = lib.clone(source[key]);
                }
            }
            return result;
        }
        return source;
    };

    /** 
     * 为对象绑定方法和作用域
     * 
     * @param {function} handler 要绑定的函数
     * @param {Object} obj 执行运行时this，如果不传入则运行时this为函数本身
     * @param {...args=} args 函数执行时附加到执行时函数前面的参数
     *
     * @return {function} 封装后的函数
     */
    lib.bind = function (func, scope) {
        // by Tangram 1.x: baidu.fn.bind
        var xargs = arguments.length > 2 ? [].slice.call(arguments, 2) : null;
        return function () {
            var args = xargs 
                ? xargs.concat([].slice.call(arguments)) 
                : arguments;
            return func.apply(scope, args);
        };
    };

    /**
     * 从文档中获取指定的DOM元素
     * 
     * @param {string|HTMLElement} id 元素的id或DOM元素
     * @return {HTMLElement|null} 获取的元素，查找不到时返回null
     */
    lib.g = function (id) {
        // by Tangram 1.x: baidu.dom.g
        if (!id) {
            return null;
        }

        if (typeof id === 'string' || id instanceof String) {
            return document.getElementById(id);
        }
        else if (id.nodeName && (id.nodeType === 1 || id.nodeType === 9)) {
            return id;
        }
        return null;
    };

    /**
     * 字符串格式化
     * 
     * @param {string} template 原字符串
     * @param {Object.<string, *>} data 参数
     * 
     * @return {string}
     */
    lib.format = function (template, data) {
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

                return typeof replacer === 'undefined' ? '' : replacer;
            }
        );
    };

    /**
     * 对目标字符串进行html解码
     * 
     * @param {string} source 目标字符串
     * @return {string} html解码后的字符串
     */
    lib.decodeHTML = function (source) {
        // by Tangram 1.x: baidu.string.decodeHTML
        var str = String(source)
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
        //处理转义的中文和实体字符
        return str.replace(
            /&#([\d]+);/g, 
            function (match, code) {
                return String.fromCharCode(parseInt(code, 10));
            }
        );
    };

    /**
     * 对目标字符串进行html编码
     * 
     * @param {string} source 目标字符串
     * @return {string} html编码后的字符串
     */
    lib.encodeHTML = function (source) {
        // by Tangram 1.x: baidu.string.encodeHTML
        return String(source)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    /**
     * 判断元素是否拥有指定的className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要判断的className
     * 
     * @return {boolean} 是否拥有指定的className
     */
    lib.hasClass = function (element, className) {
        element = lib.g(element);
        var classes = element.className.split(/s+/);
        for (var i = 0; i < classes.length; i++) {
            if (classes[i] === className) {
                return true;
            }
        }

        return false;
    };

    /**
     * 为目标元素添加className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要添加的className
     * 
     * @return {HTMLElement} 目标元素
     */
    lib.addClass = function (element, className) {
        element = lib.g(element);
        var classes = element.className.split(/\s+/);
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
     * 移除目标元素的className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要移除的className
     * 
     * @return {HTMLElement} 目标元素
     */
    lib.removeClass = function (element, className) {
        element = lib.g(element);
        var classes = element.className.split(/\s+/);
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
     * 切换目标元素的className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要切换的className
     * 
     * @return {HTMLElement} 目标元素
     */
    lib.toggleClass = function (element, className) {
        element = lib.g(element);
        var classes = element.className.split(/s+/);
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
     * 将目标元素添加到基准元素之后
     * 
     * @param {HTMLElement|string} newElement 被添加的目标元素
     * @param {HTMLElement|string} existElement 基准元素
     * 
     * @return {HTMLElement} 被添加的目标元素
     */
    lib.insertAfter = function (newElement, existElement) {
        // by Tangram 1.x: baidu.dom.insertAfter
        newElement = lib.g(newElement);
        existElement = lib.g(existElement);
        var existParent = existElement.parentNode;
        
        if (existParent) {
            existParent.insertBefore(newElement, existElement.nextSibling);
        }
        return newElement;
    };

    /**
     * 将目标元素添加到基准元素之前
     * @param {HTMLElement|string} newElement 被添加的目标元素
     * @param {HTMLElement|string} existElement 基准元素
     * 
     * @return {HTMLElement} 被添加的目标元素
     */
    lib.insertBefore = function (newElement, existElement) {
        // by Tangram 1.x: baidu.dom.insertBefore
        newElement = lib.g(newElement);
        existElement = lib.g(existElement);
        var existParent = existElement.parentNode;

        if (existParent) {
            existParent.insertBefore(newElement, existElement);
        }

        return newElement;
    };

    /**
     * 将字符串转换成pascal格式
     * 
     * @param {string} source 源字符串
     * @return {string}
     */
    lib.toPascalCase = function (source) {
        return source.charAt(0).toUpperCase() + source.slice(1);
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

    if (/msie (\d+\.\d+)/i.test(navigator.userAgent)) {
        /**
         * IE浏览器版本号
         * 
         * @type {number}
         */
        lib.ie =  doument.documentMode || + RegExp.$1;
    }

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
        // by Tangram 1.x: baidu.dom.getText
        var ret = '';
        var childs;
        var i = 0;
        var l;

        element = typeof element == 'string' 
            ? document.getElementById(element) : element;

        //  text 和 CDATA 节点，取nodeValue
        if (element.nodeType === 3 || element.nodeType === 4) {

            ret += element.nodeValue;
        } 
        else if (element.nodeType !== 8) {// 8 是 comment Node
            childs = element.childNodes;

            for (l = childs.length; i < l; i++) {
                ret += lib.getText(childs[i]);
            }
        }

        return ret;
    };

    /**
     * 将"name:value[;name:value]"的属性值解析成Object
     * 
     * @param {string} source 属性值源字符串
     * @param {function=} 替换值的处理函数
     * @return {Object}
     */
    lib.parseAttribute = function (source, valueReplacer) {
        if (!source) {
            return {};
        }
        
        var value = {};
        var items = source.split(/\s*;\s*/);
        var len = items.length;

        while (len--) {
            var item = items[len];
            if (!item) {
                continue;
            }

            var segment = item.split(/\s*:\s*/);
            value[segment[0]] = valueReplacer ?
                valueReplacer(segment[1])
                : segment[1];
        }

        return value;
    }

    return lib;
});
