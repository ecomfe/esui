/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 控件部件相关辅助方法
 * @author otakustay
 */
define(
    function (require) {
        /**
         * 获取控件用于生成css class的类型
         *
         * @param {Control} control 控件实例
         * @return {string}
         * @ignore
         */
        function getControlClassType(control) {
            var type = control.styleType || control.type;
            return type.toLowerCase();
        }

        /**
         * 将参数用`-`连接成字符串
         *
         * @param {string...} args 需要连接的串
         * @return {string}
         * @ignore
         */
        function joinByStrike() {
            return [].slice.call(arguments, 0).join('-');
        }

        var u = require('underscore');
        var lib = require('../lib');
        var ui = require('../main');

        /**
         * @override Helper
         */
        var helper = {};

        /**
         * 获取控件部件相关的class数组
         *
         * 如果不传递`part`参数，则生成如下：
         *
         * - `ui-ctrl`
         * - `ui-{styleType}`
         * - `skin-{skin}`
         * - `skin-{skin}-{styleType}`
         *
         * 如果有`part`参数，则生成如下：
         *
         * - `ui-{styleType}-{part}`
         * - `skin-{skin}-{styleType}-{part}`
         *
         * @param {string} [part] 部件名称
         * @return {string[]}
         */
        helper.getPartClasses = function (part) {
            if (part
                && this.partClassCache
                && this.partClassCache.hasOwnProperty(part)
            ) {
                // 得复制一份，不然外面拿到后往里`push`些东西就麻烦了
                return this.partClassCache[part].slice();
            }

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

                // 缓存起来
                if (!this.partClassCache) {
                    this.partClassCache = {};
                    // 还是得复制一份，不然这个返回回去就可能被修改了
                    this.partClassCache[part] = classes.slice();
                }
            }
            else {
                classes.push(joinByStrike(prefix, 'ctrl'));
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
         * 获取控件部件相关的class字符串，具体可参考{@link Helper#getPartClasses}方法
         *
         * @param {string} [part] 部件名称
         * @return {string}
         */
        helper.getPartClassName = function (part) {
            return this.getPartClasses(part).join(' ');
        };

        /**
         * 获取控件部件相关的主class字符串
         *
         * 如果不传递`part`参数，则生成如下：
         *
         * - `ui-{styleType}`
         *
         * 如果有`part`参数，则生成如下：
         *
         * - `ui-{styleType}-{part}`
         *
         * @param {string} [part] 部件名称
         * @return {string}
         */
        helper.getPrimaryClassName = function (part) {
            var type = getControlClassType(this.control);

            if (part) {
                return joinByStrike(ui.getConfig('uiClassPrefix'), type, part);
            }
            else {
                return joinByStrike(ui.getConfig('uiClassPrefix'), type);
            }
        };

        /**
         * 添加控件部件相关的class，具体可参考{@link Helper#getPartClasses}方法
         *
         * @param {string} [part] 部件名称
         * @param {HTMLElement | string} [element] 部件元素或部件名称，默认为主元素
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
         * 移除控件部件相关的class，具体可参考{@link Helper#getPartClasses}方法
         *
         * @param {string} [part] 部件名称
         * @param {HTMLElement | string} [element] 部件元素或部件名称，默认为主元素
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
         * 生成如下：
         *
         * - `ui-{styleType}-{state}`
         * - `state-{state}`
         * - `skin-{skin}-{state}`
         * - `skin-{skin}-{styleType}-{state}`
         *
         * @param {string} state 状态名称
         * @return {string[]}
         */
        helper.getStateClasses = function (state) {
            if (this.stateClassCache
                && this.stateClassCache.hasOwnProperty(state)
            ) {
                // 得复制一份，不然外面拿到后往里`push`些东西就麻烦了
                return this.stateClassCache[state].slice();
            }

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

            // 缓存起来
            if (!this.stateClassCache) {
                this.stateClassCache = {};
                // 还是得复制一份，不然这个返回回去就可能被修改了
                this.stateClassCache[state] = classes.slice();
            }

            return classes;
        };

        /**
         * 添加控件状态相关的class，具体可参考{@link Helper#getStateClasses}方法
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
         * 移除控件状态相关的class，具体可参考{@link Helper#getStateClasses}方法
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
         * 获取用于控件DOM元素的id
         *
         * @param {string} [part] 部件名称，如不提供则生成控件主元素的id
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
         * @param {string} [nodeName="div"] 使用的元素类型
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
         * @param {HTMLElement} [main] 用于替换的主元素，
         * 如不提供则使用当前控件实例的{@link Control#createMain}方法生成
         * @return {HTMLElement} 原来的主元素
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
                if (lib.hasAttribute(initialMain, name)
                    && !INPUT_SPECIFIED_ATTRIBUTES.hasOwnProperty(name)
                ) {
                    lib.setAttribute(main, name, attribute.value);
                }
            }

            lib.insertBefore(main, initialMain);
            initialMain.parentNode.removeChild(initialMain);
            this.control.main = main;

            return initialMain;
        };

        var INPUT_PROPERTY_MAPPING = {
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
         * 该方法按以下对应关系抽取属性，当元素上不存在对应的DOM属性时，不会添加该属性：
         *
         * - DOM元素的`value`对应控件的`value`属性
         * - DOM元素的`name`对应控件的`name`属性
         * - DOM元素的`maxlength`对应控件的`maxLength`属性，且转为`number`类型
         * - DOM元素的`required`对应控件的`required`属性，且转为`boolean`类型
         * - DOM元素的`pattern`对应控件的`pattern`属性
         * - DOM元素的`min`对应控件的`min`属性，且转为`number`类型
         * - DOM元素的`max`对应控件的`max`属性，且转为`number`类型
         * - DOM元素的`autofocus`对应控件的`autoFocus`属性，且转为`boolean`类型
         * - DOM元素的`disabled`对应控件的`disabled`属性，且转为`boolean`类型
         * - DOM元素的`readonly`对应控件的`readOnly`属性，且转为`boolean`类型
         *
         * @param {HTMLElement} input 输入元素
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

            // value要特殊处理一下，可能是通过innerHTML设置的，但是`<select>`元素在没有`value`属性时会自动选中第1个，
            // 这会影响诸如`selectedIndex`属性的效果，因此对`<select>`要特别地排除
            if (lib.hasAttribute(input, 'value')
                || (input.nodeName.toLowerCase() !== 'select' && input.value)
            ) {
                result.value = input.value;
            }

            return u.defaults(options || {}, result);
        };

        return helper;
    }
);
