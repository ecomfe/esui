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
            location: '../dep/mini-event/0.8.0/src',
            main: 'main'
        },
        {
            name: 'underscore',
            location: '../dep/underscore/1.4.4/src',
            main: 'underscore'
        }
    ]
});
document.createElement('header');