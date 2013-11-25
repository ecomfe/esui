/**
 * @class meta.WizardItem
 *
 * {@link Wizard}数据源的配置项
 */
function WizardItem() {
    /**
     * @property {string} text
     *
     * 显示文本
     */
    this.text;

    /**
     * @property {string} [panel]
     *
     * 对应的面板元素的id，如果有此属性，则切换至当前标签时，对应的面板会被显示，
     * 其它标签对应的面板（如果有）会被隐藏
     *
     * 显示和隐藏通过在面板元素上添加`ui-wizard-panel-hidden`这个class实现
     */
    this.panel;
}
