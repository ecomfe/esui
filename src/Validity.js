/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 验证信息显示控件
 * @author otakustay
 */

define(
    // 你说为啥要有这么个控件？因为有2货喜欢在验证提示里放别的控件！
    // 你说为啥这东西不继承`Label`？因为有2货要往里放控件！
    // 你说为啥名字不叫`ValidityLabel`？CSS样式里看到`validitylabel`多丑！
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

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
         * 创建主元素
         *
         * @param {HTMLElement} 肯定返回`<label>`
         * @protected
         */
        Validity.prototype.createMain = function () {
            return document.createElement('label');
        };

        /**
         * 获取元素的全部class
         *
         * @param {Validity} label 控件实例
         * @param {string} state 验证状态
         * @inner
         */
        function getClasses(label, state) {
            var classes = helper.getPartClasses(label);
            if (label.target) {
                classes = classes.concat(
                    helper.getPartClasses(label.target, 'validity-label')
                );
            }
            if (state) {
                classes = classes.concat(
                    helper.getPartClasses(label, state)
                );
                if (label.target) {
                    classes = classes.concat(
                        helper.getPartClasses(
                            label.target, 'validity-label-' + state
                        )
                    );
                }
            }
            if ((label.target && label.target.isHidden()) || label.isHidden()) {
                classes = classes.concat(
                    helper.getStateClasses(label, 'hidden')
                );
                if (label.target) {
                    classes = classes.concat(
                        helper.getPartClasses(
                            label.target, 'validity-label-hidden')
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
         * @param {validator/Validity} 最原始的验证结果对象
         *
         * @protected
         */
        Validity.prototype.display = function (validState, message, validity) {
            this.main.innerHTML = message;
        };

        /**
         * 重绘
         */
        Validity.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            {
                name: 'target',
                paint: function (label, target) {
                    var validState = label.validity
                        ? label.validity.getValidState()
                        : '';
                    var classes = getClasses(label, validState);
                    label.main.className = classes.join(' ');
                }
            },
            {
                name: 'focusTarget',
                paint: function (label, focusTarget) {
                    if (label.main.nodeName.toLowerCase() === 'label'
                        && (focusTarget && focusTarget.id)
                    ) {
                        lib.setAttribute(label.main, 'for', focusTarget.id);
                    }
                }
            },
            {
                name: 'validity',
                paint: function (label, validity) {
                    var validState = validity && validity.getValidState();
                    var classes = getClasses(label, validState);
                    label.main.className = classes.join(' ');

                    label.disposeChildren();
                    if (validity) {
                        var message = validity.getCustomMessage();
                        if (!message) {
                            var states = validity.getStates();
                            for (var i = 0; i < states.length; i++) {
                                var state = states[i];
                                if (!state.getState()) {
                                    message = state.getMessage();
                                    break;
                                }
                            }
                        }
                        label.display(validState, message || '', validity);
                        label.initChildren();
                    }
                    else {
                        label.main.innerHTML = '';
                    }
                }
            }
        );

        /**
         * 销毁控件
         */
        Validity.prototype.dispose = function () {
            if (helper.isInStage(this, 'DISPOSED')) {
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