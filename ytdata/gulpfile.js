var gulp = require("gulp");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var tsProject = ts.createProject("../tsconfig.json");
var del = require("del");

gulp.task("lint:ts", function () {
    return gulp.src("src/**/*.ts")
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report())
});

gulp.task("clean:dist", function () {
    return del([
        "dist/**/*"
    ]);
});

gulp.task("compile:ts", ["clean:dist", "lint:ts"], function() {
    return gulp.src("src/**/*.ts")
        .pipe(tsProject())
        .pipe(gulp.dest("dist/"));
});

gulp.task("default", ["compile:ts"]);
