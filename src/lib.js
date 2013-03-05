/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file UI基础库适配层
 * @author firede(firede@firede.us)
 */
define(function() {

    /**
     * lib命名空间
     * 
     * @namespace
     */
    var lib = {};

    var trimer = new RegExp(
        '(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)', 'g');
    /**
     * 删除目标字符串两端的空白字符
     * 
     * @param {string} source 目标字符串
     * @return {string} 删除两端空白字符后的字符串
     */
    lib.trim = function(source) {
        // by Tangram 1.x: baidu.string.trim
        return String(source).replace(trimer, '');
    };

    /**
     * 为类型构造器建立继承关系
     * 
     * @param {function} subClass 子类构造器
     * @param {function} superClass 父类构造器
     * @param {string} type 类名标识
     */
    lib.inherits = function(subClass, superClass, type) {
        // by Tangram 1.x: baidu.lang.inherits
        var Empty = function() {};

        Empty.prototype = superClass.prototype;
        var proto = subClass.prototype = new Empty();

        var selfProps = subClass.prototype;
        for (var key in selfProps) {
            proto[key] = selfProps[key];
        }
        subClass.prototype.constructor = subClass;
        subClass.superClass = superClass.prototype;

        // 类名标识，兼容Class的toString，基本没用
        if (typeof type === 'string') {
            proto.__type = type;
        }

        subClass.extend = function(json) {
            for (var i in json) {
                proto[i] = json[i];
            }
            return subClass;
        };

        return subClass;
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
        else if (baidu.object.isPlain(source)) {
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
    lib.bind = function(func, scope) {
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
    lib.g = function(id) {
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
     * @param {string} source 原字符串
     * @param {Object.<string>|...string} options 参数
     * 
     * @return {string}
     */
    lib.format = function(source, options) {
        // by ER 2.x: util.format
        source = String(source);
        
        if (typeof options === 'undefined') {
            if ('[object Object]' === Object.prototype.toString.call(options)) {
                return source.replace(
                    /\$\{(.+?)\}/g,
                    function (match, key) {
                        var replacer = options[key];
                        if (typeof replacer === 'function') {
                            replacer = replacer(key);
                        }

                        return typeof replacer === 'undefined' ? '' : replacer;
                    }
                );
            }
            else {
                var data = [].slice.call(arguments, 1);

                return source.replace(
                    /\{(\d+)\}/g,
                    function (match, index) {
                        index = parseInt(index, 10);
                        return index >= data.length ? match : data[index];
                    }
                );
            }
        }
        
        return source;
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
            .replace(/&quot;/g,'"')
            .replace(/&lt;/g,'<')
            .replace(/&gt;/g,'>')
            .replace(/&amp;/g, '&');
        //处理转义的中文和实体字符
        return str.replace(
            /&#([\d]+);/g, 
            function(match, entity){
                return String.fromCharCode(parseInt(entity, 10));
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
     * 对于参数className，支持空格分隔的多个className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要判断的className，
     * 可以是用空格拼接的多个className
     * 
     * @return {Boolean} 是否拥有指定的className，
    * 如果要查询的className有一个或多个不在元素的className中，返回false
     */
    lib.hasClass = function (element, className) {
        // by Tangram 1.x: baidu.dom.hasClass
        element = lib.g(element);

        // 对于 textNode 节点来说没有 className
        if(!element || !element.className) {
            return false;
        }

        var classArray = lib.trim(className).split(/\s+/);

        className = element.className.split(/\s+/).join(' ');

        var i = classArray.length;
        while (i--) {
            var tester = new RegExp('(^| )' + classArray[i] + '( |\x24)');
            if(!tester.test(className)) {
                return false;
            }
        }
        return true;
    };

    /**
     * 为目标元素添加className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要添加的className，
     * 允许同时添加多个class，中间使用空白符分隔
     * 
     * @return {HTMLElement} 目标元素
     */
    lib.addClass = function (element, className) {
        // by Tangram 1.x: baidu.dom.addClass
        element = lib.g(element);
        var classArray = className.split(/\s+/);
        var result = element.className;
        var classMatch = ' ' + result + ' ';

        for (var i = 0; i < classArray.length; i++) {
             if (classMatch.indexOf(' ' + classArray[i] + ' ') < 0) {
                 result += (result ? ' ' : '') + classArray[i];
             }
        }

        element.className = result;
        return element;
    };

    /**
     * 移除目标元素的className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要移除的className，
     * 允许同时移除多个class，中间使用空白符分隔
     * 
     * @return {HTMLElement} 目标元素
     */
    lib.removeClass = function (element, className) {
        // by Tangram 1.x: baidu.dom.removeClass
        element = lib.g(element);

        var oldClasses = element.className.split(/\s+/);
        var newClasses = className.split(/\s+/);

        // 考虑到同时删除多个className的应用场景概率较低,故放弃进一步性能优化 
        // by rocy @1.3.4
        for (var i = 0; i < newClasses.length; i++) {
            for(var j = 0; j < oldClasses.length; j++) {
                if(oldClasses[j] === newClasses[i]) {
                    oldClasses.splice(j, 1);
                    break;
                }
            }
        }
        element.className = oldClasses.join(' ');
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
     * page命名空间
     * 
     * @namespace
     */
    lib.page = {};

    var doc = document;
    var body = doc.body;
    var html = doc.documentElement;
    var root = document.compatMode === 'BackCompat' ? body : html;

    /**
     * 获取页面宽度
     * 
     * @return {number} 页面宽度
     */
    lib.page.getWidth = function() {
        // by Tangram 1.x: baidu.page.getWidth
        return Math.max(
            html.scrollWidth, 
            body.scrollWidth, 
            root.clientWidth
        );
    };

    /**
     * 获取页面高度
     * 
     * @return {number} 页面高度
     */
    lib.page.getHeight = function() {
        // by Tangram 1.x: baidu.page.getHeight
        return Math.max(
            html.scrollHeight, 
            body.scrollHeight, 
            root.clientHeight
        );
    };

    return lib;
});
