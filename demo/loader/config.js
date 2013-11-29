require.config({
    paths: {
        css: 'loader/css'
    },
    packages: [
        {
            name: 'esui',
            location: '../src'
        },
        {
            name: 'mini-event',
            location: '../dep/mini-event/1.0.0/src',
            main: 'main'
        },
        {
            name: 'underscore',
            location: '../dep/underscore/1.4.4/src',
            main: 'underscore'
        },
        {
            name: 'moment',
            location: '../dep/moment/2.0.0/src',
            main: 'moment'
        }
    ]
});
document.createElement('header');