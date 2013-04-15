define(
    function (require) {
        var lib = require('./lib');
        var ui = require('./main');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');
        var paint = require('./painters');

        /**
         * 选项组
         * 
         * @class
         * @description 
         * 该对象不往DOM上画东西，只做一些全选、反选、取值的事情
         * 
         * @param {Object} options 参数
         */
        function BoxGroup( options ) {
            this.name     = options.name;
            this.type     = options.type;
            this.control  = options.control;
        };

        BoxGroup.prototype = {
            /**
             * 获取选项组选中的值
             * 
             * @public
             * @return {string}
             */
            getValue: function() {
                var me      = this;
                var boxs    = me.getBoxList();
                var len     = boxs.length;
                var re      = [];
                
                for ( var i = 0 ; i < len; i++ ) {
                    var box = boxs[ i ];
                    if ( box.isChecked() ) {
                        re.push( box.getValue() );
                    }
                }
                
                return re.join( ',' );
            },
            
            /**
             * 对选项组下所有选项进行全选
             * 
             * @public
             * @description 
             *      仅多选控件可用
             */
            selectAll: function() {
                if ( this.type != 'CheckBox' ) {
                    return;
                }

                var boxs    = this.getBoxList();
                
                for (var i = 0 , len = boxs.length ; i < len; i++ ) {
                    boxs[i].setChecked( true );
                }
            },
            
            /**
             * 对选项组下所有选项进行按值选中
             * 
             * @public
             * @param {Array} values
             */
            selectByValues: function(values) {
                var boxes   = this.getBoxList();
                var len     = boxes.length;
                var vLen    = values.length;
                
                for ( var i = 0 ; i < len; i++ ) {
                    var box = boxes[i];
                    box.setChecked(false);
                    var value = box.getValue();
                    for ( v = 0 ; v < vLen; v++) {
                        if (value == values[v]) {
                            box.setChecked(true);
                            break;
                        }
                    }
                }
            },
            
            /**
             * 对选项组下所有选项进行反选
             * 
             * @public
             * @description 
             *      仅多选控件可用
             */
            selectInverse: function() {
                if ( this.type != 'CheckBox' ) {
                    return;
                }

                var boxs    = this.getBoxList();
                var len     = boxs.length;

                for ( var i = 0; i < len; i++ ) {
                    var box = boxs[ i ];
                    box.setChecked( !box.isChecked() );
                }
            },
            
            /**
             * 获取选项组下的DOM元素列表
             * 
             * @public
             * @return {Array}
             */
            getBoxList: function() {
                var me      = this;
                var name    = me.name;
                var type    = me.type;
                var result  = [];
                var parent  = me.control.main;
                
                while ( parent 
                        && parent.tagName != 'FORM' 
                        && parent != document.body 
                ) {
                    parent = parent.parentNode;
                }

                var els = parent.getElementsByTagName( 'input' );
                var len = els.length;
                for ( var i = 0; i < len; i++ ) {
                    var el = els[ i ];
                    var control = ui.getControlByDom( el );
                   
                    if (control 
                        && control instanceof BoxControl
                        && control.type == type 
                        && control.name == name
                    ) {
                        result.push( control );
                    }
                }
                
                return result;
            }
        };


         /**
         * 获取click事件handler
         *
         * @protected
         */
        function clickHandler( box, e ) {
            if ( !box.isDisabled() ) {
                box.onclick( e );
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
                        box.setChecked( lib.InArray( datasource, value ) );
                    }
                    break;
            }
        }

        function updateTitle( box ){
            var title = box.title || box.main.title || ( box.getValue() != 'on' ? box.getValue() : '' );
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
            onclick: new Function(),
            
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
             * 获取分组
             * 
             * @public
             * @return {BoxGroup}
             */
            getGroup: function() {
                return new BoxGroup({
                    name    : this.name, 
                    type    : this.type,
                    control : this
                } );
            },
            
            /**
             * 渲染控件
             *
             * @public
             */
            initStructure : function(){
                var me   = this;
                var main = me.main;
                var label = me._label;

                // 插入点击相关的label元素
                if ( !label ) {
                    label = document.createElement( 'label' );
                    label.className = helper.getPartClasses( me, 'label' ).join(' ');
                    lib.setAttribute( label, 'for', main.id );

                    lib.insertAfter( label, main );
                    me.label = label;
                }

                // 初始化label的内容
                updateTitle( me );
                // 初始化disabled
                me.setDisabled ( !!me.disabled );

                //初始化rawValue
                me.setRawValue( main.value || 'on' );

                updateChecked( me );

                helper.initName( me );

                helper.addDOMEvent( me, me.main, 'click', lib.bind( clickHandler, null, me ) );

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
                this._label = null;

                InputControl.prototype.dispose.apply(this, arguments);
            }
        };

        lib.inherits( BoxControl, InputControl );

        return BoxControl;
    }
);