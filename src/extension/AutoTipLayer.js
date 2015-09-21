/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 自动补全TipLayer扩展
 * @author chuzhenyang (chuzhenyang@baidu.com)
 */
define(
    function (require) {
        require('../TipLayer');
        var u = require('underscore');
        var Extension = require('../Extension');
        var eoo = require('eoo');
        var esui = require('esui');
        var $ = require('jquery');

        /**
         * 自动补全TipLayer扩展
         *
         * 为某一个区域添加TipLayer
         *
         * 监听一个区域 为这个区域内带有data-role='tip'属性的节点添加tip
         * 默认监听'mouseover'事件 以及无delayTime
         * 在该区域内部所有的DOM节点里 若要添加tip提示 需配置以下属性
         * 1. data-role='tip' 所有具有该属性的节点都会增加tip提示
         * 2. data-tip-title='提示标题' 该节点所要显示的提示的标题内容
         * 3. data-tip-content='提示内容' 该节点所要显示的提示的内容
         * 另外，可以配置以下属性对tip的位置进行控制
         * 1. data-tip-tipTop='top' 可以为'top'或者'bottom' 默认为'top'
         *    同TipLayer控件中的positionOpt.top
         * 2. data-tip-tipRight='left' 可以为'left'或者'right' 默认为'left'
         *    同TipLayer控件中的positionOpt.right
         * 3. data-tip-selfTop='top' 可以为'top'或者'bottom' 默认为'top'
         *    同TipLayer控件中的targetPositionOpt.top
         * 4. data-tip-selfRight='right' 可以为'left'或者'right' 默认为'left'
         *    同TipLayer控件中的targetPositionOpt.right
         * 一旦配置过以上属性 就可以自动为该区域内所有类似的节点添加相应的tip
         *
         * 默认会根据节点的attribute设置tip的title和content
         * 但有时可能想要针对不同的元素对其的title或者content进行更多方面的控制
         * 可以监听自身的tipbeforeshow事件，并preventDefault该事件
         * 该事件会暴露一个tipLayer的实例，以及默认的title和content
         *
         *
         * 使用方法如下所示：
         *
         * 假设DOM结构如下：
         * <esui-panel data-ui-id="main" data-ui-extension-autotiplayer-type="AutoTipLayer"
         *             data-ui-show-mode="over" data-ui-delay-time="1000">
         *      <button data-role="tip" data-tip-title="submit" data-tip-content="确认提示">确认</button>
         *      <button data-role="tip" data-tip-title="cancel" data-tip-content="取消提示">取消</button>
         * </div>
         *
         * 则JS中可以按照如下方式自定义设置tip的title和content
         * var panel = ui.get('main');
         * panel.on('tipbeforeshow', function (e) {
         *     if (e.title === 'submit') {
         *         this.setTitle('确认');
         *         this.setContent('确认后才可以点击！');
         *     }
         *     else {
         *         this.setContent('取消的提示！');
         *     }
         *     e.preventDefault();
         * });
         *
         * @class extension.AutoTipLayer
         * @extends Extension
         * @constructor
         */
        var AutoTipLayer = eoo.create(
            Extension,
            {

                /**
                 * 指定扩展类型，始终为`"AutoTipLayer"`
                 *
                 * @type {string}
                 */
                type: 'AutoTipLayer',

                /**
                 * 激活扩展
                 *
                 * @override
                 */
                activate: function () {
                    this.$super(arguments);
                    var target = this.target;
                    var containerElement = $(this.target.main);

                    if (!containerElement.length) {
                        return;
                    }

                    var tipLayer = esui.create('TipLayer', {
                        title: '这是提示标题',
                        content: '这是提示内容'
                    });
                    tipLayer.showMode = target.showMode || 'over';
                    tipLayer.delayTime = +target.delayTime || tipLayer.delayTime;

                    this.tipLayer = tipLayer;

                    if (tipLayer.showMode === 'over') {
                        tipLayer.helper.addDOMEvent(containerElement,
                            'mouseover', '[data-role="tip"]', u.bind(showTip, tipLayer));
                    }
                    else if (tipLayer.showMode === 'click') {
                        tipLayer.helper.addDOMEvent(containerElement,
                            'mouseup', '[data-role="tip"]', u.bind(showTip, tipLayer));
                    }

                    // 为防止delayTime时出现 tip还未hide就更改内容的情况 监听beforeshow事件 在此刻再进行更改
                    tipLayer.on('beforeshow', function (e) {
                        var targetElement = $(e.targetElement);
                        var title = targetElement.attr('data-tip-title') || tipLayer.title;
                        var content = targetElement.attr('data-tip-content') || tipLayer.content;
                        var event = target.fire('tipbeforeshow', {
                            tipLayer: tipLayer,
                            title: title,
                            content: content
                        });
                        if (!event.isDefaultPrevented()) {
                            tipLayer.setTitle(title);
                            tipLayer.setContent(content);
                        }
                    });
                },

                /**
                 * 取消扩展的激活状态
                 *
                 * @override
                 */
                inactivate: function () {
                    this.tipLayer.dispose();
                    this.tipLayer = null;
                    this.$super(arguments);
                }
            }
        );

        function showTip(event) {
            var targetDOM = $(event.target);
            // 检查是否具有data-attached的属性 有的话直接忽略就可以
            if (!targetDOM.data('data-attached')) {
                var handler = this.attachTo({
                    targetDOM: targetDOM,
                    showMode: this.showMode,
                    delayTime: this.delayTime,
                    positionOpt: {
                        top: targetDOM.attr('data-tip-tipTop') || 'top',
                        right: targetDOM.attr('data-tip-tipRight') || 'left'
                    },
                    targetPositionOpt: {
                        top: targetDOM.attr('data-tip-selfTop') || 'top',
                        right: targetDOM.attr('data-tip-selfRight') || 'right'
                    }
                });
                // 凡是已经attachTo过之后的节点 都自动添加一个data-attached的属性 防止重复绑定
                targetDOM.data('data-attached', true);

                // 第一次绑定的时候需要手动show一下才可以显示tip
                handler.layer.show();
            }
            // 阻止冒泡到父节点 以防止tipLayer自动hide掉
            event.stopPropagation();
        }

        esui.registerExtension(AutoTipLayer);
        return AutoTipLayer;
    }
);
