define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');

        /**
         * 获取click事件handler
         *
         * @protected
         */
        function clickHandler( box, e ) {
            if ( !box.isDisabled() ) {
                box.fire( 'click', e );
            }
        }

        function updateChecked( box ){
            var datasource = box.datasource;
            // 初始化checked
            switch ( typeof datasource ) {
                case 'string':
                case 'number':
                    box.setChecked( datasource == value );
                    break;

                default:
                    if ( datasource instanceof Array ) {
                        box.setChecked( lib.inArray( datasource, value ) );
                    }
                    break;
            }
        }

        function updateTitle( box ){
            var title = box.title 
                || box.main.title 
                || ( box.getValue() != 'on' ? box.getValue() : '' );
            box.label.innerHTML = lib.encodeHTML( title );
        }

        /**
         * 选择框控件基类
         * 
         * @description 不直接使用，供CheckBox和Radio继承
         * @param {Object} options 控件初始化参数
         */
        function BoxControl( options ) {
            InputControl.apply( this, arguments );
        }

        BoxControl.prototype = {
            /**
             * 创建控件主元素
             *
             * @protected
             * @return {HTMLInputElement}
             */
            createMain: function () {
                return helper.createInput({
                        name: this.name,
                        type: this.type.toLowerCase()
                });
            },

            /**
             * 设置选中状态
             * 
             * @public
             * @param {boolean} checked 状态
             */
            setChecked: function ( checked ) {
                this.main.checked = !!checked;
            },
            
            /**
             * 获取选中状态
             * 
             * @public
             * @return {boolean}
             */
            isChecked: function() { 
                return this.main.checked;
            },
            
            /**
             * 渲染控件
             *
             * @public
             */
            initStructure : function(){
                var main = this.main;
                var label = this.label;

                // 插入点击相关的label元素
                if ( !label ) {
                    label = document.createElement( 'label' );
                    label.className = 
                        helper.getPartClasses( this, 'label' ).join(' ');
                    lib.setAttribute( label, 'for', main.id );

                    lib.insertAfter( label, main );
                    this.label = label;
                }

                // 初始化label的内容
                updateTitle( this );
                // 初始化disabled
                this.setDisabled ( !!this.disabled );

                //初始化rawValue
                this.setRawValue( main.value || 'on' );

                updateChecked( this );

                helper.initName( this );

                helper.addDOMEvent(
                    this, 
                    this.main, 
                    'click', 
                    lib.curry( clickHandler, this )
                );

            },

            repaint : helper.createRepaint(
                {
                    name: 'title',
                    paint: updateTitle
                },
                {
                    name: 'datasource',
                    paint: updateChecked
                }
            ),

            /**
             * 释放控件
             * 
             * @protected
             */
            dispose: function () {
                this.label = null;

                InputControl.prototype.dispose.apply(this, arguments);
            }
        };

        lib.inherits( BoxControl, InputControl );

        return BoxControl;
    }
);