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
        var defaultViewContext = new ViewContext('default');

        /**
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
            uiPrefix: 'data-ui',
            extensionPrefix: 'data-ui-extension',
            instanceAttr: 'data-ctrl-id',
            viewContextAttr: 'data-ctrl-view-context',
            uiClassPrefix: 'ui',
            skinClassPrefix: 'skin',
            stateClassPrefix: 'state'
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
            // 为了让key和value中有`:`或`;`这类分隔符时能正常工作，不采用正则
            // 
            // 分析的原则是：
            // 
            // 1. 找到第1个冒号，取前面部分为key
            // 2. 找下个早号前的最后一个分号，取前面部分为value
            // 3. 如果字符串没结束，回到第1步
            var result = {}; // 保存结果
            var lastStop = 0; // 上次找完时停下的位置，分隔字符串用
            var cursor = 0; // 当前检索到的字符
            // 为了保证只用一个`source`串就搞定，下面会涉及到很多的游标，
            // 简单的方法是每次截完一段后把`soruce`截过的部分去掉，
            // 不过这么做会频繁分配字符串对象，所以优化了一下保证`source`不变
            while (cursor < source.length) {
                // 找key，找到第1个冒号
                while (cursor < source.length
                    && source.charAt(cursor) !== ':'
                ) {
                    cursor++;
                }
                // 如果找到尾也没找到冒号，那就是最后有一段非键值对的字符串，丢掉
                if (cursor >= source.length) {
                    break;
                }
                // 把key截出来
                var key = lib.trim(source.slice(lastStop, cursor));
                // 移到冒号后面一个字符
                cursor++;
                // 下次切分就从这个字符开始了
                lastStop = cursor;
                // 找value，要找最后一个分号，这里就需要前溯了，先找到第1个分号
                while (cursor < source.length
                    && source.charAt(cursor) !== ';'
                ) {
                    cursor++;
                }
                // 然后做前溯一直到下一个冒号
                var lookAheadIndex = cursor + 1;
                while (lookAheadIndex < source.length) {
                    var ch = source.charAt(lookAheadIndex);
                    // 如果在中途还发现有分号，把游标移过来
                    if (ch === ';') {
                        cursor = lookAheadIndex;
                    }
                    // 如果发现了冒号，则上次的游标就是最后一个分号了
                    if (ch === ':') {
                        break;
                    }
                    lookAheadIndex++;
                }
                // 把value截出来，这里没有和key一样判断是否已经跑到尾，
                // 是因为我们允许最后一个键值对没有分号结束，
                // 但是会遇上`key:`这样的串，即只有键没有值，
                // 这时我们就认为值是个空字符串了
                var value = lib.trim(source.slice(lastStop, cursor));
                // 加入到结果中
                result[key] = valueReplacer ? valueReplacer(value) : value;
                // 再往前进一格，开始下一次查找
                cursor++;
                lastStop = cursor;
            }

            return result;
        };

        /**
         * 寻找dom元素所对应的控件
         * 
         * @public
         * @param {HTMLElement} dom dom元素
         * @return {Control}
         */
        main.getControlByDOM = function ( dom ) {
            if ( !dom ) {
                return null;
            }

            var getConf = main.getConfig;

            var controlId = dom.getAttribute( getConf('instanceAttr') );
            var viewContextId = dom.getAttribute( getConf('viewContextAttr') );
            var viewContext;

            if (controlId 
                && viewContextId 
                && (viewContext = ViewContext.get( viewContextId ))
            ) {
                return viewContext.get(controlId);
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
                if (rawElements[i].nodeType === 1) {
                    elements.push(rawElements[i]);
                }
            }

            var uiPrefix = main.getConfig('uiPrefix');
            var extPrefix = main.getConfig('extensionPrefix');
            var uiPrefixLen = uiPrefix.length;
            var extPrefixLen = extPrefix.length;
            var properties = options.properties || {};
            var controls = [];
            for (var i = 0, len = elements.length; i < len; i++) {
                var element = elements[i];

                // 有时候，一个控件会自己把`main.innerHTML`生成子控件，比如`Panel`，
                // 但这边有缓存这些子元素，可能又会再生成一次，所以要去掉
                if (element.getAttribute(config.instanceAttr)) {
                    continue;
                }

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
                    var extensions = controlOptions.extensions || [];
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
                    // 容器类控件会需要渲染自己的`innerHTML`，
                    // 这种渲染使用`initChildren`，再调用`main.init`，
                    // 因此需要把此处`main.init`的参数交给控件，方便再带回来，
                    // 以便`properties`、`valueReplacer`之类的能保留
                    controlOptions.renderOptions = options;
                    controlOptions.main = element;

                    // 创建控件
                    var control = main.create(type, controlOptions);
                    if (control) {
                        controls.push(control);
                        if (options.parent) {
                            options.parent.addChild(control);
                        }
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
        var ruleClasses = [];

        /**
         * 注册控件验证规则类。
         * 通过类的prototype.type识别控件类型信息。
         * 
         * @param {Function} ruleClass 验证规则类
         * @param {number} priority 优先级，越小的优先级越高
         */
        main.registerRule = function (ruleClass, priority) {
            // 多个Rule共享一个属性似乎也没问题
            ruleClasses.push({ type: ruleClass, priority: priority });
            // 能有几个规则，这里就不优化为插入排序了
            ruleClasses.sort(
                function (x, y) { return x.priority - y.priority; });
        };

        /**
         * 创建验证规则
         * 
         * @param {Control} control 控件实例
         * @return {Array.<validate/Rule>}
         */
        main.createRulesByControl = function (control) {
            var rules = [];
            for (var i = 0; i < ruleClasses.length; i++) {
                var RuleClass = ruleClasses[i].type;
                if (control.get(RuleClass.prototype.type) != null) {
                    rules.push(new RuleClass());
                }
            }

            return rules;
        };

        return main;
    }
);
