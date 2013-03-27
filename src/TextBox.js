/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 文本框输入控件
 * @author erik
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');

        /**
         * 默认TextBox选项配置
         * 
         * @const
         * @inner
         * @type {Object}
         */
        var DEFAULT_OPTION = {
            mode: 'text',
            value: '',
            placeholder: ''
        };

        /**
         * 文本框输入控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function TextBox(options) {
            helper.init(this, options, DEFAULT_OPTION);

            var main = this.main;
            if (main) {
                // 从main中读取placeholder
                if (!this.placeholder) {
                    this.placeholder = main.getAttribute('placeholder');
                }
                main.setAttribute('placeholder', '');

                // 从main中读取mode
                switch (main.tagName) {
                    case 'INPUT':
                        this.mode = main.getAttribute('type');
                        break;
                    case 'TEXTAREA':
                        this.mode = 'textarea';
                        break;
                }
            }

            helper.afterInit(this);
        }

        /**
         * 鼠标按下事件处理函数
         * 
         * @inner
         * @param {HTMLEvent} e 事件参数
         */
        function keypressHandler(e) {
            e = e || window.event;
            var keyCode = e.keyCode || e.which;
            
            if (keyCode == 13) {
                this.fire('enter');
            }
        }

        /**
         * 输入框获得焦点事件处理函数
         * 
         * @inner
         */
        function focusHandler() {
            var main = this.main;
            
            helper.removeClass(this, main, 'placing');
            if (this.placing) {
                main.value = '';
            }

            if (this.autoSelect) {
                main.select();
            }

            this.fire('focus');
        }

        /**
         * 输入框失去焦点事件处理函数
         * 
         * @inner
         */
        function blurHandler() {
            this.setRawValue(this.main.value);
            this.fire('blur');
        }

        /**
         * 输入框用户输入事件处理函数
         * 
         * @inner
         */
        function inputHandler() {
            if (lib.ie) {
                if (window.event.propertyName == 'value') {
                    this.fire('change');
                }
            } 
            else {
                this.fire('change');
            } 
        }
        
        TextBox.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'TextBox',

            /**
             * 创建控件主元素
             * 
             * @override
             * @return {HTMLElement}
             */
            createMain: function () {
                var mode = this.mode || 'text';
                switch (mode) {
                    case 'text':
                    case 'password':
                    case 'textarea':
                        return helper.createInput({
                            name: this.name,
                            type: mode
                        });
                }

                return null;
            },

            /**
             * 渲染控件
             * 
             * @override
             */
            render: function () {
                helper.beforeRender(this);
                helper.renderInputMain(this);
                helper.initMouseBehavior(this);

                var main = this.main;
                if (main) {
                    // 初始化控件主元素上的行为
                    if (helper.isInited(this)) {
                        main.onfocus = lib.bind(focusHandler, this);
                        main.onblur = lib.bind(blurHandler, this);
                        main.onkeypress = lib.bind(keypressHandler, this);
                        this.addInputListener();
                        helper.addClass(this, main, this.mode);
                    }

                    this.setWidth(this.width);
                    this.setHeight(this.height);
                }

                helper.afterRender(this);
            },

            /**
             * 获取输入控件的原始值
             * 
             * @override
             * @return {string} 
             */
            getRawValue: function () {
                if (this.placing) {
                    return '';
                }

                if (this.main) {
                    return this.main.value;
                }

                return this.rawValue || '';
            },

            /**
             * 设置输入控件的原始值
             * 
             * @override
             * @param {string} rawValue 输入控件的原始值
             */
            setRawValue: function (rawValue) {
                rawValue = rawValue || '';
                this.rawValue = rawValue;

                var main = this.main;
                var placeholder = this.placeholder;
                
                // 移除输入事件的处理，设置后再重新挂载
                // ie下setValue会触发propertychange事件
                this.removeInputListener();

                main.value = rawValue;
                if (rawValue) {
                    this.placing = 0;
                    helper.removeClass(this, main, 'placing');
                }
                else if (placeholder) {
                    this.placing = 1;
                    main.value = placeholder;
                    helper.addClass(this, main, 'placing');
                }

                // 重新挂载输入事件的处理
                this.addInputListener();
            },

            /**
             * 添加用户输入事件监听器
             * 
             * @private
             */
            addInputListener: function () {
                var main = this.main;
                var handler = this.inputHandler;

                if (!handler) {
                    handler = this.inputHandler = lib.bind(inputHandler, this);
                }
                
                if (lib.ie) {
                    main.onpropertychange = handler;
                }
                else {
                    lib.on(main, 'input', handler);
                }
            },

            /**
             * 移除用户输入事件监听器
             * 
             * @private
             */
            removeInputListener: function () {
                var handler = this.inputHandler;
                var main = this.main;

                if (lib.ie) {
                    main.onpropertychange = null;
                } 
                else {
                    handler && lib.un(main, 'input', handler);
                }
            },

            /**
             * 设置控件的高度
             *
             * @param {number} height 高度
             */
            setHeight: function (height) {
                this.height = height;
                height && (this.main.style.height = height + 'px');
            },
            
            /**
             * 设置控件的宽度
             *
             * @param {number} width 宽度
             */
            setWidth: function (width) {
                this.width = width;
                width && (this.main.style.width = width + 'px');
            },

            /**
             * 获焦并选中文本
             */
            select: function () {
                this.main.select();
            },

            /**
             * 销毁释放控件
             * 
             * @override
             */
            dispose: function () {
                helper.beforeDispose(this);

                var main = this.main;
                if (main) {
                    main.onkeypress = null;
                    main.onfocus = null;
                    main.onblur = null;
                    this.removeInputListener();
                }

                this.inputHandler = null;
                helper.dispose(this);
                helper.afterDispose(this);
            }
        };

        require('./lib').inherits(TextBox, InputControl);
        require('./main').register(TextBox);
        return TextBox;
    }
);
