/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file UI基础库适配层
 * @author firede(firede@firede.us)
 */
define(function(require, exports, module) {

    /**
     * @namespace
     */
    var lib = {};

    /**
     * 判断目标参数是否string类型或String对象
     * 
     * @private
     * @param {*} source 目标参数
     * @return {boolean} 类型判断结果
     */
    function _isString(source) {
        // by Tangram 1.x: baidu.lang.isString
        return '[object String]' == Object.prototype.toString.call(source);
    }

    /**
     * 从文档中获取指定的DOM元素
     * 
     * @private
     * @param {string|HTMLElement} id 元素的id或DOM元素
     * @return {HTMLElement} DOM元素，如果不存在，返回null，如果参数不合法，直接返回参数
     */
    function _g(id) {
        // by Tangram 1.x
        if (_isString(id)) {
            return document.getElementById(id);
        }
        return id;
    }

    /**
     * 删除目标字符串两端的空白字符
     * 
     * @param {string} source 目标字符串
     * @return {string} 删除两端空白字符后的字符串
     */
    (function () {
        // by Tangram 1.x: baidu.string.trim
        var trimer = new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g");
        
        lib.trim = function(source) {
            return String(source).replace(trimer, "");
        };
    })();

    /**
     * 为类型构造器建立继承关系
     * 
     * @param {Function} subClass 子类构造器
     * @param {Function} superClass 父类构造器
     * @param {string} type 类名标识
     */
    lib.inherits = function(subClass, superClass, type) {
        // by Tangram 1.x: baidu.lang.inherits
        var key, proto,
            selfProps = subClass.prototype,
            clazz = new Function();

        clazz.prototype = superClass.prototype;
        proto = subClass.prototype = new clazz();

        for (key in selfProps) {
            proto[key] = selfProps[key];
        }
        subClass.prototype.constructor = subClass;
        subClass.superClass = superClass.prototype;

        // 类名标识，兼容Class的toString，基本没用
        typeof type == "string" && (proto.__type = type);

        subClass.extend = function(json) {
            for (var i in json) proto[i] = json[i];
            return subClass;
        }

        return subClass;
    };

    /**
     * 从文档中获取指定的DOM元素
     * 
     * @param {string|HTMLElement} id 元素的id或DOM元素
     * @return {HTMLElement|null} 获取的元素，查找不到时返回null,如果参数不合法，直接返回参数
     */
    lib.g = function(id) {
        // by Tangram 1.x: baidu.dom.g
        if (!id) return null;
        if ('string' == typeof id || id instanceof String) {
            return document.getElementById(id);
        }
        else if (id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
            return id;
        }
        return null;
    };

    /**
     * 字符串格式化
     * 
     * @param {string} source 原字符串
     * @param {Object.<string>|...string} opts 参数
     * 
     * @return {string}
     */
    lib.format = function(source, opts) {
        // by ER 2.x: util.format
        source = String(source);
        
        if ('undefined' != typeof opts) {
            if ('[object Object]' == Object.prototype.toString.call(opts)) {
                return source.replace( /\$\{(.+?)\}/g,
                    function (match, key) {
                        var replacer = opts[key];
                        if ('function' == typeof replacer) {
                            replacer = replacer(key);
                        }

                        return ('undefined' == typeof replacer ? '' : replacer);
                    });
            }
            else {
                var data = Array.prototype.slice.call(arguments, 1);
                var len = data.length;

                return source.replace(/\{(\d+)\}/g,
                    function (match, index) {
                        index = parseInt(index, 10);
                        return (index >= len ? match : data[index]);
                    });
            }
        }
        
        return source;
    }

    /**
     * 判断元素是否拥有指定的className
     * 对于参数className，支持空格分隔的多个className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要判断的className，可以是用空格拼接的多个className
     * 
     * @return {Boolean} 是否拥有指定的className，如果要查询的classname有一个或多个不在元素的className中，返回false
     */
    lib.hasClass = function (element, className) {
        // by Tangram 1.x: baidu.dom.hasClass
        element = lib.g(element);

        // 对于 textNode 节点来说没有 className
        if(!element || !element.className) return false;

        var classArray = lib.trim(className).split(/\s+/), 
            len = classArray.length;

        className = element.className.split(/\s+/).join(" ");

        while (len--) {
            if(!(new RegExp("(^| )" + classArray[len] + "( |\x24)")).test(className)){
                return false;
            }
        }
        return true;
    };

    /**
     * 为目标元素添加className
     * 
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {string} className 要添加的className，允许同时添加多个class，中间使用空白符分隔
     * 
     * @return {HTMLElement} 目标元素
     */
    lib.addClass = function (element, className) {
        // by Tangram 1.x: baidu.dom.addClass
        element = lib.g(element);
        var classArray = className.split(/\s+/),
            result = element.className,
            classMatch = " " + result + " ",
            i = 0,
            l = classArray.length;

        for (; i < l; i++){
             if ( classMatch.indexOf( " " + classArray[i] + " " ) < 0 ) {
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
     * @param {string} className 要移除的className，允许同时移除多个class，中间使用空白符分隔
     * 
     * @return {HTMLElement} 目标元素
     */
    lib.removeClass = function (element, className) {
        // by Tangram 1.x: baidu.dom.removeClass
        element = lib.g(element);

        var oldClasses = element.className.split(/\s+/);
        var newClasses = className.split(/\s+/);
        var lenDel = newClasses.length;

        //考虑到同时删除多个className的应用场景概率较低,故放弃进一步性能优化 
        // by rocy @1.3.4
        for (var i = 0; i < lenDel; ++i) {
            for(var j = 0, lenOld = oldClasses.length; j < lenOld; ++j) {
                if(oldClasses[j] == newClasses[i]) {
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
        var existParent;

        newElement = _g(newElement);
        existElement = _g(existElement);
        existParent = existElement.parentNode;
        
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
        var existParent;
        newElement = _g(newElement);
        existElement = _g(existElement);
        existParent = existElement.parentNode;

        if (existParent) {
            existParent.insertBefore(newElement, existElement);
        }

        return newElement;
    };

    return lib;
});
