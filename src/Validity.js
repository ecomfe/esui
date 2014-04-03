/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 验证信息显示控件
 * @author otakustay
 */
define(
    // 你说为啥要有这么个控件？因为有2货喜欢在验证提示里放别的控件！
    // 你说为啥这东西不继承`Label`？因为有2货要往里放控件！
    // 你说为啥名字不叫`ValidityLabel`？CSS样式里看到`validitylabel`多丑！
    function (require) {
        var u  = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');
        var Helper = require('./Helper');

        /**
         * 验证信息显示控件
         *
         * @extends Control
         * @constructor
         */
        function Validity() {
            Control.apply(this, arguments);
        }

        Validity.prototype.type = 'Validity';

        /**
         * 创建主元素，默认使用`<label>`元素
         *
         * @return {HTMLElement}
         * @protected
         * @override
         */
        Validity.prototype.createMain = function () {
            return document.createElement('label');
        };

        /**
         * 初始化参数
         *
         * @param {Object} [options] 输入的参数
         * @protected
         * @override
         */
        Validity.prototype.initOptions = function (options) {
            var properties =
                u.extend({}, Validity.defaultProperties, options);
            Control.prototype.initOptions.call(this, properties);
        };

        /**
         * 获取元素的全部class
         *
         * @param {Validity} label 控件实例
         * @param {string} state 验证状态
         * @ignore
         */
        function getClasses(label, state) {
            var target = label.target;

            var targetHelper = null;
            if (target || label.targetType) {
                var targetContext = {
                    type: label.targetType || target.type,
                    skin: target && target.skin
                };
                targetHelper = new Helper(targetContext);
            }

            var classes = label.helper.getPartClasses();
            if (targetHelper) {
                classes.push.apply(
                    classes,
                    targetHelper.getPartClasses('validity-label')
                );
            }
            if (state) {
                classes.push.apply(
                    classes,
                    label.helper.getPartClasses(state)
                );
                if (targetHelper) {
                    classes.push.apply(
                        classes,
                        targetHelper.getPartClasses('validity-label-' + state)
                    );
                }
            }
            if ((target && target.isHidden()) || label.isHidden()) {
                classes.push.apply(
                    classes,
                    label.helper.getStateClasses('hidden')
                );
                if (target) {
                    classes.push.apply(
                        classes,
                        target.helper.getPartClasses('validity-label-hidden')
                    );
                }
            }
            return classes;
        }

        /**
         * 显示验证信息，可重写
         *
         * @param {string} validState 验证结果
         * @param {string} message 验证信息
         * @param {validator.Validity} validity 最原始的验证结果对象
         * @protected
         */
        Validity.prototype.display = function (validState, message, validity) {
            this.main.innerHTML = message;
        };

        /**
         * 重绘
         *
         * @method
         * @protected
         * @override
         */
        Validity.prototype.repaint = require('./painters').createRepaint(
            Control.prototype.repaint,
            {
                /**
                 * @property {Control} target
                 *
                 * 对应的控件
                 */

                /**
                 * @property {string} targetType
                 *
                 * 对应的控件的类型，可覆盖{@link Validity#target}的`type`属性
                 */
                name: ['target', 'targetType'],
                paint: function (label) {
                    var validState = label.validity
                        ? label.validity.getValidState()
                        : '';
                    var classes = getClasses(label, validState);
                    label.main.className = classes.join(' ');
                }
            },
            {
                /**
                 * @property {HTMLElement} focusTarget
                 *
                 * 点击当前标签后获得焦点的元素
                 *
                 * 此元素如果没有`id`属性，则不会获得焦点
                 *
                 * 私有属性，仅通过{@link InputControl#getFocusTarget}方法获得
                 *
                 * @private
                 */
                name: 'focusTarget',
                paint: function (label, focusTarget) {
                    if (label.main.nodeName.toLowerCase() === 'label') {
                        if (focusTarget && focusTarget.id) {
                            lib.setAttribute(label.main, 'for', focusTarget.id);
                        }
                        else {
                            lib.removeAttribute(label.main, 'for');
                        }
                    }
                }
            },
            {
                /**
                 * @property {validator.Validity} validity
                 *
                 * 验证结果
                 */
                name: 'validity',
                paint: function (label, validity) {
                    var validState = validity && validity.getValidState();
                    var classes = getClasses(label, validState);
                    label.main.className = classes.join(' ');

                    label.disposeChildren();
                    if (validity) {
                        var message = validity.getCustomMessage();
                        if (!message) {
                            var invalidState = u.find(
                                validity.getStates(),
                                function (state) {
                                    return !state.getState();
                                }
                            );
                            message = invalidState && invalidState.getMessage();
                        }
                        label.display(validState, message || '', validity);
                        label.helper.initChildren();
                        if (message) {
                            label.show();
                        }
                        else {
                            label.hide();
                        }
                    }
                    else {
                        label.main.innerHTML = '';
                        label.hide();
                    }
                }
            }
        );

        /**
         * 销毁控件
         *
         * @override
         */
        Validity.prototype.dispose = function () {
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }

            if (this.target) {
                this.target.validityLabel = null;
                this.target = null;
            }
            this.focusTarget = null;

            if (this.main.parentNode) {
                this.main.parentNode.removeChild(this.main);
            }

            Control.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(Validity, Control);
        require('./main').register(Validity);
        return Validity;
    }
);
