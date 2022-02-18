module.exports = function (grunt) {
    var shakaPlayerUrls = {
        debug:
            "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/3.3.2/shaka-player.compiled.debug.js",
        production:
            "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/3.3.2/shaka-player.compiled.js"
    };

    grunt.initConfig({
        package: grunt.file.readJSON("package.json"),

        clean: ["dist/*"],

        copy: {
            all: {
                expand: true,
                src: ["index.html"],
                dest: "dist/",
                flatten: true
            }
        },

        concat: {
            options: {},
            dist: {
                src: ["vuplay.js"],
                dest: "dist/vuplay.js"
            }
        },

        uglify: {
            js: {
                files: {
                    "dist/vuplay.min.js": ["dist/vuplay.js"]
                }
            }
        },

        "string-replace": {
            dist: {
                files: [
                    {
                        src: "dist/index.html",
                        dest: "dist/index.html"
                    }
                ],
                options: {
                    replacements: [
                        {
                            pattern: "{shaka}",
                            replacement: grunt.option("debug")
                                ? shakaPlayerUrls.debug
                                : shakaPlayerUrls.production
                        },
                        {
                            pattern: "{vuplayjs}",
                            replacement: grunt.option("debug")
                                ? "vuplay.js"
                                : "vuplay.min.js"
                        }
                    ]
                }
            }
        },

        connect: {
            server: {
                options: {
                    protocol: "https",
                    hostname: "shaka.vuplay.local.drm.technology",
                    port: 14705,
                    base: "dist",
                    keepalive: true
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-string-replace");
    grunt.loadNpmTasks("grunt-contrib-connect");

    grunt.registerTask("build", [
        "clean",
        "copy",
        "concat",
        "uglify",
        "string-replace"
    ]);
    grunt.registerTask("serve", ["build", "connect"]);
};
