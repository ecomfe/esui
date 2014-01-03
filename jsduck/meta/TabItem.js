/**
 * @class meta.TabItem
 *
 * {@link Tab}数据源的配置项
 */
function TabItem() {
    /**
     * @property {string} title
     *
     * 显示文本
     */
    this.title;

    /**
     * @property {string} [panel]
     *
     * 对应的面板元素的id，如果有此属性，则切换至当前标签时，对应的面板会被显示，
     * 其它标签对应的面板（如果有）会被隐藏
     *
     * 显示和隐藏使用简单的`display`样式控制
     */
    this.panel;
}
