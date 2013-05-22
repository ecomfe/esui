/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 表单控件
 * @author otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var main = require('./main');
        var Panel = require('./Panel');
        var CheckBox = require('./CheckBox');

        /**
         * 输入控件集合类
         *
         * @param {Array.<InputControl>} inputs 管理的输入控件
         * @inner
         */
        function InputCollection(inputs) {
            this.length = inputs.length;
            for (var i = 0; i < inputs.length; i++) {
                this[i] = inputs[i];
            }
        }

        // 为了让Firebug认为这是个数组
        InputCollection.prototype.splice = Array.prototype.splice;

        /**
         * 获取表单数据，形成以`name`为键，`fetchValue`指定方法的返回值为值，
         * 如果有同`name`的多个控件，则值为数组
         *
         * @param {Array.<InputControl>} 输入控件集合
         * @param {function} fetchValue 获取值的函数
         * @return {Object} 表单的数据
         * @inner
         */
        function getData(inputs, fetchValue) {
            var store = {};
            for (var i = 0; i < inputs.length; i++) {
                var control = inputs[i];

                // 排除未选中的选择框控件
                if (control instanceof CheckBox && !control.isChecked()) {
                    continue;
                }

                var name = control.get('name');
                var value = fetchValue(control);
                if (store.hasOwnProperty(name)) {
                    store[name] = [].concat(store[name], value);
                }
                else {
                    store[name] = value;
                }
            }
            return store;
        }

        /**
         * 获取表单数据，形成以`name`为键，`rawValue`为值的对象，
         * 如果有同`name`的多个控件，则值为数组
         *
         * @return {Object} 表单的数据
         * @public
         */
        InputCollection.prototype.getData = function () {
            return getData(
                this, 
                function (control) { return control.getRawValue(); }
            );
        };

        /**
         * 获取提交的字符串数据
         *
         * @return {string} 可提交的字符串
         * @public
         */
        InputCollection.prototype.getDataAsString = function () {
            var store = getData(
                this, 
                function (control) {
                    var value = control.getValue();
                    return encodeURIComponent(value);
                }
            );
            var valueString = '';
            for (var key in store) {
                if (store.hasOwnProperty(key)) {
                    // 数组默认就是逗号分隔的所以没问题
                    valueString += encodeURIComponent(key) + '=' + store[key];
                }
            }

            return valueString;
        };

        /**
         * 获取字符串形式的控件值
         *
         * @param {string=} name 指定控件的`name`属性
         * @return {string} 用逗号分隔的值
         * @public
         */
        InputCollection.prototype.getValueAsString = function (name) {
            var data = this.getData();
            var values = data[name];
            var valueString = values
                ? (typeof value === 'string' ? value : value.join(','))
                : '';
            return valueString;
        };

        /**
         * 勾选全部控件
         *
         * @public
         */
        InputCollection.prototype.checkAll = function () {
            for (var i = 0; i < this.length; i++) {
                var control = this[i];
                if (typeof control.setChecked === 'function') {
                    control.setChecked(true);
                }
            }
        };

        /**
         * 取消勾选所有控件
         *
         * @public
         */
        InputCollection.prototype.uncheckAll = function () {
            for (var i = 0; i < this.length; i++) {
                var control = this[i];
                if (typeof control.setChecked === 'function') {
                    control.setChecked(false);
                }
            }
        };

        /**
         * 反选控件
         *
         * @public
         */
        InputCollection.prototype.checkInverse = function () {
            for (var i = 0; i < this.length; i++) {
                var control = this[i];
                if (typeof control.setChecked === 'function') {
                    control.setChecked(!control.isChecked());
                }
            }
        };

        /**
         * 选中给定值的控件
         *
         * @param {Array.<string>} values 给定的值
         * @public
         */
        InputCollection.prototype.checkByValue = function (values) {
            var map = {};
            for (var i = 0; i < values.length; i++) {
                map[values[i]] = true;
            }

            for (var i = 0; i < this.length; i++) {
                var control = this[i];
                if (typeof control.setChecked === 'function') {
                    control.setChecked(map[control.getValue()]);
                }
            }
        };

        /**
         * 表单控件
         *
         * @param {Object=} options 构造控件的选项
         * @constructor
         */
        function Form(options) {
            Panel.apply(this, arguments);
        }

        Form.prototype.type = 'Form';

        /**
         * 创建主元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement} 主元素
         * @protected
         */
        Form.prototype.createMain = function (options) {
            var form = document.createElement('form');
            form.method = 'POST';
            form.action = options.action;
            return form;
        };

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @protected
         */
        Form.prototype.initOptions = function (options) {
            Panel.prototype.initOptions.call(this, options);
            if (this.main.nodeName.toLowerCase() === 'form') {
                this.action = this.main.getAttribute('action');
                this.method = this.main.getAttribute('method');
            }
            else {
                this.method = this.method || 'POST';
            }
        };

        Form.prototype.repaint = function (changes, changesIndex) {
            Panel.prototype.repaint.apply(this, arguments);

            var shouldAttachSubmit = false;
            if (!changesIndex && this.submitButton) {
                shouldAttachSubmit = true;
            }
            else if (changesIndex 
                && changesIndex.hasOwnProperty('submitButton')
            ) {
                var record = changesIndex.submitButton;
                if (record.oldValue) {
                    var oldButton = this.viewContext.get(record.oldValue);
                    if (oldButton && this.submitHandler) {
                        oldButton.un('click', this.submitHandler);
                    }

                    shouldAttachSubmit = !!this.submitButton;
                }
            }

            if (shouldAttachSubmit) {
                var button = this.viewContext.get(this.submitButton);
                if (button) {
                    this.submitHandler = lib.bind(this.fire, this, 'submit');
                    button.on('click', this.submitHandler);
                }
            }
        };

        var InputControl = require('./InputControl');

        /**
         * 根据名称及可选的类型获取输入控件
         * 
         * 这个方法返回符合以下要求的控件：
         * 
         * - 是`InputControl`
         * - `name`和`type`符合要求
         * - 主元素在当前`Form`的主元素下
         * - 与当前的`Form`使用同一个`ViewContext`
         * - 不作为另一个`InputControl`的子控件
         *
         * @param {string=} name 控件的name属性
         * @param {string=} type 控件的类型
         * @return {InputCollection}
         * @public
         */
        Form.prototype.getInputControls = function (name, type) {
            var elements = [].concat(
                lib.toArray(this.main.getElementsByTagName('input')),
                lib.toArray(this.main.getElementsByTagName('select')),
                lib.toArray(this.main.getElementsByTagName('textarea'))
            );
            var instanceAttribute = require('./main').getConfig('instanceAttr');
            var result = [];
            
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                // 所有的`InputControl`必须有一个`<input type="hidden">`在主元素下，
                // 则分为2种情况讨论：
                // 
                // - `InputControl`的主元素本身就是`<input>`类元素
                // - `InputControl`的主元素下有一个`<input type="hidden">`元素
                // 
                // 因此需要找当前DOM元素和其父元素上有没有对应的`data-ctrl-id`属性
                if (!element.getAttribute(instanceAttribute)) {
                    element = element.parentNode;
                    if (!element.getAttribute(instanceAttribute)) {
                        continue;
                    }
                }

                var control = main.getControlByDOM(element);
                if (control
                    && control instanceof InputControl
                    && control.viewContext === this.viewContext
                    && control.get('name')
                    && (!name || control.get('name') === name)
                    && (!type || control.get('type') === type)
                ) {
                    var parent = control.parent;
                    // 如果一个输入控件是在另一个输入控件中的，则不需要它
                    while (parent && !(parent instanceof InputControl)) {
                        parent = parent.parent;
                    }
                    if (!(parent instanceof InputControl)) {
                        result.push(control);
                    }
                }
            }

            return new InputCollection(result);
        };

        /**
         * 获取表单数据，形成以`name`为键，`rawValue`为值的对象，
         * 如果有同`name`的多个控件，则值为数组
         *
         * @return {Object} 表单的数据
         * @public
         */
        Form.prototype.getData = function () {
            var inputs = this.getInputControls();
            return inputs.getData();
        };

        /**
         * 获取提交的字符串数据
         *
         * @return {string}
         * @public
         */
        Form.prototype.getDataAsString = function () {
            var inputs = this.getInputControls();
            return inputs.getDataAsString();
        };

        lib.inherits(Form, Panel);
        require('./main').register(Form);
        return Form;
    }
);