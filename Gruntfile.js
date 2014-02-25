module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        karma: {
            options: {
                basePath: '',

                frameworks: ['jasmine', 'browserify'],

                preprocessors: {
                    'test/setup.js': ['browserify'],
                    'test/documentation-spec.js': ['react-jsx'],
                    'test/jasmine-react-spec.js': ['react-jsx'],

                },

                files: [
                    'test/setup.js',
                    'jasmine-react.js',
                    'test/documentation-spec.js',
                    'test/jasmine-react-spec.js'
                ],

                reporters: ['progress'] 
            },

            dev: {
                browsers: ['Firefox', 'Chrome', 'PhantomJS'],
                autoWatch: true
            },

            chrome: {
                browsers: ['Chrome'],
                autoWatch: true
            },

            firefox: {
                browsers: ['Firefox'],
                autoWatch: true
            },

            phantomjs: {
                browsers: ['PhantomJS'],
                autoWatch: true
            },

            unit: {
                browsers: ['PhantomJS'],
                autoWatch: false,
                singleRun: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-karma');

};
