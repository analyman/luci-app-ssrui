var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var tsify = require('tsify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');

gulp.task('default', gulp.series(gulp.parallel('copy-html'), function () {
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
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
}));
