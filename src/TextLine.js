/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 多行带行码输入框
 * @author dbear
 */

define(
    function (require) {
        require('./TextBox');
        require('./Panel');
        // css
        require('css!./css/TextBox.css');
        require('css!./css/TextLine.css');

        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');
        var ui = require('./main');

        /**
         * 控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function TextLine(options) {
            InputControl.apply(this, arguments);
        }


        /**
         * 获取主体的HTML
         *
         * @param {TextLine} textLine TextLine控件实例
         * @inner
         */
        function getMainHTML(textLine) {
            var tpl = [
                '<div id="${numLineId}" class="${numLineClass}">1</div>',
                '<textarea data-ui="type:TextBox;childName:text;',
                'id:text;mode:textarea" >',
                '</textarea>'
            ].join('');

            return lib.format(
                tpl,
                {
                    numLineId: helper.getId(textLine, 'num-line'),
                    numLineClass:
                        helper.getPartClasses(textLine, 'num-line').join(' ')
                }
            );
        }

        /**
         * 滚动数字区域
         *
         * @param {TextLine} textLine TextLine控件实例
         * @inner
         */
        function resetScrollByLine(textLine) {
            var me = textLine;
            me.getChild('text').main.firstChild.scrollTop =
                me.lineNumBlock.scrollTop;
        }

        /**
         * 重置行号，增加内容和keyup时可调用
         *
         * @param {TextLine} textLine TextLine控件实例
         * @inner
         */
        function refreshLineNum(textLine) {
            var me = textLine;
            var html = [];
            var num = me.getChild('text').getValue().split('\n').length;
            if (num != me.number) {
                me.number = num;
                for (var i = 1; i < num + 1; i++) {
                    html.push(i);
                }
                me.lineNumBlock.innerHTML = html.join('<br />');
            }
            resetScroll(me);
            textLine.fire('change');
        }

        /**
         * 滚动文本输入框
         *
         * @param {TextLine} textLine TextLine控件实例
         * @inner
         */
        function resetScroll(textLine) {
            var me = textLine;
            me.lineNumBlock.scrollTop =
                me.getChild('text').main.firstChild.scrollTop;
        }

        TextLine.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'TextLine',

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                /**
                 * 默认选项配置
                 */
                var properties = {
                    width: 300,
                    height: 200
                };
                lib.extend(properties, options);
                this.setProperties(properties);
            },


            /**
             * 初始化DOM结构
             *
             * @protected
             */
            initStructure: function () {
                // 如果主元素不是`<div>`，替换成`<div>`
                if (this.main.nodeName.toLowerCase() !== 'div') {
                    helper.replaceMain(this);
                }
                
                this.main.innerHTML = getMainHTML(this);
                // 创建控件树
                this.initChildren(this.main);

                // 输入区变化监听
                var textArea = this.getChild('text');
                textArea.on(
                    'input',
                    lib.curry(refreshLineNum, this)
                );

                // 主体滚动监听
                helper.addDOMEvent(
                    textArea, textArea.main.firstChild, 'scroll',
                    lib.curry(resetScroll, this)
                );

                // 行码条滚动监听
                var lineNumDiv = lib.g(helper.getId(this, 'num-line'));
                // 保存到控件对象，因为之后会一直用到
                this.lineNumBlock = lineNumDiv;
                helper.addDOMEvent(
                    this, lineNumDiv, 'scroll',
                    lib.curry(resetScrollByLine, this)
                );

            },

            /**
             * 创建控件主元素
             *
             * @param {Object=} options 构造函数传入的参数
             * @return {HTMLElement}
             * @override
             */
            createMain: function (options) {
                return document.createElement('DIV');
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: helper.createRepaint(
                {
                    name: 'height',
                    paint: function (textLine, height) {
                        height = height || 300;

                        // 渲染行号区高度
                        var lineNumDiv = textLine.lineNumBlock;
                        lineNumDiv.style.height = height + 'px';
                        
                        // 主体高度
                        textLine.main.style.height = height + 'px';

                        // 输入区
                        var textArea = textLine.getChild('text');
                        textArea.setProperties({
                            height: height
                        });
                    }
                },
                {
                    name: 'width',
                    paint: function (textLine, width) {
                        width = width || 300;
                        
                        // 主体高度
                        textLine.main.style.width = width + 'px';

                        // 输入区
                        var textArea = textLine.getChild('text');
                        textArea.setProperties({
                            width: width - 30
                        });
                    }
                },
                {
                    name: 'rawValue',
                    paint: function (textLine, value) {
                        // 输入区
                        var textArea = textLine.getChild('text');
                        if (value && lib.trim(value)) {
                            value = lib.decodeHTML(value);
                            textLine.value =
                                value.replace(/\n{2,}/g, '\n');

                        }
                        else {
                            textLine.value = '';
                        }
                        textArea.setProperties({
                            rawValue: textLine.value
                        });
                        refreshLineNum(textLine);
                    }
                }
            ),

            /**
             * 获取内容字符串形式（包含换行符）
             *
             * @return {string}
             */
            getRawValue: function() {
                var text = this.getChild('text');
                return lib.trim(text.getValue());
            },

            /**
             * 获取内容行数
             *
             * @return {number}
             */
            getRowsNmuber: function() {
               var items = this.getValue().split('\n');
               var len = items.length;
               return len;
            },

            /**
             * 获取内容数组形式,并去除空串内容
             *
             * @return {Array}
             */
            getValueRepeatableItems: function() {
                var items = this.getValue().split('\n');
                var len = items.length;
                var value;
                var result = [];
        
                for (var i = 0; i < len; i++) {
                    value = lib.trim(items[i]);
                    if (value.length === 0) {
                        continue;
                    }
                    result.push(value);
                }
        
                return result;
            },

            /**
             * 增加内容
             *
             * @param {Array} lines
             */
            addLines: function(lines) {
                var me = this;
                var content = lines.join('\n');
                var value = me.getValue();
        
                if (value.length > 0) {
                    content = value + '\n' + content;
                }
        
                me.setProperties({ rawValue: content });
            }

        };

        lib.inherits(TextLine, InputControl);
        ui.register(TextLine);

        return TextLine;
    }
);
