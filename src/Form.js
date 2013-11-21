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
        var ui = require('./main');
        var Panel = require('./Panel');

        /**
         * 输入控件集合类
         *
         * @param {InputControl[]} inputs 管理的输入控件
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
         * @param {InputControl[]} 输入控件集合
         * @param {Function} fetchValue 获取值的函数
         * @return {Object} 表单的数据
         */
        function getData(inputs, fetchValue) {
            var store = {};
            for (var i = 0; i < inputs.length; i++) {
                var control = inputs[i];

                // 排除未选中的选择框控件
                if (control.getCategory() === 'check' && !control.isChecked()) {
                    continue;
                }

                 // 不需要禁用了的控件的值
                if (control.isDisabled()) {
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
            u.each(
                store,
                function (value, key) {
                    // 数组默认就是逗号分隔的所以没问题
                    valueString += encodeURIComponent(key) + '=' + value;
                }
            );

            return valueString;
        };

        /**
         * 获取字符串形式的控件值
         *
         * @param {string} [name] 指定控件的`name`属性
         * @return {string} 用逗号分隔的值
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
         */
        InputCollection.prototype.checkAll = function () {
            for (var i = 0; i < this.length; i++) {
                var control = this[i];
                if (control.getCategory() === 'check') {
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
                if (control.getCategory() === 'check') {
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
                if (control.getCategory() === 'check') {
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
            var map = lib.toDictionary(values);

            for (var i = 0; i < this.length; i++) {
                var control = this[i];
                if (control.getCategory() === 'check') {
                    var shouldBeChecked = 
                        map.hasOwnProperty(control.getValue());
                    control.setChecked(shouldBeChecked);
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

        Form.defaultProperties = {
            autoValidate: false
        };

        Form.prototype.type = 'Form';
        
        /**
         * 验证并提交表单，根据`autoValidate`属性有不同行为
         */
        Form.prototype.validateAndSubmit = function () {
            var isValid = this.get('autoValidate')
                ? this.validate()
                : true;
            var data = {
                triggerSource: this
            };

            this.fire(isValid ? 'submit' : 'invalid', data);
        };

        Form.prototype.initStructure = function () {
            if (this.main.nodeName.toLowerCase() === 'form') {
                // 劫持表单的提交事件
                this.helper.addDOMEvent(
                    this.main,
                    'submit',
                    function (e) {
                        try {
                            this.validateAndSubmit();
                        }
                        catch (ex) {
                            this.fire('submitfail', { error: ex });
                        }

                        e.preventDefault();
                        return false;
                    }
                );
            }
        };

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
            var properties = lib.extend({}, Form.defaultProperties, options);
            if (this.main.nodeName.toLowerCase() === 'form') {
                properties.action = this.main.getAttribute('action');
                properties.method = this.main.getAttribute('method');
            }
            else {
                properties.method = this.method || 'POST';
            }
            if (options.autoValidate === 'false') {
                properties.autoValidate = false;
            }
            else {
                properties.autoValidate = !!properties.autoValidate;
            }
            Panel.prototype.initOptions.call(this, properties);
        };

        /**
         * 判断是否为输入控件
         *
         * @param {Control} control 控件
         * @return {boolean}
         */
        function isInputControl(control) {
            var category = control.getCategory();
            return category === 'input' || category === 'check';
        }

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
            var result = [];

            // 自上向下遍历整个子树，遇到任何输入控件就不再深入
            function walk(form, root) {
                // 不使用`lib.getChildren()`是考虑到这样会变成2次循环，树大的时候太慢
                var children = root.children;
                // 全树遍历东西还是有可能蛮多的，考虑IE的DOM性能，缓存一下相关变量
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    var element = children[i];

                    // IE6-8会有注释节点，所以还是要有这个判断
                    if (element.nodeType !== 1) {
                        continue;
                    }

                    var control = ui.getControlByDOM(element);
                    if (control
                        && isInputControl(control)
                        && control.viewContext === form.viewContext
                        && control.get('name')
                        && (!name || control.get('name') === name)
                        && (!type || control.get('type') === type)
                    ) {
                        result.push(control);
                    }
                    else {
                        walk(form, element);
                    }
                }
            }

            walk(this, this.main);

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

        /**
         * 验证所有表单控件
         *
         * @return {boolean}
         * @public
         */
        Form.prototype.validate = function () {
            var inputs = this.getInputControls();
            var result = true;
            for (var i = 0; i < inputs.length; i++) {
                var control = inputs[i];
                 // 不对disabled的控件进行验证
                if (control.isDisabled()) {
                    continue;
                }

                result &= control.validate();
            }
            return !!result;
        };

        Form.prototype.repaint = function (changes, changesIndex) {
            Panel.prototype.repaint.apply(this, arguments);

            var shouldAttachSubmit = false;
            if (!changesIndex && this.submitButton) {
                shouldAttachSubmit = true;
            }
            if (changesIndex 
                && changesIndex.hasOwnProperty('submitButton')
            ) {
                // 如果是运行期个性`submitButton`，要先把原来的`click`事件解除
                var record = changesIndex.submitButton;
                if (record.oldValue) {
                    for (var i = 0; i < record.oldValue.length; i++) {
                        var oldButton = 
                            this.viewContext.get(record.oldValue[i]);
                        if (oldButton) {
                            oldButton.un('click', this.validateAndSubmit, this);
                        }
                    }

                    shouldAttachSubmit = !!this.submitButton;
                }
            }

            if (shouldAttachSubmit) {
                for (var i = 0; i < this.submitButton.length; i++) {
                    var button = this.viewContext.get(this.submitButton[i]);
                    if (button) {
                        button.on('click', this.validateAndSubmit, this);
                    }
                }
            }
        };

        Form.prototype.setProperties = function (properties) {
            properties = lib.extend({}, properties);
            // 允许`submitButton`是个逗号分隔的字符串
            if (typeof properties.submitButton === 'string') {
                properties.submitButton = properties.submitButton.split(',');
            }
            Panel.prototype.setProperties.call(this, properties);
        };

        lib.inherits(Form, Panel);
        ui.register(Form);
        return Form;
    }
);
