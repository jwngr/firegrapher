/**************/
/*  REQUIRES  */
/**************/
var gulp = require("gulp");

// File IO
var sass = require("gulp-sass");
var karma = require("gulp-karma");
var concat = require("gulp-concat");
var jshint = require("gulp-jshint");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var streamqueue = require("streamqueue");

// Testing
var karma = require("gulp-karma");

// Live reload
var express = require("express");
var lrserver = require("tiny-lr")();
var refresh = require("gulp-livereload");
var livereload = require("connect-livereload");

/****************/
/*  FILE PATHS  */
/****************/
var paths = {
  destDir: "dist",

  scripts: {
    src: {
      dir: "src/",
      files: [
        "**/*.js"
      ]
    },
    dest: {
      dir: "dist/js/",
      files: {
        unminified: "firegrapher.js",
        minified: "firegrapher.min.js"
      }
    }
  },

  tests: {
    config: "tests/karma.conf.js",
    files: [
      "bower_components/firebase/firebase.js",
      "src/*.js",
      "tests/specs/*.spec.js"
    ]
  }
};


/***********/
/*  TASKS  */
/***********/
/* Lints, minifies, and concatenates the script files */
gulp.task("scripts", function() {
  // Concatenate all src files together
  var stream = streamqueue({ objectMode: true });
  stream.queue(gulp.src("build/header"));
  stream.queue(gulp.src(paths.scripts.src.dir + paths.scripts.src.files));
  stream.queue(gulp.src("build/footer"));

  // Output the final concatenated script file
  return stream.done()
    // Rename file
    .pipe(concat(paths.scripts.dest.files.unminified))

    // Lint
    .pipe(jshint())
    .pipe(jshint.reporter("jshint-stylish"))

    // Write un-minified version
    .pipe(gulp.dest(paths.scripts.dest.dir))

    // Minify
    .pipe(uglify())

    // Rename file
    .pipe(concat(paths.scripts.dest.files.minified))

    // Write minified version to the distribution directory
    .pipe(gulp.dest(paths.scripts.dest.dir));
});

/* Converts scss files to css in the /examples/ directory */
gulp.task("styles-examples", function () {
  return gulp.src("examples/**/*.scss")
    .pipe(sass({
      "outputStyle" : "compressed",
      "errLogToConsole": true
    }))
    .pipe(rename(function(path) {
        path.extname = ".css"
    }))
    .pipe(gulp.dest("./examples"));
});

/* Uses the Karma test runner to run the Jasmine tests */
gulp.task("test", function() {
  return gulp.src(paths.tests.files)
    .pipe(karma({
      configFile: paths.tests.config,
      action: "run"
    }))
    .on("error", function(err) {
      throw err;
    });
});

/* Runs tasks when certain files change */
gulp.task("watch", function() {
  gulp.watch(["build/*", paths.scripts.src.dir + paths.scripts.src.files], ["scripts", "reload"]);
  gulp.watch(["examples/**/*"], ["styles-examples", "reload"]);
});

/* Sets up the LiveReload server */
gulp.task("server", function() {
  var server = express();
  var livereloadPort = 35727;
  var serverPort = 3000;

  // Add livereload middleware before static-middleware
  server.use(livereload({
    port: livereloadPort
  }));

  // Set up tje static fileserver, which serves files in the source directory
  server.use(express.static(__dirname));

  // Set up the livereload server
  server.listen(serverPort);
  lrserver.listen(livereloadPort);
});

/* Reloads the LiveReload server */
gulp.task("reload", function(){
  gulp.src(paths.destDir + "/**/*")
   .pipe(refresh(lrserver));
});

/* Initiates the LiveReload server */
gulp.task("serve", ["scripts", "server", "watch"]);

/* Builds and tests the files by default */
gulp.task("default", ["scripts", "styles", "test"]);
