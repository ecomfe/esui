/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 控件类常用的helper方法模块
 * @author erik, otakustay
 */
define(
    function (require) {
        var lib = require('./lib');

        var Helper = require('./Helper');

        /**
         * 控件类常用的helper方法模块
         * 
         * @type {Object}
         */
        var helper = {};

        /**
         * 获取唯一id
         * 
         * @inner
         * @param {string} prefix 前缀
         * @return {string}
         */
        helper.getGUID = function (prefix) {
            return lib.getGUID();
        };

        var methods = [
            // life
            'initViewContext', 'initExtensions',
            'isInStage', 'changeStage',
            'dispose', 'beforeDispose', 'afterDispose',
            // dom
            'getPartClasses', 'addPartClasses', 'removePartClasses',
            'getStateClasses', 'addStateClasses', 'removeStateClasses',
            'getId', 'replaceMain',
            // event
            'addDOMEvent', 'removeDOMEvent', 'clearDOMEvents'
        ];

        helper.createRepaint = require('./painters').createRepaint;

        // 补上原有的方法，全部代理到`Helper`上
        require('underscore').each(
            methods,
            function (name) {
                helper[name] = function (control) {
                    var helper = control.helper || new Helper(control);
                    var args = [].slice.call(arguments, 1);
                    return helper[name].apply(helper, args);
                };
            }
        );

        // 再往下的全部是等待废弃的

        /**
         * 替换控件的主元素中提取信息(name value disabled readonly)
         *
         * @param {Control} control 控件实例
         * @param {Object} options 需要更新的参数
         * @return {Object} 提取到的value和name
         * @deprecated 使用{@link Helper#extractOptionsFromInput}代替
         */
        helper.extractValueFromInput = function (control, options) {
            var main = control.main;
            // 如果是输入元素
            if (lib.isInput(main)) {
                if (main.value && !options.value) {
                    options.value = main.value;
                }
                if (main.name && !options.name) {
                    options.name = main.name;
                }
                if (main.disabled 
                    && (options.disabled === null
                        || options.disabled === undefined)) {
                    options.disabled = main.disabled;
                }
                if (main.readOnly 
                    && (options.readOnly === null
                        || options.readOnly === undefined)) {
                    options.readOnly = main.readonly || main.readOnly;
                }
            }
        };

        var layer = helper.layer = {};
        var Layer = require('./Layer');

        /**
         * 创建层元素
         *
         * @param {string} [tagName] 元素的标签名，默认为`div`
         * @return {HTMLElement}
         * @deprecated 将在4.0版本中移除，使用{@link Layer#create}代替
         */
        layer.create = Layer.create;

        /**
         * 获取层应当使用的`z-index`的值
         *
         * @param {HTMLElement} [owner] 层的所有者元素
         * @return {number}
         * @deprecated 将在4.0版本中移除，使用{@link Layer#getZIndex}代替
         */
        layer.getZIndex = Layer.getZIndex;

        /**
         * 将当前层移到最前
         *
         * @param {HTMLElement} element 目标层元素
         * @deprecated 将在4.0版本中移除，使用{@link Layer#moveToTop}代替
         */
        layer.moveToTop = Layer.moveToTop;

        /**
         * 移动层的位置
         *
         * @param {HTMLElement} element 目标层元素
         * @param {number} top 上边界距离
         * @param {number} left 左边界距离
         * @deprecated 将在4.0版本中移除，使用{@link Layer#moveTo}代替
         */
        layer.moveTo = Layer.moveTo;

        /**
         * 缩放层的大小
         *
         * @param {HTMLElement} element 目标层元素
         * @param {number} width 宽度
         * @param {number} height 高度
         * @deprecated 将在4.0版本中移除，使用{@link Layer#resize}代替
         */
        layer.resize = Layer.resize;

        /**
         * 让当前层靠住一个指定的元素
         *
         * @param {HTMLElement} element 目标层元素
         * @param {HTMLElement} target 目标元素
         * @param {Object} [options] 停靠相关的选项
         * @param {string} [options.top] 指示当前层的上边缘靠住元素的哪个边，
         * 可选值为`"top"`或`"bottom"`
         * @param {string} [options.bottom] 指示当前层的下边缘靠住元素的哪个边，
         * 可选值为`"top"`或`"bottom"`，当`top`值为`"bottom"`时，该值无效
         * @param {string} [options.left] 指示当前层的左边缘靠住元素的哪个边，
         * 可选值为`"left"`或`"right"`
         * @param {string} [options.right] 指示当前层的下边缘靠住元素的哪个边，
         * 可选值为`"left"`或`"right"`，当`left`值为`"right"`时，该值无效
         * @param {number} [options.width] 指定层的宽度
         * @param {number} [options.height] 指定层的高度
         * @param {string} [options.spaceDetection] 指定检测某个方向的可用距离，
         * 可选值为`"vertical"`、`"horizontal"`和`"both"`，当指定一个值时，
         * 会检测这个方向上是否有足够的空间放置层，如空间不够则向反方向放置
         * @deprecated 将在4.0版本中移除，使用{@link Layer#attachTo}代替
         */
        layer.attachTo = Layer.attachTo;

        /**
         * 将层在视图中居中
         *
         * @param {HTMLElement} element 目标层元素
         * @param {Object} [options] 相关配置项
         * @param {number} [options.width] 指定层的宽度
         * @param {number} [options.height] 指定层的高度
         * @param {number} [options.minTop] 如果层高度超过视图高度，
         * 则留下该值的上边界保底
         * @param {number} [options.minLeft] 如果层宽度超过视图高度，
         * 则留下该值的左边界保底
         * @deprecated 将在4.0版本中移除，使用{@link Layer#centerToView}代替
         */
        layer.centerToView = Layer.centerToView

        return helper;
    }
);
