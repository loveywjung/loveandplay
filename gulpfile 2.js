var gulp = require('gulp'),
    clean = require('gulp-clean'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    minifyhtml = require('gulp-minify-html'),
    minifyCss = require('gulp-minify-css'),
    browserSync = require('browser-sync').create();

gulp.task('server:src', function() {
  browserSync.init({
    server: {
      baseDir: 'src'
    }
  });
  gulp.watch('src/**/*.js', ['jshint'], browserSync.reload);
  gulp.watch('src/**/*.html', browserSync.reload);
});

gulp.task('server:dist', function() {
  browserSync.init({
    server: {
      baseDir: 'dist'
    }
  });
});

gulp.task('jshint', function() {
  return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('uglify', ['clean:dist'], function() {
  return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist'));
});

gulp.task('minifyhtml', function() {
  return gulp.src('src/**/*.html')
    .pipe(replace('tad.js', 'tad.min.js'))
    .pipe(minifyhtml())
    .pipe(gulp.dest('dist'));
});

gulp.task('minifycss', function() {
  return gulp.src('src/**/*.css')
    .pipe(minifyCss())
    .pipe(gulp.dest('dist'));
});

gulp.task('clean:dist', function() {
  return gulp.src('dist/**/*.*')
    .pipe(clean());
});

gulp.task('default', ['server:src']);
gulp.task('build', ['uglify', 'minifycss', 'minifyhtml']);
