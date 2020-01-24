var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var tsify = require('tsify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');

var sass = require('gulp-sass');
sass.compiler = require('dart-sass');

gulp.task("ts2js", function () {
        return browserify({
                    basedir: '.',
                    debug: true,
                    entries: ['./ts/fucking.ts'],
                    cache: {},
                    packageCache: {}
                })
        .plugin(tsify)
        .transform('babelify', {
                    presets: ['es2015'],
                    extensions: ['.ts']
                })
        .bundle()
        .pipe(source('fucking.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
});

gulp.task("sass", function() {
    return gulp.src("./css/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("./dist"));
});

gulp.task("default", gulp.parallel("ts2js", "sass"));

