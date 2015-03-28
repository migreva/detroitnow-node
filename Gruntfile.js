module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      watch: {
        files: [{
          cwd: './public/javascripts/src',
          expand: true,     // Enable dynamic expansion.
          src: ['*.js'], // Actual pattern(s) to match.
          dest: './public/javascripts/dist',
          ext: '.js',   // Dest filepaths will have this extension.
          extDot: 'first'   // Extensions in filenames begin after the first dot
        }],
        options: {
          watch: true,
          keepAlive: true
        }
      },
      browserifyOptions: {

      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
}