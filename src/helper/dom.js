/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件部件相关辅助方法
 * @author otakustay
 */
define(
    function (require) {
        /**
         * 获取控件用于生成css class的类型
         * 
         * @inner
         * @param {Control} control 控件实例
         * @return {string}
         */
        function getControlClassType(control) {
            var type = control.styleType || control.type;
            return type.toLowerCase();
        }

        /**
         * 将参数用`-`连接成字符串
         * 
         * @inner
         * @param {string} ...arg 
         * @return {string}
         */
        function joinByStrike() {
            return [].slice.call(arguments, 0).join('-');
        }

        var u = require('underscore');
        var lib = require('../lib');
        var ui = require('../main');
        var helper = {};

        /**
         * 获取控件部件相关的class数组
         *
         * @param {string=} part 部件名称
         * @return {Array.<string>}
         */
        helper.getPartClasses = function (part) {
            // main:
            //   ui-ctrl 为了定义有限全局的normalize
            //   ui-{type}
            //   skin-{skinname}
            //   skin-{skinname}-{type}
            // part:
            //   ui-{type}-{part}
            //   skin-{skinname}-{type}-{part}

            var type = getControlClassType(this.control);
            var skin = this.control.skin;
            var prefix = ui.getConfig('uiClassPrefix');
            var skinPrefix = ui.getConfig('skinClassPrefix');
            var classes = [];
            
            if (part) {
                classes.push(joinByStrike(prefix, type, part));
                if (skin) {
                    classes.push(joinByStrike(skinPrefix, skin, type, part));
                }
            }
            else {
                classes.push('ui-ctrl');
                classes.push(joinByStrike(prefix, type));
                if (skin) {
                    classes.push(
                        joinByStrike(skinPrefix, skin),
                        joinByStrike(skinPrefix, skin, type)
                    );
                }
            }

            return classes;
        };

        /**
         * 获取控件部件相关的class字符串
         *
         * @param {string=} part 部件名称
         * @return {string}
         */
        helper.getPartClassName = function (part) {
            return this.getPartClasses(part).join(' ');
        };

        /**
         * 添加控件部件相关的class
         *
         * @param {string=} part 部件名称
         * @param {HTMLElement=} element 部件元素
         */
        helper.addPartClasses = function (part, element) {
            if (typeof element === 'string') {
                element = this.getPart(element);
            }
            
            element = element || this.control.main;
            if (element) {
                lib.addClasses(
                    element,
                    this.getPartClasses(part)
                );
            }
        };

        /**
         * 移除控件部件相关的class
         *
         * @param {string=} part 部件名称
         * @param {HTMLElement=} element 部件元素
         */
        helper.removePartClasses = function (part, element) {
            if (typeof element === 'string') {
                element = this.getPart(element);
            }

            element = element || this.control.main;
            if (element) {
                lib.removeClasses(
                    element,
                    this.getPartClasses(part)
                );
            }
        };

        /**
         * 获取控件状态相关的class数组
         *
         * @param {string} state 状态名称
         * @return {Array.<string>}
         */
        helper.getStateClasses = function (state) {
            // ui-{type}-{statename}
            // state-{statename}
            // skin-{skinname}-{statename}
            // skin-{skinname}-{type}-{statename}
            
            var type = getControlClassType(this.control);
            var getConf = ui.getConfig;
            var classes = [
                joinByStrike(getConf('uiClassPrefix'), type, state),
                joinByStrike(getConf('stateClassPrefix'), state)
            ];

            var skin = this.control.skin;
            if (skin) {
                var skinPrefix = getConf('skinClassPrefix');
                classes.push(
                    joinByStrike(skinPrefix, skin, state),
                    joinByStrike(skinPrefix, skin, type, state)
                );
            }
            
            return classes;
        };

        /**
         * 添加控件状态相关的class
         *
         * @param {string} state 状态名称
         */
        helper.addStateClasses = function (state) {
            var element = this.control.main;
            if (element) {
                lib.addClasses(
                    element, 
                    this.getStateClasses(state)
                );
            }
        };

        /**
         * 移除控件状态相关的class
         *
         * @param {string} state 状态名称
         */
        helper.removeStateClasses = function (state) {
            var element = this.control.main;
            if (element) {
                lib.removeClasses(
                    element, 
                    this.getStateClasses(state)
                );
            }
        };

        /**
         * 获取用于控件dom元素的id
         * 
         * @param {string=} part 部件名称
         * @return {string} 
         */
        helper.getId = function (part) {
            part = part ? '-' + part : '';
            if (!this.control.domIDPrefix) {
                this.control.domIDPrefix = 
                    this.control.viewContext && this.control.viewContext.id;
            }
            var prefix = this.control.domIDPrefix
                ? this.control.domIDPrefix+ '-'
                : '';
            return 'ctrl-' + prefix + this.control.id + part;
        };

        /**
         * 创建一个部件元素
         *
         * @param {string} part 部件名称
         * @param {string} [nodeName] 使用的元素类型
         */
        helper.createPart = function (part, nodeName) {
            nodeName = nodeName || 'div';
            var element = document.createElement(nodeName);
            element.id = this.getId(part);
            this.addPartClasses(part, element);
            return element;
        };

        /**
         * 获取指定部件的DOM元素
         *
         * @param {string} part 部件名称
         * @return {HTMLElement}
         */
        helper.getPart = function (part) {
            return lib.g(this.getId(part));
        };

        /**
         * 判断DOM元素是否某一部件
         *
         * @param {HTMLElement} element DOM元素
         * @param {string} part 部件名称
         * @return {boolean}
         */
        helper.isPart = function (element, part) {
            var className = this.getPartClasses(part)[0];
            return lib.hasClass(element, className);
        };

        // 这些属性是不复制的，多数是某些元素特有
        var INPUT_SPECIFIED_ATTRIBUTES = {
            type: true, name: true, alt: true, 
            autocomplete: true, autofocus: true,
            checked: true, dirname: true, disabled: true,
            form: true, formaction: true, formenctype: true,
            formmethod: true, formnovalidate: true, formtarget: true,
            width: true, height: true, inputmode: true, list: true,
            max: true, maxlength: true, min: true, minlength: true,
            multiple: true, pattern: true, placeholder: true,
            readonly: true, required: true, size: true, src: true,
            step: true, value: true
        };

        /**
         * 替换控件的主元素
         *
         * @param {HTMLElement=} main 用于替换的主元素
         * @parma {HTMLElement=} 原来的主元素
         */
        helper.replaceMain = function (main) {
            main = main || this.control.createMain();
            var initialMain = this.control.main;

            // 欺骗一下`main`模块，让它别再次对原主元素进行控件创建
            initialMain.setAttribute(
                ui.getConfig('instanceAttr'),
                lib.getGUID()
            );

            // 把能复制的属性全复制过去
            var attributes = initialMain.attributes;
            for (var i = 0; i < attributes.length; i++) {
                var attribute = attributes[i];
                var name = attribute.name;
                if (attribute.specified
                    && !INPUT_SPECIFIED_ATTRIBUTES.hasOwnProperty(name)
                ) {
                    lib.setAttribute(
                        main,
                        attribute.name,
                        attribute.value
                    );
                }
            }
            
            lib.insertBefore(main, initialMain);
            initialMain.parentNode.removeChild(initialMain);
            this.control.main = main;

            return initialMain;
        };

        var INPUT_PROPERTY_MAPPING = {
            value: { name: 'value' },
            name: { name: 'name' },
            maxlength: { name: 'maxLength', type: 'number' },
            required: { name: 'required', type: 'boolean' },
            pattern: { name: 'pattern' },
            min: { name: 'min', type: 'number' },
            max: { name: 'max', type: 'number' },
            autofocus: { name: 'autoFocus', type: 'boolean' },
            disabled: { name: 'disabled', type: 'boolean' },
            readonly: { name: 'readOnly', type: 'boolean' }
        };

        /**
         * 从输入元素上抽取属性
         *
         * @param {HTMLInputElement} 输入元素
         * @param {Object} [options] 已有的配置对象，有此参数则将抽取的属性覆盖上去
         * @return {Object}
         */
        helper.extractOptionsFromInput = function (input, options) {
            var result = {};
            u.each(
                INPUT_PROPERTY_MAPPING,
                function (config, attributeName) {
                    var specified = lib.hasAttribute(input, attributeName);
                    if (specified) {
                        var value = lib.getAttribute(input, attributeName);

                        switch (config.type) {
                            case 'boolean':
                                value = specified;
                                break;
                            case 'number':
                                value = parseInt(value, 10);
                                break;
                        }

                        result[config.name] = value;
                    }
                }
            );

            return u.defaults(options || {}, result);
        };

        return helper;
    }
);