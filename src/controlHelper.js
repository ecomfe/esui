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
         * 提供控件类常用的辅助方法
         *
         * **此对象将在4.0版本中移除** ，请按以下规则迁移：
         *
         * - `getGUID`移至{@link lib#getGUID}
         * - `createRepaint`移至{@link painters#createRepaint}
         * - 多数方法移至{@link Helper}类下
         * - 浮层相关方法移至{@link Layer}类下
         *
         * @class controlHelper
         * @singleton
         */
        var helper = {};

        /**
         * @ignore
         */
        helper.getGUID = lib.getGUID;

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
         * @ignore
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
         * @ignore
         */
        layer.create = Layer.create;

        /**
         * @ignore
         */
        layer.getZIndex = Layer.getZIndex;

        /**
         * @ignore
         */
        layer.moveToTop = Layer.moveToTop;

        /**
         * @ignore
         */
        layer.moveTo = Layer.moveTo;

        /**
         * @ignore
         */
        layer.resize = Layer.resize;

        /**
         * @ignore
         */
        layer.attachTo = Layer.attachTo;

        /**
         * @ignore
         */
        layer.centerToView = Layer.centerToView;

        return helper;
    }
);
