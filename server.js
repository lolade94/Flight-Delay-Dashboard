var express= require('express');

var app= express();

var port = process.env.PORT || 3222;

app.use(express.static(__dirname));


app.listen(port, function(){
  console.log("Serving is running: " + port);
});