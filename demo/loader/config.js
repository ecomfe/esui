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
        }
    ]
});
document.createElement('header');