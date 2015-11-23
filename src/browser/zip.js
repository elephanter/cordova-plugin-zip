
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
                console.log("EVENT", e);
                var zip = new jszip(e.target.result);

                for(var file in zip.files){
                    if(!zip.files.hasOwnProperty(file)) return;

                    unzipfile(file);

                }

                function unzipfile(file, next){
                    var fileName = zip.files[file].name,
                        filePath = [];

                    console.log("unzipping file ", fileName);

                    if(fileName.indexOf("/") > 1){
                        var filePath = fileName.split("/");
                        filePath.pop();
                        var i = 1,
                            tmpZip = zip.folder(filePath[0]);
                        while(i < filePath.length){
                            tmpZip = tmpZip.folder(filePath[i]);
                            i++;
                        }
                    }

                    archive = zip.file(fileName).asArrayBuffer();

                    window.webkitResolveLocalFileSystemURL(dest, function (entry) {

                        function createDirs(path, callback, fail, position){
                            console.log(path)
                            position = (typeof position == 'undefined')? 0: position;
                            console.log("ENTRY", entry);

                            var dirEntry = entry;

                            var path_split 		= path.split('/');
                            var new_position 	= position+1;
                            var sub_path 		= path_split.slice(0,new_position).join('/');

                            console.log('DirManager','mesg', 'path:'+sub_path,'DirManager');



                            var inner_callback = function(obj){
                                return function(){
                                    console.log('DirManager','mesg','inner_callback:'+path);

                                    createDirs(path, callback, fail, new_position);
                                }
                            };


                            if(new_position == path_split.length){
                                dirEntry.getDirectory(sub_path,{create:true, exclusive: false}, callback, fail);
                            }
                            else
                            {
                                dirEntry.getDirectory(sub_path,{create:true, exclusive: false}, inner_callback(this), fail);
                            }
                        }

                        createDirs(filePath.join("/"), function () {

                            entry.getFile(fileName, {create: true, exclusive: false}, function (entry) {
                                entry.createWriter(function (writer) {
                                    writer.onwrite = function (e) {
                                        console.log("file unzipped");
                                        console.log(zip);
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

                        });
                    }, function (err) {
                        console.log(err);
                        fail();
                    });



                }



            };

            entry.file(function (file) {
                reader.readAsArrayBuffer(file);
            });

        }, function (err) {
            console.log(err);
            fail();

        });

    },

    zip : function zip (win, fail, args) {
        var archFileName = args[0],
            inputFiles   = typeof args[1] == "array" ? args[1] : [args[1]],
            zipNames     = typeof args[2] == "array" ? args[2] : [args[2]];

        var zip = new jszip();

        for(var i in inputFiles){
            var file = inputFiles[i];
            var name = zipNames[i] || "unnamed";

            window.webkitResolveLocalFileSystemURL(file, function (entry) {
                var reader = new FileReader();

                reader.onloadend = function (e) {
                    zip.file(name, e.target.result);

                    if(i !== inputFiles.length-1) return;

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

    }

};

require("cordova/exec/proxy").add("Zip", module.exports);