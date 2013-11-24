/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 扩展基类
 * @author otakustay
 */
define(
    function (require) {
        var lib = require('./lib');

        /**
         * 扩展基类
         *
         * `Extension`指代针对控件的扩展。
         *
         * `Extension`类为扩展基类，所有扩展类需要继承于`Extension`。
         * 扩展类需要通过`{@link main#registerExtension}`方法，注册扩展类型。
         * 注册扩展类型时将自动根据`prototype.type`进行类型关联。
         * 
         * 一个控件实例可以组合多个`Extension`实例，
         * 但一个控件实例对同种类型（即`type`相同）的`Extension`，只能拥有一份。
         *
         * 从设计上而言，`Extension`不同与普通脚本对控件的操作，
         * 相比ESUI从设计理念上不希望普通脚本操作控件的保护属性及内部DOM元素，
         * 扩展则对控件拥有 **完全开放** 的权限，这包含但不限于：
         *
         * - 注册事件、修改属性等其它逻辑程序可做的行为。
         * - 覆盖控件实例上的相应函数，如`render`或`addChild`等。
         * - 读取`核心属性`与`关键属性`，包括`type`、`main`等。
         * - 可接触控件内部的DOM对象，即可以访问`main`及其子树，并对DOM做任何操作。
         *
         * 在控件初始化时，会对扩展进行初始化，其基本流程为：
         *
         * 1. 当控件`init`之后，会依次对所有关联`Extension`，
         * 调用`attachTo`方法。一个类型的`Extension`仅能在控件实例上附加一次，
         * 如果一个控件已经附加了同类型的`Extension`实例，则跳过本次`attachTo`操作。
         * 2. 当控件`dispose`之前，会依次对所有关联`Extension`，调用其`dispose`方法。
         *
         * 有多种方法可以将扩展绑定到具体的控件实例上：
         *
         * - 在控件创建时绑定
         *
         *     通过控件构造函数参数`options.extensions`可以为控件绑定扩展。
         *
         *         new TextBox({
         *             extensions: [
         *                 new MyExtension({ ... }),
         *                 new OtherExtension({ ... })
         *             ]
         *         });
         *
         * - 在使用HTML生成时绑定
         *
         *     在HTML中，使用`data-ui-extension-xxx`属性注册一个扩展：
         *
         *         <div id="main-panel" class="wrapper"
         *             data-ui-type="Panel"
         *             data-ui-extension-command-type="Command"
         *             data-ui-extension-command-events="click,keypress,keyup"
         *             data-ui-extension-command-use-capture="false"
         *         </div>
         *
         *     在HTML中，使用`data-ui-extension-*-property`属性添加扩展，
         *     其中`*`作为扩展的分组，可以是任何字符串，相同的`*`将作为对同一扩展的定义，
         *     必须包含`data-ui-extension-*-type`定义扩展的类型，
         *     而其它`data-ui-extension-*-property="value"`属性
         *     则将作为`options`参数的属性传递给扩展的构造函数
         *
         * - 在实例创建后动态地绑定
         *
         *     在控件创建后，可以动态创建扩展并在适当的时候绑定至控件。
         *
         *         var panel = new Label({ text: 'abc' });
         *         var delegateDOMEvents = main.createExtension(
         *             'Command',
         *             {
         *                 eventTypes: ['click', 'keypress', 'keyup'],
         *                 useCapture: false
         *             }
         *         );
         *         // 需主动调用attachTo方法
         *         delegateDomEvents.attachTo(panel);
         *         panel.appendTo(container);
         *
         * - 全局绑定
         *
         *     调用{@link main#attachExtension}函数可在全局注册一个扩展：
         *
         *         main.attachExtension('Command', { events: ['click'] });
         *
         *     全局注册的扩展，将会被附加到 **所有** 控件的实例上。
         *     使用`options`参数作为`Extension`创建时的选项，
         *     创建`Extension`实例时会对`options`做复制处理。
         *
         * 具体可以参考{@link extension.Command}作为示例，来学习扩展的编写
         *
         * @param {Object} [options] 初始化的参数
         * @constructor
         */
        function Extension(options) {
            lib.extend(this, options);
        }

        /**
         * 当前扩展实例应用的控件对象
         *
         * @type {Control}
         * @protected
         */
        Extension.prototype.target = null;

        /**
         * 当前扩展实例是否处于激活状态
         *
         * @type {boolean}
         * @private
         */
        Extension.prototype.active = false;

        /**
         * 判断当前实例是否处于激活状态
         *
         * @return {boolean} 如果处于激活状态则返回`true`
         */
        Extension.prototype.isActive = function () {
            return this.active;
        };

        /**
         * 激活当前扩展
         * @abstract
         */
        Extension.prototype.activate = function () {
            this.active = true;
        };

        /**
         * 禁用当前扩展
         * @abstract
         */
        Extension.prototype.inactivate = function () {
            this.active = false;
        };

        /**
         * 关联至给定的控件
         *
         * @param {Control} target 需要关联的控件实例
         */
        Extension.prototype.attachTo = function (target) {
            // 事实上我们不希望一个扩展实例被多效附加到控件上，
            // 所以虽然你看到了这段代码，但最好别这么乱来，
            // 我们无法保证所有的扩展`inactivate()`能清理干净东西
            if (this.target && this.target !== target) {
                if (this.active) {
                    this.inactivate();
                }
            }

            this.target = target;
            // 仅在传入的`target`和`this.target`相同，
            // 且原来就激活时，才会跳过这个分支
            if (!this.active) {
                this.activate();
            }
        };

        /**
         * 销毁当前实例
         */
        Extension.prototype.dispose = function () {
            if (this.active) {
                this.inactivate();
            }
            this.target = null;
        };

        return Extension;
    }
);
