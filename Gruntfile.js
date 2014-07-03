module.exports = function(grunt) {

    grunt.initConfig({
        jsbeautifier: {
            files: [
                // 'static/js/**/*',
                'server.js',
                'routes/**/*',
                'lib/*',
                'routes.json',
                'controllers/**/*',
                'models/**/*',
                'config/**/*',
                'Gruntfile.js'
            ],
            options: {}
        }
    });

    grunt.loadNpmTasks('grunt-jsbeautifier');

    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('beautify', ['jsbeautifier']);

};
