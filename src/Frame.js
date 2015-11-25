/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Frame控件
 * @author otakustay
 */
define(
    function (require) {
        var Control = require('./Control');
        var eoo = require('eoo');
        var painters = require('./painters');
        var esui = require('./main');
        var u = require('underscore');

        /**
         * Frame控件
         *
         * @extends Control
         * @param {Object} [options] 初始化参数
         * @constructor
         */
        var Frame = eoo.create(
            Control,
            {
                /**
                 * 控件类型，始终为`"Frame"`
                 *
                 * @type {string}
                 * @readonly
                 * @override
                 */
                type: 'Frame',

                /**
                 * 创建主元素
                 *
                 * @return {HTMLElement}
                 * @protected
                 * @override
                 */
                createMain: function () {
                    return document.createElement('iframe');
                },

                /**
                 * 初始化参数
                 *
                 * @param {Object} [options] 构造函数传入的参数
                 * @protected
                 * @override
                 */
                initOptions: function (options) {
                    var properties = {};
                    u.extend(properties, options);

                    if (!properties.src) {
                        properties.src = this.main.src;
                    }

                    this.setProperties(properties);
                },

                /**
                 * 初始化DOM结构
                 *
                 * @protected
                 * @override
                 */
                initStructure: function () {
                    this.main.frameborder = 'no';
                    this.main.marginHeight = '0';
                    this.main.marginWidth = '0';
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                initEvents: function () {
                    var controlHelper = this.helper;
                    controlHelper.delegateDOMEvent(this.main, 'load');
                    controlHelper.addDOMEvent(
                        this.main,
                        'message',
                        function (e) {
                            var event = {
                                origin: e.origin,
                                data: e.data
                            };
                            this.fire('message', event);
                        }
                    );
                },

                /**
                 * 渲染自身
                 *
                 * @override
                 * @protected
                 */
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    {
                        name: 'src',
                        paint: function (frame, src) {
                            // 避免重复加载`<iframe>`的地址，第一次渲染时没有比对功能
                            if (frame.main.src === src) {
                                return;
                            }

                            frame.main.src = src;
                        }
                    },
                    painters.style('height'),
                    painters.style('width')
                ),

                /**
                 * load完毕获取content的高宽的方法
                 *
                 * @return {Object}    iframe文档的各类尺寸
                 * @throws {Error}     内容窗口还未加载完毕无法使用
                 */
                getContentSize: function () {
                    var contentWindow = this.main.contentWindow;

                    if (!contentWindow) {
                        throw new Error('No content window on this iframe');
                    }

                    try {
                        var baseElement = contentWindow.document.documentElement || contentWindow.document.body;
                    }
                    catch (e) {
                        var err = new Error('Content document can not be accessed');
                        err.name = 'CrossOriginError';
                        throw err;
                    }

                    return {
                        clientWidth: baseElement.clientWidth,
                        clientHeight: baseElement.clientHeight,
                        offsetWidth: baseElement.offsetWidth,
                        offsetHeight: baseElement.offsetHeight,
                        scrollWidth: baseElement.scrollWidth,
                        scrollHeight: baseElement.scrollHeight
                    };
                },

                /**
                 * 调用iframe内容窗口的方法
                 *
                 * @param {string} methodName 方法名称
                 * @param {...Mixed} args 调用时的参数
                 * @return {Mixed}
                 * @throws {Error} 内容窗口还未加载完毕无法使用
                 */
                callContentMethod: function (methodName) {
                    var args = [].slice.call(arguments, 1);
                    var contentWindow = this.main.contentWindow;

                    if (!contentWindow) {
                        throw new Error('No content window on this iframe');
                    }

                    if (typeof contentWindow[methodName] !== 'function') {
                        throw new Error('No "' + methodName + '" method on window');
                    }

                    return contentWindow[methodName].apply(contentWindow, args);
                },

                /**
                 * 向iframe内容窗口发送消息
                 *
                 * @param {Mixed} message 发送的消息对象
                 * @param {string} targetOrigin 目标域
                 * @throws {Error} 内容窗口还未加载完毕无法使用
                 * @throws {Error} 当前浏览器不支持`postMessage`方法
                 */
                postMessage: function (message, targetOrigin) {
                    var contentWindow = this.main.contentWindow;

                    if (!contentWindow) {
                        throw new Error('No content window on this iframe');
                    }

                    if (typeof contentWindow.postMessage !== 'function') {
                        throw new Error('Current browser does not support postMessage');
                    }

                    contentWindow.postMessage(message, targetOrigin);
                }
            }
        );

        esui.register(Frame);
        return Frame;
    }
);
