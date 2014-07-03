module.exports = function(grunt) {

    grunt.initConfig({
        jsbeautifier: {
            files: [
                'index.js',
                'Gruntfile.js'
            ],
            options: {}
        }
    });

    grunt.loadNpmTasks('grunt-jsbeautifier');

    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('beautify', ['jsbeautifier']);

};
