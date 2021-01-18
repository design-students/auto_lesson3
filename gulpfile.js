"use strict";
// Plugins
const gulp = require('gulp'),// gulp plugin as gulp
    sass = require('gulp-sass'),// compile scss to css
    prefixer = require('gulp-autoprefixer'),// add or remove vendor prefixes
    plumber = require('gulp-plumber'),// error handler
    rigger = require('gulp-rigger'),// utility to combine files
    terser = require('gulp-terser'),// compress js files
    htmlmin = require('gulp-htmlmin'),// compress html files
    realFavicon = require ('gulp-real-favicon'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    browserSync = require('browser-sync'),// webserver
    reload = browserSync.reload;

// Variable routes
const path ={
    build:{
        all:'build/',
        html:'build/',
        scss:'build/css/',
        js:'build/js/',
        fonts:'build/fonts/'
    },
    src:{
        html:'src/**/*.{html,htm}',
        scss:'src/scss/main.scss',
        js:'src/js/app.js',
        fonts:['node_modules/@fortawesome/fontawesome-free/webfonts/*.{eot,svg,woff,woff2,ttf}']
    },
    watch:{
        html:'src/**/*.{html,htm}',
        scss:'src/scss/**/*.scss',
        js:'src/js/**/*.js',
        fonts:['node_modules/@fortawesome/fontawesome-free/webfonts/*.{eot,svg,woff,woff2,ttf}']
    },
    clean:'build/'
},
    config = {
        server:{
            baseDir:'build/',
            index:'index.html',
        },
        host:'localhost',
        tunnel:true,
        port:7787
    };

gulp.task('clean',function (done) {
    rimraf(path.clean, done);
});

gulp.task('mv:fonts',function (done) {
   gulp.src(path.src.fonts)
       .pipe(gulp.dest(path.build.fonts))
       .pipe(reload({stream:true}));
    done();
});

gulp.task('dev:scss',function (done) {
    gulp.src(path.src.scss,{sourcemaps:true})
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'compressed',
            sourcemaps:true
        }))
        .pipe(prefixer({cascade: true}))
        .pipe(gulp.dest(path.build.scss,{sourcemaps:'.'}))
        .pipe(reload({stream:true}));
    done();
});

gulp.task('prod:scss',function (done) {
    gulp.src(path.src.scss)
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        .pipe(prefixer({cascade: true}))
        .pipe(gulp.dest(path.build.scss))
        .pipe(reload({stream:true}));
    done();
});

gulp.task('dev:html',function (done) {
    gulp.src(path.src.html)
        .pipe(plumber())
        .pipe(htmlmin({
            collapseWhitespace:true,
            html5:true
        }))
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream:true}));
    done();
});

gulp.task('dev:js',function (done) {
    gulp.src(path.src.js)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(terser())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream:true}));
    done();
});

const  FAVICON_DATA_FILE = 'faviconData.json';

// Generate the icons. This task takes a few seconds to complete.
// // You should run it at least once to create the icons. Then,
// // you should run it whenever RealFaviconGenerator updates its
// // package (see the check-for-favicon-update task below).
gulp.task('generate-favicon', function(done) {
    realFavicon.generateFavicon({
        masterPicture: 'src/favicon/virus.svg',
        dest: 'build/favicons/',
        iconsPath: '/favicons/',
        design: {
            ios: {
                pictureAspect: 'backgroundAndMargin',
                backgroundColor: '#ffffff',
                margin: '14%',
                assets: {
                    ios6AndPriorIcons: false,
                    ios7AndLaterIcons: false,
                    precomposedIcons: false,
                    declareOnlyDefaultIcon: true
                }
            },
            desktopBrowser: {
                design: 'raw'
            },
            windows: {
                pictureAspect: 'whiteSilhouette',
                backgroundColor: '#00a300',
                onConflict: 'override',
                assets: {
                    windows80Ie10Tile: false,
                    windows10Ie11EdgeTiles: {
                        small: false,
                        medium: true,
                        big: false,
                        rectangle: false
                    }
                }
            },
            androidChrome: {
                pictureAspect: 'backgroundAndMargin',
                margin: '17%',
                backgroundColor: '#ffffff',
                themeColor: '#ffffff',
                manifest: {
                    display: 'standalone',
                    orientation: 'notSet',
                    onConflict: 'override',
                    declared: true
                },
                assets: {
                    legacyIcon: false,
                    lowResolutionIcons: false
                }
            },
            safariPinnedTab: {
                pictureAspect: 'silhouette',
                themeColor: '#5bd586'
            }
        },
        settings: {
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false,
            readmeFile: false,
            htmlCodeFile: false,
            usePathAsIs: false
        },
        markupFile: FAVICON_DATA_FILE
    }, function() {
        done();
    });
});

// Inject the favicon markups in your HTML pages. You should run
// this task whenever you modify a page. You can keep this task
// as is or refactor your existing HTML pipeline.
gulp.task('inject-favicon-markups', function() {
    return gulp.src([ 'src/index.html' ])
        .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
        .pipe(gulp.dest('src/'));
});

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('check-for-favicon-update', function(done) {
    var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
    realFavicon.checkForUpdates(currentVersion, function(err) {
        if (err) {
            throw err;
        }
    });
});

gulp.task('webserver',function (done) {
    browserSync(config);
    done();
});

gulp.task('watch',function (done) {
    gulp.watch(path.watch.html,gulp.series('dev:html'));
    gulp.watch(path.watch.scss,gulp.series('dev:scss'));
    gulp.watch(path.watch.fonts,gulp.series('mv:fonts'));
    done();
});

// Tasks
gulp.task('default', gulp.series('clean', gulp.parallel('generate-favicon','dev:html','dev:scss','mv:fonts','dev:js'),'watch','webserver'));
