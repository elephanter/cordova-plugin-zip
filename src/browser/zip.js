
var jszip = require("./jszip");


module.exports = {

    unzip: function unzip(win, fail, args) {

        var fileName = args[0],
            dest = args[1];
        var fileURL = encodeURI(fileName);
        var archive = "empty";

        window.webkitResolveLocalFileSystemURL(fileURL, function (entry) {
            var reader = new FileReader();

            reader.onloadend = function (e) {
                var zip = new jszip(e.target.result);

                for(var file in zip.files){
                    if(!zip.files.hasOwnProperty(file)) return;

                    archive = zip.file(zip.files[file].name).asText();

                    window.webkitResolveLocalFileSystemURL(dest, function (entry) {

                        entry.getFile(zip.files[file].name, {create: true, exclusive: false}, function (entry) {
                            entry.createWriter(function (writer) {
                                writer.onwrite = function (e) {
                                    win();
                                };

                                writer.write(new Blob([archive], {type: "text/plain"}));
                            }, function (err) {
                                console.log(err);
                                fail();
                            })
                        }, function (err) {
                            console.log(err);
                            fail();
                        });


                    }, function (err) {
                        console.log(err);
                        fail();
                    });
                }


            };

            entry.file(function (file) {
                reader.readAsText(file);
            });

        }, function (err) {
            console.log(err);
            fail();

        });

    },

    zip : function zip (win, fail, args) {
        var archFileName = args[0],
            inputFiles   = args[1],
            zipNames     = args[2];

            window.webkitResolveLocalFileSystemURL(inputFiles, function (entry) {
                var reader = new FileReader();

                reader.onloadend = function (e) {
                    var zip = new jszip();
                    zip.file(zipNames, e.target.result);
                    archive = zip.generate({type:"blob"});

                    entry.getParent(function (entry) {
                        entry.getFile(archFileName, {create: true, exclusive: false}, function (entry) {
                            entry.createWriter(function (writer) {
                                writer.onwrite = function (e) {
                                    win();
                                };
                                writer.write(archive);
                            }, function (err) {
                                console.log(err);
                                fail();
                            })
                        }, function (err) {
                            console.log(err);
                            fail();
                        });
                    });



                };

                entry.file(function (file) {
                    reader.readAsText(file);
                });

            }, function (err) {
                console.log(err);
                fail();

            });


    }

};

require("cordova/exec/proxy").add("Zip", module.exports);