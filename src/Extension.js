define(function (require) {
    var lib = require('./lib');

    /**
     * 扩展基类
     *
     * @constructor
     * @param {Object=} options 初始化的参数
     */
    function Extension(options) {
        lib.mix(this, options);
    }

    /**
     * 当前扩展实例应用的控件对象
     *
     * @type {Control}
     * @private
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
     * @return {boolean} 如果处于激活状态则返回true
     * @public
     */
    Extension.prototype.isActive = function () {
        return this.active;
    };

    /**
     * 激活当前扩展
     *
     * @public
     */
    Extension.prototype.activate = function () {
        this.active = true;
    };

    /**
     * 禁用当前扩展
     *
     * @public
     */
    Extension.prototype.inactivate = function () {
        this.active = false;
    };

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
     *
     * @public
     */
    Extension.prototype.dispose = function () {
        if (this.active) {
            this.inactivate();
        }
        this.target = null;
    };

    return Extension;
});