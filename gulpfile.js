(function() {
  'use strict';

  var paths = require('./package.json').paths;
  var gulp  = require('gulp');
  var es    = require('event-stream');
  var gutil = require('gulp-util');
  var conf  = require('./.conf.json');
  var $     = require('gulp-load-plugins')({
    pattern: [
      'gulp-*', 'gulp.*', 'del', 'mkdirp'
    ],
    rename: {
      'gulp-scss-lint':         'sassLint',
      'gulp-scss-lint-stylish': 'sassLintStylish'
    },
    replaceString: /\bgulp[\-.]/
  });
  $.browserSync = require('browser-sync').create();

  var changeEvent = function(event) {
    gutil.log(
      'File',
      gutil.colors.yellow(event.path.replace(__dirname, '')),
      'was',
      gutil.colors.blue(event.type)
    );
  };

  gulp.task('default', ['serve']);

  /**
   * Server task
   */

  gulp.task('serve', ['build'], function() {
    $.browserSync.init({
      server: {
        baseDir: paths.build.base,
      },
      port: 1337,
      open: true,
      browser: 'default',
      notify: false
    });

    gulp.watch(paths.source.styles + "**/*.scss", ['build:styles'])
      .on('change', changeEvent);
    gulp.watch(paths.source.scripts + "**/*.js", ['build:scripts'])
      .on('change', changeEvent);
    gulp.watch(paths.source.images + "**/*.(jpg|png)", ['build:assets'])
      .on('change', changeEvent);
    gulp.watch(paths.source.html + '**/*.html', ['build:html'])
      .on('change', changeEvent);
  });

  /**
   * Watcher tasks
   */

  gulp.task('watch', [
    'watch:scripts', 'watch:styles', 'watch:html', 'watch:images'
  ]);

  gulp.task('watch:scripts', ['build:scripts'], function(cb) {
    var watcher = gulp.watch(paths.source.scripts + '**/*.js', [
      'build:scripts'
    ]);
    watcher.on('change', changeEvent);
    cb();
  });

  gulp.task('watch:styles', ['build:styles'], function(cb) {
    var watcher = gulp.watch(paths.source.styles + '**/*.scss', [
      'build:styles'
    ]);
    watcher.on('change', changeEvent);
    cb();
  });

  gulp.task('watch:html', ['build:html'], function(cb) {
    var watcher = gulp.watch(paths.source.html + '**/*', [
      'build:html'
    ]);
    watcher.on('change', changeEvent);
    cb();
  });

  gulp.task('watch:images', ['build:images'], function(cb) {
    var watcher = gulp.watch(paths.source.images + '**/*', [
      'build:images'
    ]);
    watcher.on('change', changeEvent);
    cb();
  });

  /**
   * Build tasks
   */

  gulp.task('build', [
    'build:scripts', 'build:styles', 'build:images', 'build:html'
  ]);

  gulp.task('build:scripts', ['clean:scripts', 'lint:scripts'], function(cb) {
    $.mkdirp(paths.build.scripts);
    gulp.src(paths.source.scripts + '**/*.js')
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe(gulp.dest(paths.build.scripts))
      .pipe($.uglify({
        preserveComments: 'some' // Should be 'license', but that's dead
      }))
      .pipe($.rename({suffix: '.min'}))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(paths.build.scripts))
      .pipe($.browserSync.stream());
    cb();
  });

  gulp.task('build:styles', ['clean:styles', 'lint:styles'], function(cb) {
    $.mkdirp(paths.build.styles);
    gulp.src(paths.source.styles + '**/*.scss')
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass({
        style: 'compressed',
        includePaths: require('node-bourbon').includePaths
      }))
      .pipe($.autoprefixer())
      .pipe(gulp.dest(paths.build.styles))
      .pipe($.minifyCss())
      .pipe($.rename({suffix: '.min'}))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(paths.build.styles))
      .pipe($.browserSync.stream());
    cb();
  });

  gulp.task('build:html', ['clean:html'], function(cb) {
    gulp.src(paths.source.html + '**/*.html')
      .pipe($.plumber())
      .pipe($.replace(/{{([a-z\-]+)}}/gim, function(match, varName) {
        if (conf.replace.hasOwnProperty(varName)) {
          return conf.replace[varName];
        }
      }))
      .pipe(gulp.dest(paths.build.html))
      .pipe($.browserSync.stream());
    cb()
  });

  gulp.task('build:images', ['clean:images'], function() {
    $.mkdirp(paths.build.images);
    gulp.src(paths.source.images + '**/*')
      .pipe($.plumber())
      .pipe(gulp.dest(paths.build.images))
      .pipe($.browserSync.stream());
  });

  /**
   * Lint tasks
   */

  gulp.task('lint:scripts', function(cb) {
    gulp.src([paths.source.scripts + '**/*.js', '!**/external/*.js'])
      .pipe($.plumber())
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
    cb();
  });

  gulp.task('lint:styles', function(cb) {
    gulp.src(paths.source.styles + '**/*.scss')
      .pipe($.plumber())
      .pipe($.sassLint({
        config: '.scss-lint.yml',
        customReport: $.sassLintStylish
      }));
    cb();
  });

  /**
   * Cleanup tasks
   */

  gulp.task('clean', function(cb) {
    $.del(paths.build.base);
    $.mkdirp(paths.build.base);
    cb();
  });

  gulp.task('clean:scripts', function(cb) {
    $.del([
      paths.build.scripts + '**/*.js',
      paths.build.scripts + '**/*.js.map'
    ], cb);
  });

  gulp.task('clean:styles', function(cb) {
    $.del([
      paths.build.styles + '**/*.css',
      paths.build.styles + '**/*.css.map'
    ], cb);
  });

  gulp.task('clean:images', function(cb) {
    $.del([
      paths.build.images + '*'
    ], cb);
  });

  gulp.task('clean:html', function(cb) {
    $.del([
      paths.build.html + '**/*.html'
    ], cb);
  });

})();
