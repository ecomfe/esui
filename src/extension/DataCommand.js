define(
    function (require) {
        var helper    = require('../controlHelper');
        var Extension = require('../Extension');

        function DataCommand() {
            Extension.apply(this, arguments);
        }

        var commandQueueKey = '__esuiDataCommandQueue';

        DataCommand.prototype = {

            _dataCommandHandler : function( control, element, type, handler, scope ){
                return function(e){
                    var evt = e || window.event;
                    var first = true;
                    var main;
                    var commandType = 'data-command-' + evt.type ;
                    var cur = e.target || e.srcElement;

                    while(true){
                        if ( cur.nodeType === 1 && ( cur.disabled !== true || evt.type !== "click" ) ) {
                            var commandName = cur.getAttribute( commandType );
                            if( commandName ){
                                var commandArgs = cur.getAttribute( 'data-command-args' );
                                var main = main || require('../main');
                                commandArgs = main.parseAttribute( commandArgs );
                                handler.call(
                                        ( scope || control ),
                                        {   control : control,
                                            element : cur,
                                            commandType : evt.type,
                                            commandName : commandName,
                                            commandArgs : commandArgs
                                        }, 
                                        evt);
                            }
                        }

                        if( cur == element ){
                            break;
                        }

                        cur = cur.parentNode || element ;   
                    }
                };
            },

            activate : function(){

                var target = this.target;
                var _dataCommandHandler = this._dataCommandHandler;

                target.addDataCommand = function ( element, type, handler, scope ) {

                    var commandQueue = this[ commandQueueKey ] = this[ commandQueueKey ] || [];
                    var commandHandler = _dataCommandHandler( this, element, type, handler, scope );
                    var commandItem = { element : element,
                                        type : type,
                                        handler : commandHandler,
                                        id : helper.getGUID()
                    };

                    commandQueue.push( commandItem );

                    helper.addDOMEvent( this, commandItem.element, commandItem.type , commandItem.handler ); 

                    return commandItem.id ;
                };

                target.removeDataCommand = function ( element, type, id ) {
                    var commandQueue = this[ commandQueueKey ] = this[ commandQueueKey ] || [];
                    var i = commandQueue.length;
                    while( i-- ){
                        var commandItem = commandQueue[i];   
                        if( ( !element || commandItem.element == element )
                         && ( !type || commandItem.type == type )
                         && ( !id || commandItem.id == id ) ){
                            helper.removeDOMEvent( this, commandItem.element, commandItem.type , commandItem.handler );
                        }
                    }
                }; 

            },

            inactivate : function(){
                var target = this.target;
                Extension.prototype.inactivate.apply(this, arguments);

                target.removeDataCommand && target.removeDataCommand();

                delete target[ commandQueueKey ];
                delete target.addDataCommand;
                delete target.removeDataCommand;
            }

        }

        require('../lib').inherits(DataCommand, Extension);

        return DataCommand;
    }
);