/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 主模块
 * @author erik
 */

define(
    function (require) {
        var lib = require('./lib');
        var main = {};

        var ViewContext = require('./ViewContext');
        var defaultViewContext = new ViewContext();

        /**D
         * 获取默认的控件视图环境
         * 
         * @return {ViewContext}
         */
        main.getViewContext = function () {
            return defaultViewContext;
        };

        /**
         * 控件库配置数据
         * 
         * @inner
         * @type {Object}
         */
        var config = {
            uiPrefix        : 'data-ui',
            extensionPrefix : 'data-ui-extension',
            uiClassPrefix   : 'ui',
            skinClassPrefix : 'skin'
        };

        /**
         * 配置控件库
         * 
         * @param {Object} info 控件库配置信息对象
         */
        main.config = function (info) {
            lib.extend(config, info);
        };

        /**
         * 获取配置项
         * 
         * @param {string} name 配置项名称
         */
        main.getConfig = function (name) {
            return config[name];
        };

        /**
         * 将"name:value[;name:value]"的属性值解析成Object
         * 
         * @param {string} source 属性值源字符串
         * @param {function=} 替换值的处理函数
         * @return {Object}
         */
        main.parseAttribute = function (source, valueReplacer) {
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
        };

        /**
         * 寻找dom元素所对应的控件
         * 
         * @public
         * @param {HTMLElement} dom dom元素
         * @return {esui.Control}
         */
        main.getControlByDom = function ( dom ) {
            if ( !dom ) {
                return;
            }
            var controlId;
            if ( ( controlId = dom.getAttribute( 'data-control' ) ) ) {
                return this.get( controlId );
            }else{
                var controlIdStart = dom.id.indexOf( 'ctrl-' );
                if( controlIdStart == 0 ){
                    var idParts = dom.id.split('-');
                    return idParts.length > 1 ?  this.get( idParts[1] ) : null ;
                }
            }
            return null;
        };

        /**
         * 注册类。用于控件类、规则类或扩展类注册
         * 
         * @inner
         * @param {Function} classFunc 类Function
         * @param {Object} container 类容器
         */
        function registerClass(classFunc, container) {
            if (typeof classFunc == 'function') {
                var type = classFunc.prototype.type;
                if (type in container) {
                    throw new Error(type + ' is exists!');
                }

                container[type] = classFunc;
            }
        }

        /**
         * 创建类实例。用于控件类、规则类或扩展类的实例创建
         * 
         * @inner
         * @param {string} type 类型
         * @param {Object} options 初始化参数
         * @param {Object} container 类容器
         */
        function createInstance(type, options, container) {
            var Constructor = container[type];
            if (Constructor) {
                delete options.type;
                return new Constructor(options);
            }

            return null;
        }

        /**
         * 控件类容器
         * 
         * @inner
         * @type {Object}
         */
        var controlClasses = {};

        /**
         * 注册控件类。
         * 通过类的prototype.type识别控件类型信息。
         * 
         * @param {Function} controlClass 控件类
         */
        main.register = function (controlClass) {
            registerClass(controlClass, controlClasses);
        };

        /**
         * 创建控件
         * 
         * @param {string} type 控件类型
         * @param {Object} options 初始化参数
         * @return {Control}
         */
        main.create = function (type, options) {
            return createInstance(type, options, controlClasses);
        };

        /**
         * 获取控件
         * 
         * @param {string} id 控件id
         * @return {Control}
         */
        main.get = function (id) {
            return defaultViewContext.get(id);
        };

        /**
         * 从容器DOM元素批量初始化内部的控件渲染
         * 
         * @param {HTMLElement=} wrap 容器DOM元素，默认document.body
         * @param {Object=} options init参数
         * @param {Object=} options.viewContext 视图环境
         * @param {Object=} options.properties 属性集合，通过id映射
         * @param {Object=} options.valueReplacer 属性值替换函数
         * @return {Array} 初始化的控件对象集合
         */
        main.init = function (wrap, options) {
            wrap = wrap || document.body;
            options = options || {};
            
            var valueReplacer = options.valueReplacer || function (value) {
                return value;
            };

            /**
             * 将字符串数组join成驼峰形式
             * 
             * @inner
             * @param {Array.<string>} source 源字符串数组
             * @return {string}
             */
            function joinCamelCase(source) {
                function replacer(c) {
                    return c.toUpperCase();
                }

                for (var i = 1, len = source.length; i < len; i++) {
                    source[i] = source[i].replace(/^[a-z]/, replacer);
                }

                return source.join('');
            }

            /**
             * 不覆盖目标对象成员的extend
             * 
             * @inner
             * @param {Object} target 目标对象
             * @param {Object} source 源对象
             */
            function noOverrideExtend(target, source) {
                for (var key in source) {
                    if (!(key in target)) {
                        target[key] = source[key];
                    }
                }
            }

            /**
             * 将标签解析的值附加到option对象上
             * 
             * @inner
             * @param {Object} optionObject option对象
             * @param {Array.<string>} terms 经过切分的标签名解析结果
             * @param {string} value 属性值
             */
            function extendToOption(optionObject, terms, value) {
                if (terms.length === 0) {
                    noOverrideExtend(
                        optionObject, 
                        main.parseAttribute(value, valueReplacer)
                    );
                }
                else {
                    optionObject[joinCamelCase(terms)] = valueReplacer(value);
                }
            }

            // 把dom元素存储到临时数组中
            // 控件渲染的过程会导致Collection的改变
            var rawElements = wrap.getElementsByTagName('*');
            var elements = [];
            for (var i = 0, len = rawElements.length; i < len; i++) {
                elements[i] = rawElements[i];
            }

            var uiPrefix = main.getConfig('uiPrefix');
            var extPrefix = main.getConfig('extensionPrefix');
            var uiPrefixLen = uiPrefix.length;
            var extPrefixLen = extPrefix.length;
            var properties = options.properties || {};
            var controls = [];
            for (var i = 0, len = elements.length; i < len; i++) {
                var element = elements[i];
                var attributes = element.attributes;
                var controlOptions = {};
                var extensionOptions = {};

                // 解析attribute中的参数
                for (var j = 0, attrLen = attributes.length; j < attrLen; j++) {
                    var attribute = attributes[j];
                    var name = attribute.name;
                    var value = attribute.value;

                    if (name.indexOf(extPrefix) === 0) {
                        // 解析extension的key
                        var terms = name.slice(extPrefixLen + 1).split('-');
                        var extKey = terms[0];
                        terms.shift();

                        // 初始化该key的option对象
                        var extOption = extensionOptions[extKey];
                        if (!extOption) {
                            extOption = extensionOptions[extKey] = {};
                        }

                        extendToOption(extOption, terms, value);
                    }
                    else if (name.indexOf(uiPrefix) === 0) {
                        var terms = name.length == uiPrefixLen
                            ? []
                            : name.slice(uiPrefixLen + 1).split('-');
                        extendToOption(controlOptions, terms, value);
                    }
                }

                // 根据选项创建控件
                var type = controlOptions.type;
                if (type) {
                    // 从用户传入的properties中merge控件初始化属性选项
                    var controlId = controlOptions.id;
                    var customOptions = controlId
                        ? properties[controlId]
                        : {};
                    for (var key in customOptions) {
                        controlOptions[key] = valueReplacer(customOptions[key]);
                    }

                    // 创建控件的插件
                    var extensions = [];
                    controlOptions.extensions = extensions;
                    for (var key in extensionOptions) {
                        var extOption = extensionOptions[key];
                        var extension = main.createExtension(
                            extOption.type, 
                            extOption
                        );
                        extension && extensions.push(extension);
                    }

                    // 绑定视图环境和控件主元素
                    controlOptions.viewContext = options.viewContext;
                    controlOptions.main = element;

                    // 创建控件
                    var control = main.create(type, controlOptions);
                    if (control) {
                        controls.push(control);
                        control.render();
                    }
                }
            }

            return controls;
        };

        /**
         * 扩展类容器
         * 
         * @inner
         * @type {Object}
         */
        var extensionClasses = {};

        /**
         * 注册扩展类。
         * 通过类的prototype.type识别扩展类型信息。
         * 
         * @param {Function} extensionClass 扩展类
         */
        main.registerExtension = function (extensionClass) {
            registerClass(extensionClass, extensionClasses);
        };

        /**
         * 创建扩展
         * 
         * @param {string} type 扩展类型
         * @param {Object} options 初始化参数
         * @return {Extension}
         */
        main.createExtension = function (type, options) {
            return createInstance(type, options, extensionClasses);
        };

        /**
         * 全局扩展选项容器
         * 
         * @inner
         * @type {Object}
         */
        var globalExtensionOptions = {};

        /**
         * 绑定全局扩展
         * 
         * @param {string} type 扩展类型
         * @param {Object} options 扩展初始化参数
         */
        main.attachExtension = function (type, options) {
            globalExtensionOptions[type] = options;
        };

        /**
         * 创建全局扩展对象
         * 
         * @return {Array.<Extension>}
         */
        main.createGlobalExtensions = function () {
            var options = globalExtensionOptions;
            var extensions = [];
            for (var i = 0, len = options.length; i < len; i++) {
                var option = options[i];
                var type = option.type;
                var extension;

                if (type) {
                    extension = main.create(type, option);
                }
                extension && extensions.push(extension);
            }

            return extensions;
        };

        /**
         * 验证规则类容器
         * 
         * @inner
         * @type {Object}
         */
        var ruleClasses = {};

        /**
         * 注册控件验证规则类。
         * 通过类的prototype.type识别控件类型信息。
         * 
         * @param {Function} ruleClass 验证规则类
         */
        main.registerRule = function (ruleClass) {
            registerClass(ruleClass, ruleClasses);
        };

        /**
         * 创建验证规则
         * 
         * @param {Control} control 控件实例
         * @return {Array.<validate/Rule>}
         */
        main.createRulesByControl = function (control) {
            var rules = [];
            for (var type in ruleClasses) {
                if (control.get(type)) {
                    rules.push(new ruleClasses[type]());
                }
            }

            return rules;
        };

        return main;
    }
);
