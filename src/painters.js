/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 渲染器模块
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');

        /**
         * @class painters
         *
         * 渲染器模块，用于提供生成`painter`方法的工厂方法
         *
         * @singleton
         */
        var painters = {};

        /**
         * 生成一个将属性与控件状态关联的渲染器
         *
         * 当属性变为`true`的时候使用`addState`添加状态，反之使用`removeState`移除状态
         *
         * @param {string} name 指定负责的属性名，同时也是状态名称
         * @return {Object} 一个渲染器配置
         */
        painters.state = function (name) {
            return {
                name: name,
                paint: function (control, value) {
                    var method = value ? 'addState' : 'removeState';
                    control[method](this.name);
                }
            };
        };

        /**
         * 生成一个将控件属性与控件主元素元素的属性关联的渲染器
         *
         * 当控件属性变化时，将根据参数同步到主元素元素的属性上
         *
         *     @example
         *     // 将target属性与<a>元素关联
         *     var painter = painters.attribute('target');
         *
         *     // 可以选择关联到不同的DOM属性
         *     var painter = painters.attribute('link', 'href');
         *
         *     // 可以指定DOM属性的值
         *     var painter = painters.attribute('active', 'checked', true);
         *
         * @param {string} name 指定负责的属性名
         * @param {string} [attribute] 对应DOM属性的名称，默认与`name`相同
         * @param {Mixed} [value] 固定DOM属性的值，默认与更新的值相同
         * @return {Object} 一个渲染器配置
         */
        painters.attribute = function (name, attribute, value) {
            return {
                name: name,
                attribute: attribute || name, 
                value: value,
                paint: function (control, value) {
                    value = this.value == null ? value : this.value;
                    control.main.setAttribute(this.attribute, value);
                }
            };
        };

        // 这些属性不用加`px`
        var unitProperties = {
            width: true,
            height: true,
            top: true,
            right: true,
            bottom: true,
            left: true,
            fontSize: true,
            padding: true,
            paddingTop: true, 
            paddingRight: true,
            paddingBottom: true,
            paddingLeft: true,
            margin: true,
            marginTop: true,
            marginRight: true,
            marginBottom: true,
            marginLeft: true,
            borderWidth: true,
            borderTopWidth: true,
            borderRightWidth: true,
            borderBottomWidth: true,
            borderLeftWidth: true
        };

        /**
         * 生成一个将控件属性与控件主元素元素的样式关联的渲染器
         *
         * 当控件属性变化时，将根据参数同步到主元素元素的样式上
         *
         * @param {string} name 指定负责的属性名
         * @param {string} [property] 对应的样式属性名，默认与`name`相同
         * @return {Object} 一个渲染器配置
         */
        painters.style = function (name, property) {
            return {
                name: name,
                property: property || name,
                paint: function (control, value) {
                    if (value == null) {
                        return;
                    }
                    if (unitProperties.hasOwnProperty(this.property)) {
                        value = value === 0 ? '0' : value + 'px';
                    }
                    control.main.style[this.property] = value;
                }
            };
        };

        /**
         * 生成一个将控件属性与某个DOM元素的HTML内容关联的渲染器
         *
         * 当控件属性变化时，对应修改DOM元素的`innerHTML`
         *
         * @param {string} name 指定负责的属性名
         * @param {string | Function} [element] 指定DOM元素在当前控件下的部分名，
         * 可以提供函数作为参数，则函数返回需要更新的DOM元素
         * @param {Function} [generate] 指定生成HTML的函数，默认直接使用控件属性的值
         * @return {Object} 一个渲染器配置
         */
        painters.html = function (name, element, generate) {
            return {
                name: name,
                element: element || '',
                generate: generate,
                paint: function (control, value) {
                    var element = typeof this.element === 'function'
                        ? this.element(control)
                        : this.element
                            ? control.helper.getPart(this.element)
                            : control.main;
                    if (element) {
                        var html = typeof this.generate === 'function'
                            ? this.generate(control, value)
                            : value;
                        element.innerHTML = html || '';
                    }
                }
            };
        };

        /**
         * 生成一个将控件属性与某个DOM元素的HTML内容关联的渲染器
         *
         * 当控件属性变化时，对应修改DOM元素的文本内容
         *
         * 本方法与{@link painters#html}相似，区别在于会将内容进行一次HTML转义
         *
         * @param {string} name 指定负责的属性名
         * @param {string | Function} [element] 指定DOM元素在当前控件下的部分名，
         * 可以提供函数作为参数，则函数返回需要更新的DOM元素
         * @param {Function} [generate] 指定生成HTML的函数，默认直接使用控件属性的值，
         * 该函数返回原始的HTML，不需要做额外的转义工作
         * @return {Object} 一个渲染器配置
         */
        painters.text = function (name, element, generate) {
            return {
                name: name,
                element: element || '',
                generate: generate,
                paint: function (control, value) {
                    var element = typeof this.element === 'function'
                        ? this.element(control)
                        : this.element
                            ? control.helper.getPart(this.element)
                            : control.main;
                    if (element) {
                        var html = typeof this.generate === 'function'
                            ? this.generate(control, value)
                            : value;
                        element.innerHTML = u.escape(html || '');
                    }
                }
            };
        };


        /**
         * 生成一个将控件属性的变化代理到指定成员的指定方法上
         *
         * @param {string} name 指定负责的属性名
         * @param {string} member 指定成员名
         * @param {string} method 指定调用的方法名称
         * @return {Object} 一个渲染器配置
         */
        painters.delegate = function (name, member, method) {
            return {
                name: name,
                member: this.member,
                method: this.method,
                paint: function (control, value) {
                    control[this.member][this.method](value);
                }
            };
        };

        /**
         * 通过提供一系列`painter`对象创建`repaint`方法
         *
         * 本方法接受以下2类作为“渲染器”：
         *
         * - 直接的函数对象
         * - 一个`painter`对象
         *
         * 当一个直接的函数对象作为“渲染器”时，会将`changes`和`changesIndex`两个参数
         * 传递给该函数，函数具有最大的灵活度来自由操作控件
         *
         * 一个`painter`对象必须包含以下属性：
         *
         * - `{string | string[]} name`：指定这个`painter`对应的属性或属性集合
         * - `{Function} paint`：指定渲染的函数
         *
         * 一个`painter`在执行时，其`paint`函数将接受以下参数：
         *
         * - `{Control} control`：当前的控件实例
         * - `{Mixed} args...`：根据`name`配置指定的属性，依次将属性的最新值作为参数
         *
         * @param {Object... | Function...} args `painter`对象
         * @return {Function} `repaint`方法的实现
         */
        painters.createRepaint = function () {
            var painters = [].concat.apply([], [].slice.call(arguments));

            return function (changes, changesIndex) {
                // 临时索引，不能直接修改`changesIndex`，会导致子类的逻辑错误
                var index = lib.extend({}, changesIndex);
                for (var i = 0; i < painters.length; i++) {
                    var painter = painters[i];

                    // 如果是一个函数，就认为这个函数处理所有的变化，直接调用一下
                    if (typeof painter === 'function') {
                        painter.apply(this, arguments);
                        continue;
                    }

                    // 其它情况下，走的是`painter`的自动化属性->函数映射机制
                    var propertyNames = [].concat(painter.name);

                    // 以下2种情况下要调用：
                    // 
                    // - 第一次重会（没有`changes`）
                    // - `changesIndex`有任何一个负责的属性的变化
                    var shouldPaint = !changes;
                    if (!shouldPaint) {
                        for (var j = 0; j < propertyNames.length; j++) {
                            var name = propertyNames[j];
                            if (changesIndex.hasOwnProperty(name)) {
                                shouldPaint = true;
                                break;
                            }
                        }
                    }
                    if (!shouldPaint) {
                        continue;
                    }

                    // 收集所有属性的值
                    var properties = [this];
                    for (var j = 0; j < propertyNames.length; j++) {
                        var name = propertyNames[j];
                        properties.push(this[name]);
                        // 从索引中删除，为了后续构建`unpainted`数组
                        delete index[name]; 
                    }
                    // 绘制
                    try {
                        painter.paint.apply(painter, properties);
                    }
                    catch (ex) {
                        var paintingPropertyNames = 
                            '"' + propertyNames.join('", "') + '"';
                        var error = new Error(
                            'Failed to paint [' + paintingPropertyNames + '] '
                            + 'for control "' + (this.id || 'anonymous')+ '" '
                            + 'of type ' + this.type + ' '
                            + 'because: ' + ex.message
                        );
                        error.actualError = error;
                        throw error;
                    }

                }

                // 构建出未渲染的属性集合
                var unpainted = [];
                for (var key in index) {
                    if (index.hasOwnProperty(key)) {
                        unpainted.push(index[key]);
                    }
                }

                return unpainted;
            };
        };

        return painters;
    }
);
