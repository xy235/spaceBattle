var gulp = require('gulp');
var gp_uglify = require('gulp-uglify');
var gp_jshint = require('gulp-jshint');
var gp_concat = require('gulp-concat');
var gp_rename = require('gulp-rename');
var gp_clean = require('gulp-clean');

var gp_util = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var babelify = require('babelify');
var browserify = require('browserify');
var watchify = require('watchify');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var less = require('gulp-less');
var path = require('path');


var runSequence = require('run-sequence');

//Browserify, Watchify
var extensions = ['.js'];
var browserifyOpts = {
	entries: ['./app/app.js'],
	debug: true
}
var opts = assign({}, watchify.args, browserifyOpts);
var b = watchify(browserify(opts));
b.transform(babelify.configure({
	extensions: extensions
}))
	.require('./app/app.js', { entry: true });
/*var b = watchify(browserify(opts).transform(babelify.configure({
		extensions: extensions
	}))
	.require('./app/app.js', {entry : true}));*/

function bundle() {
	return b.bundle()
		.on('error', function (e) {
			gp_util.log(e)
		})
		.pipe(source('bundle.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./build/js'));
}

//Clean
//Cleans the build directory
gulp.task('clean', function () {
	return gulp.src('/build/**/*', { read: false })
		.pipe(gp_clean());
});

//Browserify
gulp.task('browserify', bundle);
b.on('update', bundle);
b.on('log', gp_util.log);

/*gulp.task('browserify', function() {
	return browserify(browserifyOpts)
	.transform(babelify.configure({
		extensions: extensions
	}))
	.require('./app/app.js', {entry : true})
	.bundle()
	.on('error', function(e){
		gp_util.log(e)
	})
	.pipe(source('bundle.js'))
	.pipe(gulp.dest('./build/js'));
});*/

//Browserify ang Uglify
gulp.task('browserifyUglify', function () {
	var extensions = ['.js'];
	return browserify(browserifyOpts)
		.transform(babelify.configure({
			extensions: extensions
		}))
		.require('./app/app.js', { entry: true })
		.bundle()
		.on('error', function (e) {
			gp_util.log(e)
		})
		.pipe(source('bundle.js'))
		.pipe(buffer())
		//.pipe(gp_uglify())
		.pipe(gulp.dest('./build/js'));
});

//Copy
//Copy required libraries to the build folder
gulp.task('copy', function (callback) {
	var prefix = 'node_modules/'
	var files = [
		'node_modules/phaser/dist/phaser.min.js',
		'node_modules/jquery/dist/jquery.min.js',
		'node_modules/bootstrap/dist/js/bootstrap.min.js',
		'node_modules/bootstrap/dist/css/bootstrap.min.css',
		'node_modules/bootstrap/dist/css/bootstrap-theme.min.css',
		'app/game.html',
		'app/login/login.template.html',
		'app/sprites/**/*',
		'app/sounds/**/*'
	];

	var dests = [
		'js/',
		'js/',
		'js/',
		'css/',
		'css/',
		'app/',
		'app/login/',
		'img',
		'sounds'
	]

	for (var i = 0; i < files.length; i += 1) {
		gulp.src(files[i])
			.pipe(gulp.dest('build/' + dests[i]));
	}
	callback();
});

//Uglify Task
//Uglifies
/*gulp.task('uglify', function() {
	gulp.src('./build/bundle.js')
	.pipe(gp_uglify())
	.pipe(gulp.dest('build'));
});*/

//Styles Task
gulp.task('styles', function () {
	return gulp.src('./app/**/*.less')
		.pipe(less({
			paths: [path.join(__dirname, 'less', 'includes')]
		}))
		.pipe(gulp.dest('./build/css'));
});

//Lint
gulp.task('lint', function () {
	return gulp.src('app/*.js')
		.pipe(gp_jshint({ esversion: 6 }))
		.pipe(gp_jshint.reporter('jshint-stylish'));
});

//Watch Task
//Watches JS
gulp.task('watch', function () {
	gulp.watch('app/js/*.js', ['scripts', 'lint']);
});


gulp.task('default', function (callback) {
	runSequence('clean', 'lint', 'copy', 'browserifyUglify', 'styles', callback);
});

gulp.task('dev', function (callback) {
	runSequence('clean', 'lint', 'copy', 'browserify', 'styles', callback);
});