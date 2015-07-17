exports.defineAutoTests = function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    var zip = require('cordova-plugin-zip.Zip');
    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

    describe('Zip', function () {
        var fail = function(done, why) {
            if (typeof why !== 'undefined') {
                console.error(why);
            }
            expect(true).toBe(false);
            done();
        };

        it("should be defined", function() {
            expect(zip.unzip).toBeDefined();
            expect(zip.zip).toBeDefined();
        });

        var fileWasDownloaded = false;
        describe("unzip", function() {

            var fileUrl = null;
            var dirUrl = null;

            beforeEach(function(done) {
                if (fileWasDownloaded) return done();


                var onError = fail.bind(null, function(){
                    console.log("FAILED LOADING");
                });

                var xhr = new XMLHttpRequest();
                xhr.open('GET', 'http://skkrm/static/static.zip', true);
                xhr.responseType = 'blob';
                xhr.onerror = onError;
                xhr.onload = function(e) {

                    window.requestFileSystem(PERSISTENT, 1024 * 1024, function(fs) {
                        fs.root.getFile('static.zip', {create: true}, function(fileEntry) {
                            fileEntry.createWriter(function(writer) {

                                writer.onwrite = done;
                                writer.onerror = onError;

                                fileUrl = fileEntry.toURL();
                                fileWasDownloaded = true;

                                var blob = new Blob([xhr.response]);
                                writer.write(blob);

                            }, onError);
                        }, onError);

                        fs.root.getDirectory('zipOutput', {create: true}, function(fileEntry) {
                            dirUrl = fileEntry.toURL();
                        }, onError);
                    }, onError);
                };

                xhr.send();
            });

            it("should unzip", function(done) {
                zip.unzip(fileUrl, dirUrl, function(result) {
                    expect(result).toBe(0);
                    console.error(result);
                    done();
                });
            });

            it("should have progress events", function(done) {
                var progress = 0;
                zip.unzip(fileUrl, dirUrl, function(result) {
                    expect(result).toBe(0);
                    done();
                }, function(progressEvent) {
                    progress = progressEvent.loaded / progressEvent.total;
                    console.log(progress);
                });
            });
        });
        describe("zip", function(){
            var filesPaths = [];
            var filesNames = [];
            var archive_url = "";
            beforeEach(function(done) {
                function onError(){
                    console.error("ERROR creating test files");
                }
                var filesCnt = 4;
                function doneFunc(){
                    filesCnt--;
                    if (filesCnt==0) {
                        done();
                    }
                }
                function createFile(fileName, text, dirName, dir){
                    dir.getFile(fileName+'.txt', {create: true}, function(fileEntry) {
                        fileEntry.createWriter(function(writer) {

                            writer.onwrite = doneFunc;
                            writer.onerror = onError;

                            filesPaths.push(fileEntry.toURL());
                            filesNames.push(dirName+"/"+fileName+".txt");

                            var blob = new Blob([text]);
                            writer.write(blob);

                        }, onError);
                    }, onError);
                };
                function createDir(dirName, dir, succ){
                    dir.getDirectory(dirName + "", {create: true}, succ, onError);
                };

                window.requestFileSystem(PERSISTENT, 1024 * 1024, function(fs) {
                    for (var i = 0; i<2; i++){
                        (function(i){
                            createDir(i, fs.root, function(dirEntry){
                                createFile(i+"filetop", "filetop", i+"", dirEntry );
                                createDir("sub", dirEntry, function(subdir){
                                    createFile(i+"subfile", "test", i+"/sub", subdir);
                                });
                            });
                        })(i);
                    }
                    fs.root.getFile('new_archive.zip', {create: true}, function(fileEntry) {
                        archive_url = fileEntry.toURL();
                    });
                }, onError);
            });

            it("called ok", function(done) {
                zip.zip(archive_url, filesPaths, filesNames,
                        function(){
                            console.log("HERE");
                        });
            })
        });
    });
};
