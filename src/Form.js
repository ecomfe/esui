/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 表单控件
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var ui = require('./main');
        var Panel = require('./Panel');

        /**
         * 输入控件集合类
         *
         * 此类为内部类，仅可通过{@link Form#getInputControls}获取
         *
         * @constructor
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
         * @ignore
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
         * 如果有同`name的多个控件，则值为数组
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
         * 获取提交的字符串数据，返回一个URL编码的字符串
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
         * @param {string} name 指定控件的`name`属性
         * @return {string} 用逗号分隔的值
         */
        InputCollection.prototype.getValueAsString = function (name) {
            var data = this.getData();
            var values = data[name];
            var valueString = values
                ? (typeof values === 'string' ? values : values.join(','))
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
         * 当控件的`value`在给定的数组中存在时，则被勾选
         *
         * @param {string[]} values 给定的值
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
         * @extends Panel
         * @constructor
         */
        function Form(options) {
            Panel.apply(this, arguments);
        }

        /**
         * @cfg defaultProperties
         *
         * 默认属性值
         *
         * @cfg {boolean} [defaultProperties.autoValidate=false] 是否自动检验
         * @static
         */
        Form.defaultProperties = {
            autoValidate: false
        };

        /**
         * 控件类型，始终为`"Form"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        Form.prototype.type = 'Form';

        /**
         * 验证并提交表单，根据{@link Form#autoValidate}属性有不同行为
         *
         * 当{@link Form#autoValidate}属性为`true`时，会先进行验证，
         * 验证成功则触发{@link Form#submit}事件，否则触发{@link Form#invalid}事件
         *
         * 如果{@link Form#autoValidate}属性为`false`，
         * 则直接触发{@link Form#submit}事件
         *
         * @fires beforevalidate
         * @fires aftervalidate
         * @fires submit
         * @fires invalid
         * @fires submitfail
         */
        Form.prototype.validateAndSubmit = function () {
            /**
             * @event beforevalidate
             *
             * 在验证前触发
             *
             * 如果通过`preventDefault()`阻止此事件的默认行为，则不再进行验证和提交
             *
             * @member Form
             * @preventable
             */
            var event = this.fire('beforevalidate');
            if (event.isDefaultPrevented()) {
                return;
            }
            try {
                var isValid = this.get('autoValidate')
                    ? this.validate()
                    : true;

                /**
                 * @event aftervalidate
                 *
                 * 在验证后触发
                 *
                 * 如果{@link Form#autoValidate}属性为`false`，不会触发此事件
                 *
                 * 如果通过`preventDefault()`阻止此事件的默认行为，则不再进行提交
                 *
                 * @param {boolean} isValid 验证的结果，`true`为验证通过
                 * @member Form
                 * @preventable
                 */
                var event = this.fire('aftervalidate', { isValid: isValid });
                if (event.isDefaultPrevented()) {
                    return;
                }

                var data = {
                    triggerSource: this
                };

                if (isValid) {
                    /**
                     * @event submit
                     *
                     * 提交时触发，控件实际不负责提交操作，仅触发此事件
                     *
                     * @param {Control} triggerSource 触发提交的控件
                     */
                    this.fire('submit', data);
                }
                else {
                    /**
                     * @event invalid
                     *
                     * 检验失败时触发
                     *
                     * @param {Control} triggerSource 触发提交的控件
                     */
                    this.fire('invalid', data);
                }
            }
            catch (ex) {
                /**
                 * @event submitfail
                 *
                 * 提交失败时触发，通常由检验阶段发生错误引起
                 *
                 * @param {Error} error 错误对象
                 */
                this.fire('submitfail', { error: ex });
            }
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        Form.prototype.initEvents = function () {
            if (this.main.nodeName.toLowerCase() === 'form') {
                // 劫持表单的提交事件
                this.helper.addDOMEvent(
                    this.main,
                    'submit',
                    function (e) {
                        this.validateAndSubmit();

                        e.preventDefault();
                        return false;
                    }
                );
            }
        };

        /**
         * 创建主元素，默认使用`<form>`元素
         *
         * @param {Object} options 初始化时传入的参数
         * @param {string} [options.action] 提交目标地址
         * @return {HTMLElement} 主元素
         * @protected
         * @override
         */
        Form.prototype.createMain = function (options) {
            var form = document.createElement('form');
            /**
             * @property {string} method
             *
             * 表单提交的行为属性，可以为`GET`、`POST`、`PUT`、`DELETE`等
             *
             * 这个属性没什么意义，仅作为一个标识
             *
             * 此属性仅在初始化时生效，运行期不能修改
             *
             * @readonly
             */
            form.method = 'POST';
            /**
             * @property {string} action
             *
             * 表单提交的目标地址
             *
             * 这个属性没什么意义，仅作为一个标识
             *
             * 此属性仅在初始化时生效，运行期不能修改
             *
             * @readonly
             */
            form.action = options.action || '';
            return form;
        };

        /**
         * 初始化参数
         *
         * 如果初始化时未提供相应属性，则按以下逻辑补充：
         *
         * - 如果未提供`action`属性，且主元素是`<form>`元素，
         * 则使用从主元素的`action`属性
         * - 如果未提供`method`属性，且主元素是`<form>`元素，
         * 则使用从主元素的`method`属性，如果主元素也无此属性，则默认为`"POST"`
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        Form.prototype.initOptions = function (options) {
            var properties = u.extend({}, Form.defaultProperties, options);
            if (this.main.nodeName.toLowerCase() === 'form') {
                properties.action = this.main.getAttribute('action');
                properties.method = this.main.getAttribute('method');
            }
            else {
                properties.method = this.method || 'POST';
            }
            if (options.autoValidate === 'false') {
                /**
                 * @property {boolean} autoValidate
                 *
                 * 指定提交时是否自动检验，
                 * 默认使用{@link Form#defaultProperties}的配置
                 *
                 * 为了方便从HTML生成控件，如果该属性值为字符串`"false"`，
                 * 会被视为`false`使用，其它情况下通过弱类型转换为`boolean`值
                 */
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
         * @ignore
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
         * - 是{@link InputControl}
         * - `name`和`type`符合要求
         * - 主元素在当前控件的主元素下
         * - 与当前的控件使用同一个{@link ViewContext}
         * - 不作为另一个{@link InputControl}的子控件
         *
         * @param {string} [name] 指定过滤的控件的`name`属性，不提供则获取所有输入控件
         * @param {string} [type] 指定过滤的控件的类型，不提供则获取所有输入控件
         * @return {InputCollection}
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
         */
        Form.prototype.getData = function () {
            var inputs = this.getInputControls();
            return inputs.getData();
        };

        /**
         * 获取提交的字符串数据
         *
         * @return {string} 返回URL编码的一个字符串
         */
        Form.prototype.getDataAsString = function () {
            var inputs = this.getInputControls();
            return inputs.getDataAsString();
        };

        /**
         * 验证所有表单控件，同时会触发输入控件的错误信息提示逻辑，
         * 参考{@link InputControl#validate}方法
         *
         * 所有状态为禁用的输入控件示参与检验
         *
         * @return {boolean} 返回`true`表示验证通过
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

        /**
         * 重渲染
         *
         * @method
         * @protected
         * @override
         */
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
            properties = u.clone(properties);
            // 允许`submitButton`是个逗号分隔的字符串
            /**
             * @property {string[] | string} submitButton
             *
             * 点击后可提交表单的按钮的id集合，当一个控件符合以下条件：
             *
             * - 与当前控件共享一个{@link ViewContext}对象
             * - `id`在`submitButton`数组中
             * - 可触发`click`事件
             *
             * 则此控件触发`click`事件时，表单将进行提交操作
             *
             * 为方便HTML生成控件，该属性可以使用逗号或空格分隔的字符串
             */
            properties.submitButton =
                lib.splitTokenList(properties.submitButton);
            Panel.prototype.setProperties.call(this, properties);
        };

        lib.inherits(Form, Panel);
        ui.register(Form);
        return Form;
    }
);
