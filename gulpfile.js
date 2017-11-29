var gulp = require("gulp");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var tsProject = ts.createProject("tsconfig.json");
var del = require("del");
var exec = require("child_process");
var node;

gulp.task("lint:ts", function () {
    return gulp.src("src/**/*.ts")
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report())
});

gulp.task('clean:dist', function () {
    return del([
        'dist/**/*'
    ]);
});

gulp.task("build:ts", ["lint:ts", "clean:dist"], function () {
    return gulp.src("src/**/*.ts")
        .pipe(tsProject())
        .pipe(gulp.dest("dist"));
});

gulp.task("compile:ts", ["lint:ts"], function () {
    return gulp.src("src/**/*.ts")
        .pipe(tsProject())
        .pipe(gulp.dest("dist"));
});

gulp.task("service:ts", function() {
    if (node) {
        node.kill();
    } else {
        node = exec.spawn('node', ['dist/app.js'], { stdio: 'inherit' })
        node.on('close', function (code) {
            if (code === 8) {
                gulp.log('Error detected, waiting for changes...');
            }
        });
    }
});

gulp.task("watch:ts", ["compile:ts"], function () {
    gulp.run("service:ts");
    gulp.watch("src/**/*.ts", ["compile:ts"], function () {
        gulp.run("service:ts");
    });
});

gulp.task("default", ["compile:ts"]);
