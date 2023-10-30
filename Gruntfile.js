module.exports = function (grunt) {
    var shakaPlayerUrls = {
        debug:
            "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.5.0/shaka-player.compiled.debug.js",
        production:
            "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.5.0/shaka-player.compiled.js"
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
                src: ["studiodrm.js"],
                dest: "dist/studiodrm.js"
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
                            pattern: "{studiodrmjs}",
                            replacement: "studiodrm.js"
                        }
                    ]
                }
            }
        },

        connect: {
            server: {
                options: {
                    protocol: "https",
                    hostname: "shaka.studiodrm.local",
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
    grunt.loadNpmTasks("grunt-string-replace");
    grunt.loadNpmTasks("grunt-contrib-connect");

    grunt.registerTask("build", [
        "clean",
        "copy",
        "concat",
        "string-replace"
    ]);
    grunt.registerTask("serve", ["build", "connect"]);
};
