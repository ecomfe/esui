/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 主模块
 * @author erik
 */

define(
    function (require) {
        var lib = require('./lib');
        var u = require('underscore');

        /**
         * 主模块
         *
         * @class main
         * @alias ui
         * @singleton
         */
        var main = {};

        /**
         * 版本号常量
         *
         * @type {string}
         * @readonly
         */
        main.version = '3.2.0-beta.6';

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
         * @type {Object}
         * @ignore
         */
        var config = {
            uiPrefix: 'data-ui',
            extensionPrefix: 'data-ui-extension',
            customElementPrefix: 'esui',
            instanceAttr: 'data-ctrl-id',
            viewContextAttr: 'data-ctrl-view-context',
            uiClassPrefix: 'ui',
            skinClassPrefix: 'skin',
            stateClassPrefix: 'state'
        };

        /**
         * 配置控件库
         *
         * 可用的配置有：
         *
         * - `{string} uiPrefix="data-ui"`：HTML中用于表示控件属性的DOM属性前缀
         * - `{string} extensionPrefix="data-ui-extension"`：用于表示扩展属性的前缀
         * - `{string} instanceAttr="data-ctrl-id"`：
         * 标识控件id的DOM属性名，配合`viewContextAttr`可根据DOM元素获取对应的控件
         * - `{string} viewContextAttr="data-ctrl-view-context"`：
         * 标识视图上下文id的DOM属性名，配合`instanceAttr`可根据DOM元素获取对应的控件
         * - `{string} uiClassPrefix="ui"`：控件生成DOM元素的class的前缀
         * - `{string} skinClassPrefix="skin"`：控件生成皮肤相关DOM元素class的前缀
         * - `{string} stateClassPrefix="state"`：控件生成状态相关DOM元素class的前缀
         *
         * @param {Object} info 控件库配置信息对象
         */
        main.config = function (info) {
            u.extend(config, info);
        };

        /**
         * 获取配置项
         *
         * 具体可用配置参考{@link main#config}方法的说明
         *
         * @param {string} name 配置项名称
         * @return {Mixed} 配置项的值
         */
        main.getConfig = function (name) {
            return config[name];
        };

        /**
         * 将`name:value[;name:value]`的属性值解析成对象
         *
         * @param {string} source 属性值源字符串
         * @param {Function} valueReplacer 替换值的处理函数，每个值都将经过此函数
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
                while (cursor < source.length && source.charAt(cursor) !== ':') {
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
                result[key] = valueReplacer ? valueReplacer(value) : value;

                // 再往前进一格，开始下一次查找
                cursor++;
                lastStop = cursor;
            }

            return result;
        };

        /**
         * 寻找DOM元素所对应的控件
         *
         * @param {HTMLElement} dom DOM元素
         * @return {Control | null} `dom`对应的控件实例，
         * 如果`dom`不存在或不对应任何控件则返回`null`
         */
        main.getControlByDOM = function (dom) {
            if (!dom) {
                return null;
            }

            var getConf = main.getConfig;

            var controlId = dom.getAttribute(getConf('instanceAttr'));
            var viewContextId = dom.getAttribute(getConf('viewContextAttr'));
            var viewContext;

            if (controlId
                && viewContextId
                && (viewContext = ViewContext.get(viewContextId))
                ) {
                return viewContext.get(controlId);
            }
            return null;
        };

        /**
         * 注册类。用于控件类、规则类或扩展类注册
         *
         * @param {Function} classFunc 类Function
         * @param {Object} container 类容器
         * @ignore
         */
        function registerClass(classFunc, container) {
            if (typeof classFunc === 'function') {
                var type = classFunc.prototype.type;
                if (type in container) {
                    throw new Error(type + ' already exists!');
                }

                container[type] = classFunc;
            }
        }

        /**
         * 创建类实例。用于控件类、规则类或扩展类的实例创建
         *
         * @param {string} type 类型
         * @param {Object} options 初始化参数
         * @param {Object} container 类容器
         * @ignore
         * @return {Object} Control Instance
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
         * @type {Object}
         * @ignore
         */
        var controlClasses = {};

        /**
         * 注册控件类
         *
         * 该方法通过类的`prototype.type`识别控件类型信息。
         *
         * @param {Function} controlClass 控件类
         * @throws
         * 已经有相同`prototype.type`的控件类存在，不能重复注册同类型控件
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
         * @param {string} id 控件的id
         * @return {Control | null}
         */
        main.get = function (id) {
            return defaultViewContext.get(id);
        };

        /**
         * 根据id获取控件实例，如无相关实例则返回{@link SafeWrapper}
         *
         * @param {string} id 控件id
         * @return {Control} 根据id获取的控件
         */
        main.getSafely = function (id) {
            return defaultViewContext.getSafely(id);
        };

        var ControlCollection = require('./ControlCollection');

        /**
         * 创建控件包裹，返回一个{@link ControlCollection}对象
         *
         * @param {...Control} arguments 需要包裹的控件
         * @return {ControlCollection}
         */
        main.wrap = function () {
            var collection = new ControlCollection();

            for (var i = 0; i < arguments.length; i++) {
                collection.add(arguments[i]);
            }

            return collection;
        };

        /**
         * 对html属性上声明数字和boolean的参数进行类型转换。
         *
         * 类型转化如下：
         * 缺省的value parser这里会处理几种特殊情况：
         *     1. 字符串true,false --> bool
         *     2. 全部为数字的字符串 --> number
         *     3. 使用'false' / 'number'这一类不进行类型转换，但是去掉'(trim)
         *
         * @param {string} value 模板上声明的值
         * @return {*} 转换后的值
         */
        main.defaultValueReplacer = function (value) {
            var coreNumber = /^[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)$/;
            if (value === 'true') {
                value = true;
            }
            else if (value === 'false') {
                value = false;
            }
            else if (coreNumber.test(value)) {
                value = +value;
            }
            else if (/^['"].+?['"]$/.test(value)) {
                value = value.slice(1, -1);
            }
            return value;
        };

        /**
         * 从容器DOM元素批量初始化内部的控件渲染
         *
         * @param {HTMLElement} [wrap=document.body] 容器DOM元素，默认
         * @param {Object} [options] init参数
         * @param {Object} [options.viewContext] 视图环境
         * @param {Object} [options.properties] 属性集合，通过id映射
         * @param {Function} [options.valueReplacer] 属性值替换函数
         * @param {Function} [options.onBuildOptions] 初始化一个控件的参数收集完成时调用，接收`options`，返回`options`对象
         * @param {Function} [options.onCreateControl] 控件创建完毕时调用，接收控件实例和`options`
         * @return {Control[]} 初始化的控件对象集合
         */
        main.init = function (wrap, options) {
            wrap = wrap || document.body;
            options = options || {};
            var controls = [];

            var valueReplacer = options.valueReplacer || function (value) {
                return value;
            };

            /**
             * 将esui-xx声明的组件找出来并返回type
             *
             * @param {HTMLElement} element 容器DOM元素
             * @return {string | null}
             */
            function parseTypeFormCustomTag(element) {
                var customElementPrefix = main.getConfig('customElementPrefix');
                var nodeName = element.nodeName.toLowerCase();
                var esuiPrefixIndex = nodeName.indexOf(customElementPrefix);
                if (esuiPrefixIndex === 0) {
                    var typeFromCustomElement;
                    /* jshint ignore:start */
                    typeFromCustomElement = nodeName.replace(
                        /-(\S)/g,
                        function (match, ch) {
                            return ch.toUpperCase();
                        }
                    );
                    /* jshint ignore:end */
                    typeFromCustomElement = typeFromCustomElement.slice(customElementPrefix.length);
                    return typeFromCustomElement;
                }
                return;
            }

            /**
             * 确定该元素是否是esui-xx,data-ui和data-ui-type声明的esui组件
             *
             * @param {HTMLElement} element 容器DOM元素
             * @return {boolean}
             */
            function isUIControl(element) {
                var uiPrefix = main.getConfig('uiPrefix');
                return element.hasAttribute(uiPrefix + '-type')
                    || element.hasAttribute(uiPrefix)
                    || element.nodeName.toLowerCase().indexOf(main.getConfig('customElementPrefix')) === 0;
            }

            /**
             * 初始化容器中的所有esui组件
             *
             * @param {HTMLElement} ele wrap元素
             * @param {Object} options 初始化参数
             */
            function initControlsFromDom(ele, options) {
                if (ele.nodeType !== 1) {
                    return;
                }

                // 找到esui组件就跳出循环
                if (isUIControl(ele)
                    && !ele.hasAttribute(config.instanceAttr)
                    ) {
                    initUIControl(ele, options);
                    return;
                }

                var eleChildren = ele.children;
                if (eleChildren) {
                    // 有些组件会改变当前父元素下的dom结构
                    // 例如Table会在元素前插入一行div来做宽度占位符
                    // ActionDialog会将之前dom移除
                    for (var i = 0, l = eleChildren.length; i < l; i++) {
                        var childEle = eleChildren[i];
                        if (isUIControl(childEle)
                            && (!childEle.hasAttribute(config.instanceAttr) || !main.getControlByDOM(childEle))
                            ) {
                            initUIControl(childEle, options);
                        }
                        else {
                            initControlsFromDom(childEle, options);
                        }
                    }
                }
            }

            /**
             * 将字符串数组join成驼峰形式
             *
             * @param {string[]} source 源字符串数组
             * @return {string}
             * @ignore
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
             * @param {Object} target 目标对象
             * @param {Object} source 源对象
             * @ignore
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
             * @param {Object} optionObject option对象
             * @param {string[]} terms 经过切分的标签名解析结果
             * @param {string} value 属性值
             * @ignore
             */
            function extendToOption(optionObject, terms, value) {
                if (terms.length === 0) {
                    noOverrideExtend(
                        optionObject,
                        main.parseAttribute(value, valueReplacer));
                }
                else {
                    optionObject[joinCamelCase(terms)] = valueReplacer(value);
                }
            }

            /**
             * 初始化所有的UI组件
             *
             * @param {HTMLElement} [element=document.body] 组件容器DOM元素
             * @param {Object} [options] init参数
             * @param {Object} [options.viewContext] 视图环境
             * @param {Object} [options.properties] 属性集合，通过id映射
             */
            function initUIControl(element, options) {
                var uiPrefix = main.getConfig('uiPrefix');
                var extPrefix = main.getConfig('extensionPrefix');

                var uiPrefixLen = uiPrefix.length;
                var extPrefixLen = extPrefix.length;
                var properties = options.properties || {};

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
                        var extensionTerms = name.slice(extPrefixLen + 1).split('-');
                        var extKey = extensionTerms[0];
                        extensionTerms.shift();

                        // 初始化该key的option对象
                        var extOption = extensionOptions[extKey];
                        if (!extOption) {
                            extOption = extensionOptions[extKey] = {};
                        }

                        extendToOption(extOption, terms, value);
                    }
                    else if (name.indexOf(uiPrefix) === 0) {
                        var terms = name.length === uiPrefixLen
                             ? []
                             : name.slice(uiPrefixLen + 1).split('-');
                        extendToOption(controlOptions, terms, value);
                    }
                }

                // 从用户传入的properties中merge控件初始化属性选项
                var controlId = controlOptions.id;
                var customOptions = controlId ? properties[controlId] : {};
                for (var key in customOptions) {
                    if (customOptions.hasOwnProperty(key)) {
                        controlOptions[key] = valueReplacer(customOptions[key]);
                    }
                }

                // 创建控件的扩展
                var extensions = controlOptions.extensions || [];
                var createExtension = function (options) {
                    return main.createExtension(options.type, options);
                };
                var directiveExtensions = u.chain(extensionOptions).values().map(createExtension).compact().value();
                controlOptions.extensions = extensions.concat(directiveExtensions);

                // 绑定视图环境和控件主元素
                controlOptions.viewContext = options.viewContext;
                // 容器类控件会需要渲染自己的`innerHTML`，
                // 这种渲染使用`initChildren`，再调用`main.init`，
                // 因此需要把此处`main.init`的参数交给控件，方便再带回来，
                // 以便`properties`、`valueReplacer`之类的能保留
                controlOptions.renderOptions = options;
                controlOptions.main = element;

                // 创建控件
                var type = controlOptions.type;
                if (!type) {
                    type = parseTypeFormCustomTag(element);
                    controlOptions.type = type;
                }
                if (options.onBuildOptions) {
                    controlOptions = options.onBuildOptions(controlOptions);
                }
                var control = main.create(type, controlOptions);

                if (control) {
                    controls.push(control);
                    if (options.parent) {
                        options.parent.addChild(control);
                    }
                }

                if (options.onCreateControl) {
                    control = options.onCreateControl(control, options);
                }
            }

            initControlsFromDom(wrap, options);

            u.chain(controls).compact().invoke('render');
            return controls;
        };

        /**
         * 扩展类容器
         *
         * @type {Object}
         * @ignore
         */
        var extensionClasses = {};

        /**
         * 注册扩展类。
         *
         * 该方法通过类的`prototype.type`识别扩展类型信息
         *
         * @param {Function} extensionClass 扩展类
         * @throws
         * 已经有相同`prototype.type`的扩展类存在，不能重复注册同类型扩展
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
         * @type {Object}
         * @ignore
         */
        var globalExtensionOptions = {};

        /**
         * 绑定全局扩展
         *
         * 通过此方法绑定的扩展，会对所有的控件实例生效
         *
         * 每一次全局扩展生成实例时，均会复制`options`对象，而不会直接使用引用
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
         * @return {Extension[]}
         */
        main.createGlobalExtensions = function () {
            var extensions = [];
            for (var type in globalExtensionOptions) {
                if (globalExtensionOptions.hasOwnProperty(type)) {
                    var extension = main.createExtension(type, globalExtensionOptions[type]);
                    extension && extensions.push(extension);
                }
            }

            return extensions;
        };

        /**
         * 验证规则类容器
         *
         * @type {Object}
         * @ignore
         */
        var ruleClasses = [];

        /**
         * 注册控件验证规则类
         *
         * 该方法通过类的`prototype.type`识别验证规则类型信息
         *
         * @param {Function} ruleClass 验证规则类
         * @param {number} priority 优先级，越小的优先级越高
         * @throws
         * 已经有相同`prototype.type`的验证规则类存在，不能重复注册同类型验证规则
         */
        main.registerRule = function (ruleClass, priority) {
            // 多个Rule共享一个属性似乎也没问题
            ruleClasses.push({type: ruleClass, priority: priority});
            // 能有几个规则，这里就不优化为插入排序了
            ruleClasses.sort(
                function (x, y) {
                    return x.priority - y.priority;
                }
            );
        };

        /**
         * 创建控件实例需要的验证规则
         *
         * @param {Control} control 控件实例
         * @return {validator.Rule[]} 验证规则数组
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
