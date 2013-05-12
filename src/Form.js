define(
    function (require) {
        var lib = require('./lib');
        var main = require('./main');
        var Panel = require('./Panel');

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

        var InputControl = require('./InputControl');

        function collect(control, store) {
            if (control instanceof InputControl) {
                var name = control.get('name');
                var value = control.getRawValue();
                if (store.hasOwnProperty(name)) {
                    store[name] = [].concat(store[name], value);
                }
                else {
                    store[control.name] = value;
                }
            }
            for (var i = 0; i < control.children.length; i++) {
                collect(control.children[i], store);
            }
        }

        /**
         * 获取表单数据，形成以`name`为键，`rawValue`为值的对象，
         * 如果有同`name`的多个控件，则值为数组
         *
         * @param {Object} 表单的数据
         * @public
         */
        Form.prototype.getData = function () {
            var store = {};
            collect(this, store);
            return store;
        };

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
         * @param {string} name 控件的name属性
         * @param {string=} type 控件的类型
         * @return {Array.<Control>}
         * @public
         */
        Form.prototype.getInputControlsByName = function (name, type) {
            var elements = [].concat(
                lib.toArray(this.main.getElementsByTagName('input')),
                lib.toArray(this.main.getElementsByTagName('select')),
                lib.toArray(this.main.getElementsByTagName('textarea'))
            );
            var result = [];
            
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                var control = main.getControlByDOM(element);
                if (control
                    && control instanceof InputControl
                    && control.viewContext === this.viewContext
                    && control.get('name') === name
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

            return result;
        };

        lib.inherits(Form, Panel);
        require('./main').register(Form);
        return Form;
    }
);